import type { MigrationInterface, QueryRunner } from 'typeorm';
export class AddSubjectAssociations20260926221000 implements MigrationInterface {
  async up(runner: QueryRunner): Promise<void> {
    for (const table of ['study_tasks', 'pomodoro_sessions'])
      await runner.query(
        `ALTER TABLE ${table} ADD subject_id char(36) NULL, ADD KEY ix_${table}_owner_subject (user_id,subject_id), ADD CONSTRAINT fk_${table}_subject FOREIGN KEY (subject_id) REFERENCES study_subjects(id) ON DELETE SET NULL`,
      );
  }
  async down(runner: QueryRunner): Promise<void> {
    for (const table of ['pomodoro_sessions', 'study_tasks'])
      await runner.query(
        `ALTER TABLE ${table} DROP FOREIGN KEY fk_${table}_subject, DROP INDEX ix_${table}_owner_subject, DROP COLUMN subject_id`,
      );
  }
}
