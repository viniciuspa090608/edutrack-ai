import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateStudyTasks20260926180000 implements MigrationInterface {
  name = 'CreateStudyTasks20260926180000';
  async up(runner: QueryRunner): Promise<void> {
    await runner.query(`CREATE TABLE study_tasks (
      id char(36) NOT NULL PRIMARY KEY,
      user_id char(36) NOT NULL,
      title varchar(160) NOT NULL,
      description text NULL,
      priority enum('LOW','MEDIUM','HIGH') NOT NULL DEFAULT 'MEDIUM',
      due_date date NULL,
      status enum('PENDING','IN_PROGRESS','COMPLETED') NOT NULL DEFAULT 'PENDING',
      created_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      KEY ix_tasks_owner_created (user_id, created_at, id),
      KEY ix_tasks_owner_due (user_id, due_date),
      CONSTRAINT fk_tasks_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB`);
  }
  async down(runner: QueryRunner): Promise<void> {
    await runner.query('DROP TABLE study_tasks');
  }
}
