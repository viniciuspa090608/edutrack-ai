import { randomUUID } from 'node:crypto';
import {
  completedBoundary,
  flattenRoadmap,
  regenerateStepsSchema,
  restorationRequestSchema,
  confirmRevisionSchema,
  revisionPreviewSchema,
} from '@study-platform/contracts';
import type {
  Roadmap,
  SequenceStep,
  RevisionPreview,
} from '@study-platform/contracts';
import type { SubjectsService } from './subjects.service.js';
import type { PreferencesService } from '../preferences/preferences.service.js';
import type { RoadmapAIService } from '../ai/roadmap-ai.service.js';
import type { RevisionReceipt } from './revision-receipt.js';
import {
  prefixHash,
  regenerationAnchor,
  validSequence,
  revisionConflict,
  protectedError,
} from './roadmap-sequence.js';
import { HttpError } from '../../shared/http-error.js';
import type { z } from 'zod';
function parse<T>(schema: z.ZodType<T>, input: unknown) {
  const parsed = schema.safeParse(input);
  if (!parsed.success)
    throw new HttpError(400, 'INVALID_INPUT', 'Revise os dados da prévia.');
  return parsed.data;
}
function similarities(steps: SequenceStep[]) {
  const warnings: string[] = [];
  const tokens = (title: string) =>
    new Set(
      title
        .normalize('NFKC')
        .toLocaleLowerCase('pt-BR')
        .split(/\W+/u)
        .filter((word) => word.length > 2),
    );
  for (let i = 0; i < steps.length && warnings.length < 20; i++) {
    const left = tokens(steps[i]!.title);
    for (let j = i + 1; j < steps.length && warnings.length < 20; j++) {
      const right = tokens(steps[j]!.title),
        common = [...left].filter((word) => right.has(word)).length;
      if (common && common / Math.max(left.size, right.size) >= 0.5)
        warnings.push(
          `Revise a possível semelhança entre os passos ${i + 1} e ${j + 1}.`,
        );
    }
  }
  return warnings;
}
export class RoadmapRevisionsService {
  constructor(
    private readonly subjects: SubjectsService,
    private readonly prefs: PreferencesService,
    private readonly ai: RoadmapAIService,
    private readonly receipts: RevisionReceipt,
  ) {}
  private async current(userId: string, subjectId: string, roadmapId: string) {
    return this.subjects.roadmapDetail(userId, subjectId, roadmapId);
  }
  private preview(
    userId: string,
    subjectId: string,
    current: Roadmap,
    prefix: SequenceStep[],
    suffix: SequenceStep[],
    origin: RevisionPreview['origin'],
    sourceRevision: number | null,
  ) {
    const steps = [...prefix, ...suffix];
    validSequence(steps);
    return revisionPreviewSchema.parse({
      roadmapId: current.id,
      baseRevision: current.revision,
      preservedCount: prefix.length,
      steps,
      origin,
      sourceRevision,
      warnings: similarities(steps),
      ...this.receipts.issue({
        userId,
        subjectId,
        roadmapId: current.id,
        baseRevision: current.revision,
        origin,
        sourceRevision,
        preservedCount: prefix.length,
        prefixHash: prefixHash(prefix),
        suffixIds: suffix.map((step) => step.id),
      }),
    });
  }
  async generate(
    userId: string,
    subjectId: string,
    roadmapId: string,
    input: unknown,
  ) {
    await this.prefs.requireEnabled(userId, 'ai');
    const current = await this.current(userId, subjectId, roadmapId);
    const parsed = parse(regenerateStepsSchema, input),
      { prefix, suffix } = regenerationAnchor(current, parsed);
    const proposed = await this.ai.generateSuffix(
        userId,
        subjectId,
        prefix,
        suffix,
      ),
      anchor = prefix.at(-1)!;
    const generated = proposed.map((step) => ({
      ...step,
      id: randomUUID(),
      completed: false,
      blockTitle: anchor.blockTitle,
      blockDescription: anchor.blockDescription,
    }));
    const refreshed = await this.current(userId, subjectId, roadmapId);
    if (refreshed.revision !== current.revision) throw revisionConflict();
    try {
      return this.preview(
        userId,
        subjectId,
        current,
        prefix,
        generated,
        'ia',
        null,
      );
    } catch (error) {
      if (error instanceof HttpError && error.status === 400)
        throw new HttpError(
          502,
          'AI_INVALID_RESPONSE',
          'A continuação tem passos repetidos ou excede os limites. Tente novamente.',
        );
      throw error;
    }
  }
  async restore(
    userId: string,
    subjectId: string,
    roadmapId: string,
    input: unknown,
  ) {
    const current = await this.current(userId, subjectId, roadmapId),
      parsed = parse(restorationRequestSchema, input);
    if (current.revision !== parsed.baseRevision) throw revisionConflict();
    const historical = await this.subjects.roadmapRevision(
      userId,
      subjectId,
      roadmapId,
      parsed.sourceRevision,
    );
    const active = flattenRoadmap(current),
      prefix = active.slice(0, completedBoundary(active)),
      preserved = new Set(prefix.map((step) => step.id));
    const suffix = flattenRoadmap(historical.content).filter(
      (step) => !step.completed && !preserved.has(step.id),
    );
    try {
      return this.preview(
        userId,
        subjectId,
        current,
        prefix,
        suffix,
        'restauracao',
        historical.revision,
      );
    } catch (error) {
      if (error instanceof HttpError)
        throw new HttpError(
          400,
          'RESTORATION_INCOMPATIBLE',
          'Esta revisão é incompatível com o progresso atual: há passos repetidos, nenhum passo ou limites excedidos. Escolha outra revisão.',
        );
      throw error;
    }
  }
  async confirm(
    userId: string,
    subjectId: string,
    roadmapId: string,
    input: unknown,
  ) {
    await this.current(userId, subjectId, roadmapId);
    const parsed = parse(confirmRevisionSchema, input),
      claims = this.receipts.verify(
        parsed.receipt,
        userId,
        subjectId,
        roadmapId,
      );
    if (claims.origin === 'ia') await this.prefs.requireEnabled(userId, 'ai');
    if (
      parsed.baseRevision !== claims.baseRevision ||
      parsed.idempotencyKey !== claims.idempotencyKey
    )
      throw new HttpError(
        400,
        'INVALID_RECEIPT',
        'A prévia não corresponde à confirmação.',
      );
    return this.subjects.confirmRoadmapRevision(
      userId,
      subjectId,
      roadmapId,
      claims.baseRevision,
      claims.idempotencyKey,
      claims.origin,
      claims.sourceRevision,
      (current) => {
        const blocks = validSequence(parsed.steps);
        const prefix = parsed.steps.slice(0, claims.preservedCount),
          suffix = parsed.steps.slice(claims.preservedCount),
          active = flattenRoadmap(current),
          boundary = completedBoundary(active);
        if (
          prefixHash(prefix) !== claims.prefixHash ||
          prefixHash(active.slice(0, boundary)) !==
            prefixHash(parsed.steps.slice(0, boundary))
        )
          throw protectedError();
        if (
          suffix.some(
            (step) => step.completed || !claims.suffixIds.includes(step.id),
          )
        )
          throw new HttpError(
            400,
            'INVALID_STEP_ID',
            'A continuação contém identidade ou conclusão inválida.',
          );
        return {
          title: current.title,
          description: current.description,
          blocks,
        };
      },
    );
  }
}
