import type { MigrationInterface, QueryRunner } from 'typeorm';
export class CreateTaskSubtasks20260926190000 implements MigrationInterface {
  name = 'CreateTaskSubtasks20260926190000';
  async up(runner: QueryRunner): Promise<void> {
    await runner.query(`CREATE TABLE task_subtasks (
      id char(36) NOT NULL PRIMARY KEY, task_id char(36) NOT NULL,
      title varchar(160) NOT NULL, is_completed boolean NOT NULL DEFAULT false,
      position int unsigned NOT NULL,
      created_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      KEY ix_subtasks_task_position (task_id, position, id),
      CONSTRAINT fk_subtasks_task FOREIGN KEY (task_id) REFERENCES study_tasks(id) ON DELETE CASCADE
    ) ENGINE=InnoDB`);
  }
  async down(runner: QueryRunner): Promise<void> {
    await runner.query('DROP TABLE task_subtasks');
  }
}
