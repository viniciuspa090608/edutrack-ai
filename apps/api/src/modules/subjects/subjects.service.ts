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
        parse(roadmapContentSchema, input),
      ),
    );
  }
  async deleteRoadmap(userId: string, id: string, roadmapId: string) {
    await this.requireOwned(userId, id);
    await this.repository.roadmaps.delete(userId, id, roadmapId);
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
