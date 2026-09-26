import {
  confirmRoadmapSchema,
  generationParametersSchema,
  roadmapContentSchema,
  roadmapPreviewSchema,
  suffixSchema,
} from '@study-platform/contracts';
import type { SequenceStep } from '@study-platform/contracts';
import type { SubjectsService } from '../subjects/subjects.service.js';
import type { PreferencesService } from '../preferences/preferences.service.js';
import type { RoadmapProvider } from './roadmap-provider.js';
import type { RoadmapReceipt } from './roadmap-receipt.js';
import { HttpError } from '../../shared/http-error.js';
export class RoadmapAIService {
  constructor(
    private readonly subjects: SubjectsService,
    private readonly prefs: PreferencesService,
    private readonly provider: RoadmapProvider,
    private readonly receipts: RoadmapReceipt,
    private readonly now: () => Date = () => new Date(),
  ) {}
  private async allowed(userId: string, subjectId: string) {
    await this.prefs.requireEnabled(userId, 'subjects');
    await this.prefs.requireEnabled(userId, 'ai');
    await this.subjects.requireOwned(userId, subjectId);
  }
  async generateSuffix(
    userId: string,
    subjectId: string,
    prefix: SequenceStep[],
    suffix: SequenceStep[],
  ) {
    await this.allowed(userId, subjectId);
    if (!suffix.length) return [];
    const subject = await this.subjects.detail(userId, subjectId);
    const text = (step: SequenceStep) => ({
      title: step.title,
      description: step.description,
      blockTitle: step.blockTitle,
      blockDescription: step.blockDescription,
    });
    const raw = await this.provider.regenerate({
      subjectName: subject.name,
      currentLevel: subject.currentLevel,
      objective: subject.objective,
      dueDate: subject.dueDate,
      weeklyHours: subject.weeklyHours,
      knownTopics: subject.knownTopics,
      preservedPrefix: prefix.map(text),
      previousSuffix: suffix.map(text),
    });
    const parsed = suffixSchema.safeParse(raw);
    if (!parsed.success)
      throw new HttpError(
        502,
        'AI_INVALID_RESPONSE',
        'A IA retornou uma continuação inválida. Tente novamente.',
      );
    await this.allowed(userId, subjectId);
    return parsed.data.steps;
  }
  async generate(userId: string, subjectId: string, input: unknown) {
    await this.allowed(userId, subjectId);
    const parameters = generationParametersSchema(this.now()).safeParse(input);
    if (!parameters.success)
      throw new HttpError(
        400,
        'INVALID_INPUT',
        'Revise os parâmetros da geração.',
      );
    const subject = await this.subjects.detail(userId, subjectId);
    const content = roadmapContentSchema.safeParse(
      await this.provider.generate(subject.name, parameters.data),
    );
    if (!content.success)
      throw new HttpError(
        502,
        'AI_INVALID_RESPONSE',
        'A IA retornou uma resposta inválida. Tente gerar novamente.',
      );
    await this.allowed(userId, subjectId);
    return roadmapPreviewSchema.parse({
      subjectId,
      parameters: parameters.data,
      content: content.data,
      ...this.receipts.issue(userId, subjectId),
    });
  }
  async confirm(userId: string, subjectId: string, input: unknown) {
    await this.allowed(userId, subjectId);
    const parsed = confirmRoadmapSchema.safeParse(input);
    if (!parsed.success)
      throw new HttpError(
        400,
        'INVALID_INPUT',
        'Revise o roadmap e confirme o salvamento.',
      );
    const generationId = this.receipts.verify(
      parsed.data.receipt,
      userId,
      subjectId,
    );
    return this.subjects.saveRoadmap(
      userId,
      subjectId,
      parsed.data.content,
      generationId,
    );
  }
}
