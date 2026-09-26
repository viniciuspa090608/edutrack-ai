import type { Subtask } from '@study-platform/contracts';
import { EntitySchema } from 'typeorm';
export interface SubtaskEntity extends Omit<
  Subtask,
  'createdAt' | 'updatedAt'
> {
  createdAt: Date;
  updatedAt: Date;
}
export const subtaskEntity = new EntitySchema<SubtaskEntity>({
  name: 'TaskSubtask',
  tableName: 'task_subtasks',
  columns: {
    id: { type: 'char', length: 36, primary: true },
    taskId: { name: 'task_id', type: 'char', length: 36 },
    title: { type: 'varchar', length: 160 },
    isCompleted: { name: 'is_completed', type: 'boolean', default: false },
    position: { type: 'int', unsigned: true },
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
