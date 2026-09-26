import {
  createSubjectSchema,
  updateSubjectSchema,
  subjectPaginationSchema,
  subjectSchema,
  subjectListSchema,
  createPlanItemSchema,
  updatePlanItemSchema,
  planOrderSchema,
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
