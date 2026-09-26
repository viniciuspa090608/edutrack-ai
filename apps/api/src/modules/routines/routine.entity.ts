import { EntitySchema } from 'typeorm';
import type { StudyRoutine, RoutineSlot } from '@study-platform/contracts';
export interface RoutineEntity extends Omit<
  StudyRoutine,
  'slots' | 'createdAt' | 'updatedAt'
> {
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}
export interface RoutineSlotEntity extends RoutineSlot {
  id: string;
  routineId: string;
}
export const routineEntity = new EntitySchema<RoutineEntity>({
  name: 'StudyRoutine',
  tableName: 'study_routines',
  columns: {
    id: { type: 'char', length: 36, primary: true },
    userId: { name: 'user_id', type: 'char', length: 36 },
    name: { type: 'varchar', length: 120 },
    timeZone: { name: 'time_zone', type: 'varchar', length: 100 },
    createdAt: {
      name: 'created_at',
      type: 'datetime',
      precision: 3,
      createDate: true,
    },
    updatedAt: {
      name: 'updated_at',
      type: 'datetime',
      precision: 3,
      updateDate: true,
    },
  },
});
export const routineSlotEntity = new EntitySchema<RoutineSlotEntity>({
  name: 'StudyRoutineSlot',
  tableName: 'study_routine_slots',
  columns: {
    id: { type: 'char', length: 36, primary: true },
    routineId: { name: 'routine_id', type: 'char', length: 36 },
    weekday: { type: 'tinyint', unsigned: true },
    startTime: { name: 'start_time', type: 'char', length: 5 },
    endTime: { name: 'end_time', type: 'char', length: 5 },
  },
});
