import { randomUUID } from 'node:crypto';
import type { DataSource, EntityManager } from 'typeorm';
import type {
  CreateRoutine,
  UpdateRoutine,
  RoutinePagination,
  RoutineSlot,
} from '@study-platform/contracts';
import { HttpError } from '../../shared/http-error.js';
import { routineEntity, routineSlotEntity } from './routine.entity.js';

export class RoutinesRepository {
  constructor(private readonly source: DataSource) {}
  transaction<T>(work: (manager: EntityManager) => Promise<T>) {
    return this.source.transaction(work);
  }
  async find(manager: EntityManager, userId: string, id: string, lock = false) {
    const query = manager
      .getRepository(routineEntity)
      .createQueryBuilder('routine')
      .where('routine.id=:id AND routine.userId=:userId', { id, userId });
    if (lock) query.setLock('pessimistic_write');
    const row = await query.getOne();
    if (!row)
      throw new HttpError(404, 'ROUTINE_NOT_FOUND', 'Rotina não encontrada.');
    const slots = await manager
      .getRepository(routineSlotEntity)
      .createQueryBuilder('slot')
      .innerJoin('study_routines', 'routine', 'routine.id=slot.routineId')
      .where('routine.user_id=:userId AND slot.routineId=:id', { userId, id })
      .orderBy('slot.weekday', 'ASC')
      .addOrderBy('slot.startTime', 'ASC')
      .getMany();
    return {
      ...row,
      slots: slots.map(({ weekday, startTime, endTime }) => ({
        weekday,
        startTime,
        endTime,
      })),
    };
  }
  async replaceSlots(
    manager: EntityManager,
    userId: string,
    id: string,
    slots: RoutineSlot[],
  ) {
    await manager.query(
      'DELETE s FROM study_routine_slots s JOIN study_routines r ON r.id=s.routine_id WHERE r.user_id=? AND s.routine_id=?',
      [userId, id],
    );
    for (const slot of slots)
      await manager.query(
        'INSERT INTO study_routine_slots (id,routine_id,weekday,start_time,end_time) SELECT ?,id,?,?,? FROM study_routines WHERE id=? AND user_id=?',
        [randomUUID(), slot.weekday, slot.startTime, slot.endTime, id, userId],
      );
  }
  async create(manager: EntityManager, userId: string, input: CreateRoutine) {
    const id = randomUUID();
    await manager
      .getRepository(routineEntity)
      .insert({ id, userId, name: input.name, timeZone: input.timeZone });
    await this.replaceSlots(manager, userId, id, input.slots);
    return this.find(manager, userId, id);
  }
  async update(
    manager: EntityManager,
    userId: string,
    id: string,
    input: UpdateRoutine,
  ) {
    const fields = Object.fromEntries(
      Object.entries(input).filter(
        ([key, value]) => key !== 'slots' && value !== undefined,
      ),
    );
    if (Object.keys(fields).length)
      await manager.getRepository(routineEntity).update({ id, userId }, fields);
    else if (input.slots)
      await manager.query(
        'UPDATE study_routines SET updated_at=UTC_TIMESTAMP(3) WHERE id=? AND user_id=?',
        [id, userId],
      );
    if (input.slots) await this.replaceSlots(manager, userId, id, input.slots);
    return this.find(manager, userId, id);
  }
  async list(
    manager: EntityManager,
    userId: string,
    filters: RoutinePagination,
  ) {
    const [rows, total] = await manager
      .getRepository(routineEntity)
      .createQueryBuilder('routine')
      .where('routine.userId=:userId', { userId })
      .orderBy('routine.createdAt', 'DESC')
      .addOrderBy('routine.id', 'DESC')
      .skip((filters.page - 1) * filters.pageSize)
      .take(filters.pageSize)
      .getManyAndCount();
    return {
      items: await Promise.all(
        rows.map((row) => this.find(manager, userId, row.id)),
      ),
      total,
    };
  }
  async delete(manager: EntityManager, userId: string, id: string) {
    await this.find(manager, userId, id, true);
    await manager.getRepository(routineEntity).delete({ id, userId });
  }
  schedule(manager: EntityManager, userId: string) {
    return manager
      .getRepository(routineSlotEntity)
      .createQueryBuilder('slot')
      .innerJoin('study_routines', 'routine', 'routine.id=slot.routineId')
      .select('routine.id', 'routineId')
      .addSelect('routine.name', 'name')
      .addSelect('routine.time_zone', 'timeZone')
      .addSelect('slot.weekday', 'weekday')
      .addSelect('slot.startTime', 'startTime')
      .addSelect('slot.endTime', 'endTime')
      .where('routine.user_id=:userId', { userId })
      .orderBy('slot.weekday', 'ASC')
      .addOrderBy('slot.startTime', 'ASC')
      .addOrderBy('routine.id', 'ASC')
      .addOrderBy('slot.id', 'ASC')
      .getRawMany();
  }
}
