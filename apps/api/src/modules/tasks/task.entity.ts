import type { StudyTask } from '@study-platform/contracts';
import { EntitySchema } from 'typeorm';

export interface TaskEntity extends Omit<
  StudyTask,
  | 'createdAt'
  | 'updatedAt'
  | 'subtaskTotal'
  | 'subtaskCompleted'
  | 'progressPercent'
> {
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}
export const taskEntity = new EntitySchema<TaskEntity>({
  name: 'StudyTask',
  tableName: 'study_tasks',
  columns: {
    id: { type: 'char', length: 36, primary: true },
    userId: { name: 'user_id', type: 'char', length: 36 },
    subjectId: { name: 'subject_id', type: 'char', length: 36, nullable: true },
    title: { type: 'varchar', length: 160 },
    description: { type: 'text', nullable: true },
    priority: {
      type: 'enum',
      enum: ['LOW', 'MEDIUM', 'HIGH'],
      default: 'MEDIUM',
    },
    dueDate: { name: 'due_date', type: 'date', nullable: true },
    status: {
      type: 'enum',
      enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED'],
      default: 'PENDING',
    },
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
