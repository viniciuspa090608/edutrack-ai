import {
  createRoutineSchema,
  updateRoutineSchema,
  routineSchema,
  routineListSchema,
  routinePaginationSchema,
  routineScheduleSchema,
} from '@study-platform/contracts';
import { HttpError } from '../../shared/http-error.js';
import { RoutinesRepository } from './routines.repository.js';
function dto(row: Awaited<ReturnType<RoutinesRepository['find']>>) {
  return routineSchema.parse({
    id: row.id,
    name: row.name,
    timeZone: row.timeZone,
    slots: row.slots,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  });
}
export class RoutinesService {
  constructor(private readonly repository: RoutinesRepository) {}
  create(userId: string, input: unknown) {
    return this.repository.transaction(async (manager) => {
      const parsed = createRoutineSchema.safeParse(input);
      if (!parsed.success)
        throw new HttpError(
          400,
          'INVALID_INPUT',
          'Nome, fuso ou horários inválidos. Verifique também sobreposições.',
        );
      return dto(await this.repository.create(manager, userId, parsed.data));
    });
  }
  detail(userId: string, id: string) {
    return this.repository.transaction(async (manager) =>
      dto(await this.repository.find(manager, userId, id)),
    );
  }
  update(userId: string, id: string, input: unknown) {
    return this.repository.transaction(async (manager) => {
      await this.repository.find(manager, userId, id, true);
      const parsed = updateRoutineSchema.safeParse(input);
      if (!parsed.success)
        throw new HttpError(
          400,
          'INVALID_INPUT',
          'Nome, fuso ou horários inválidos. Verifique também sobreposições.',
        );
      return dto(
        await this.repository.update(manager, userId, id, parsed.data),
      );
    });
  }
  list(userId: string, input: unknown) {
    const parsed = routinePaginationSchema.safeParse(input);
    if (!parsed.success)
      throw new HttpError(400, 'INVALID_INPUT', 'Paginação inválida.');
    return this.repository.transaction(async (manager) => {
      const { items, total } = await this.repository.list(
        manager,
        userId,
        parsed.data,
      );
      return routineListSchema.parse({
        ...parsed.data,
        total,
        totalPages: Math.ceil(total / parsed.data.pageSize),
        items: items.map(dto),
      });
    });
  }
  delete(userId: string, id: string) {
    return this.repository.transaction((manager) =>
      this.repository.delete(manager, userId, id),
    );
  }
  schedule(userId: string) {
    return this.repository.transaction(async (manager) =>
      routineScheduleSchema.parse({
        items: await this.repository.schedule(manager, userId),
      }),
    );
  }
}
