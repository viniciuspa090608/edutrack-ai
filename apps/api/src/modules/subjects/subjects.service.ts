import {
  createSubjectSchema,
  updateSubjectSchema,
  subjectPaginationSchema,
  subjectSchema,
  subjectListSchema,
  createPlanItemSchema,
  updatePlanItemSchema,
  planOrderSchema,
  roadmapContentSchema,
  roadmapSchema,
  roadmapListSchema,
  updateRoadmapSchema,
  stepProgressSchema,
  revisionListSchema,
  dashboardSubjectSchema,
} from '@study-platform/contracts';
import type { z } from 'zod';
import type { PreferencesService } from '../preferences/preferences.service.js';
import type { SubjectsRepository } from './subjects.repository.js';
import { HttpError } from '../../shared/http-error.js';
function parse<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success)
    throw new HttpError(400, 'INVALID_INPUT', 'Dados de matéria inválidos.');
  return result.data;
}
export class SubjectsService {
  async dashboardSummary(userId: string) {
    await this.prefs.requireEnabled(userId, 'subjects');
    const candidate = await this.repository.dashboardCandidate(userId);
    if (!candidate) return null;
    const { subject, hasPending } = candidate;
    const roadmaps = await this.listRoadmaps(userId, subject.id, {
      page: 1,
      pageSize: 1,
    });
    const roadmap = roadmaps.items[0];
    const steps = roadmap?.blocks.flatMap((block) => block.steps);
    const total = steps?.length ?? subject.planItems.length;
    const completed = steps
      ? steps.filter((step) => step.completed).length
      : subject.planItems.filter((item) => item.status === 'COMPLETED').length;
    return dashboardSubjectSchema.parse({
      id: subject.id,
      name: subject.name,
      dueDate: subject.dueDate,
      hasPending,
      source: roadmap ? 'roadmap' : 'manual',
      roadmapId: roadmap?.id ?? null,
      title: roadmap?.title ?? 'Plano manual',
      total,
      completed,
      progressPercent: total ? (completed / total) * 100 : null,
    });
  }
  constructor(
    private readonly repository: SubjectsRepository,
    private readonly prefs: Pick<PreferencesService, 'requireEnabled'>,
  ) {}
  async requireOwned(userId: string, id: string) {
    await this.prefs.requireEnabled(userId, 'subjects');
    await this.repository.detail(userId, id);
  }
  async listRoadmaps(userId: string, id: string, input: unknown) {
    await this.requireOwned(userId, id);
    const pagination = parse(subjectPaginationSchema, input);
    const result = await this.repository.roadmaps.list(userId, id, pagination);
    return roadmapListSchema.parse({
      ...result,
      ...pagination,
      totalPages: Math.ceil(result.total / pagination.pageSize),
    });
  }
  async roadmapDetail(userId: string, id: string, roadmapId: string) {
    await this.requireOwned(userId, id);
    return roadmapSchema.parse(
      await this.repository.roadmaps.detail(userId, id, roadmapId),
    );
  }
  async saveRoadmap(
    userId: string,
    id: string,
    input: unknown,
    generationId: string | null = null,
  ) {
    await this.requireOwned(userId, id);
    return roadmapSchema.parse(
      await this.repository.roadmaps.create(
        userId,
        id,
        parse(roadmapContentSchema, input),
        generationId,
      ),
    );
  }
  async editRoadmap(
    userId: string,
    id: string,
    roadmapId: string,
    input: unknown,
  ) {
    await this.requireOwned(userId, id);
    return roadmapSchema.parse(
      await this.repository.roadmaps.update(
        userId,
        id,
        roadmapId,
        parse(updateRoadmapSchema, input),
      ),
    );
  }
  async deleteRoadmap(userId: string, id: string, roadmapId: string) {
    await this.requireOwned(userId, id);
    await this.repository.roadmaps.delete(userId, id, roadmapId);
  }
  async roadmapHistory(
    userId: string,
    id: string,
    roadmapId: string,
    input: unknown,
  ) {
    await this.requireOwned(userId, id);
    return revisionListSchema.parse(
      await this.repository.roadmaps.history(
        userId,
        id,
        roadmapId,
        parse(subjectPaginationSchema, input),
      ),
    );
  }
  async roadmapRevision(
    userId: string,
    id: string,
    roadmapId: string,
    revision: number,
  ) {
    await this.requireOwned(userId, id);
    return this.repository.roadmaps.revision(userId, id, roadmapId, revision);
  }
  async confirmRoadmapRevision(
    ...args: Parameters<SubjectsRepository['roadmaps']['confirm']>
  ) {
    await this.requireOwned(args[0], args[1]);
    return this.repository.roadmaps.confirm(...args);
  }
  async stepProgress(
    userId: string,
    id: string,
    roadmapId: string,
    stepId: string,
    input: unknown,
  ) {
    await this.requireOwned(userId, id);
    const parsed = parse(stepProgressSchema, input);
    await this.repository.roadmaps.confirm(
      userId,
      id,
      roadmapId,
      parsed.baseRevision,
      null,
      'manual',
      null,
      (current) => {
        if (
          !current.blocks.some((block) =>
            block.steps.some((step) => step.id === stepId),
          )
        )
          throw new HttpError(404, 'STEP_NOT_FOUND', 'Passo não encontrado.');
        return {
          title: current.title,
          description: current.description,
          blocks: current.blocks.map((block) => ({
            ...block,
            steps: block.steps.map((step) =>
              step.id === stepId
                ? { ...step, completed: parsed.completed }
                : step,
            ),
          })),
        };
      },
      true,
    );
    return this.roadmapDetail(userId, id, roadmapId);
  }
  async create(userId: string, input: unknown) {
    return subjectSchema.parse(
      await this.repository.create(userId, parse(createSubjectSchema, input)),
    );
  }
  async detail(userId: string, id: string) {
    return subjectSchema.parse(await this.repository.detail(userId, id));
  }
  async list(userId: string, input: unknown) {
    const pagination = parse(subjectPaginationSchema, input);
    const result = await this.repository.list(userId, pagination);
    return subjectListSchema.parse({
      ...result,
      ...pagination,
      totalPages: Math.ceil(result.total / pagination.pageSize),
    });
  }
  async update(userId: string, id: string, input: unknown) {
    return subjectSchema.parse(
      await this.repository.update(
        userId,
        id,
        parse(updateSubjectSchema, input),
      ),
    );
  }
  delete(userId: string, id: string) {
    return this.repository.delete(userId, id);
  }
  async addItem(userId: string, id: string, input: unknown) {
    return subjectSchema.parse(
      await this.repository.addItem(
        userId,
        id,
        parse(createPlanItemSchema, input),
      ),
    );
  }
  async editItem(userId: string, id: string, itemId: string, input: unknown) {
    return subjectSchema.parse(
      await this.repository.editItem(
        userId,
        id,
        itemId,
        parse(updatePlanItemSchema, input),
      ),
    );
  }
  async removeItem(userId: string, id: string, itemId: string) {
    return subjectSchema.parse(
      await this.repository.removeItem(userId, id, itemId),
    );
  }
  async reorder(userId: string, id: string, input: unknown) {
    return subjectSchema.parse(
      await this.repository.reorder(
        userId,
        id,
        parse(planOrderSchema, input).ids,
      ),
    );
  }
}
