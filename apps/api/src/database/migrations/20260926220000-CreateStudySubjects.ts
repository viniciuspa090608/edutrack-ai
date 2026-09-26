import type { MigrationInterface, QueryRunner } from 'typeorm';
export class CreateStudySubjects20260926220000 implements MigrationInterface {
  async up(runner: QueryRunner): Promise<void> {
    await runner.query(`CREATE TABLE study_subjects (
      id char(36) PRIMARY KEY, user_id char(36) NOT NULL, name varchar(120) NOT NULL,
      current_level enum('BEGINNER','INTERMEDIATE','ADVANCED') NOT NULL,
      objective text NOT NULL, due_date date NOT NULL, weekly_hours decimal(4,1) NOT NULL,
      created_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      KEY ix_subjects_owner_created (user_id,created_at,id),
      CONSTRAINT fk_subjects_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT ck_subjects_hours CHECK (weekly_hours > 0 AND weekly_hours <= 168 AND MOD(weekly_hours * 2,1) = 0)
    ) ENGINE=InnoDB`);
    await runner.query(`CREATE TABLE subject_known_topics (
      id char(36) PRIMARY KEY, subject_id char(36) NOT NULL, name varchar(160) NOT NULL, position int unsigned NOT NULL,
      KEY ix_known_subject_position (subject_id,position),
      CONSTRAINT fk_known_subject FOREIGN KEY (subject_id) REFERENCES study_subjects(id) ON DELETE CASCADE
    ) ENGINE=InnoDB`);
    await runner.query(`CREATE TABLE subject_plan_items (
      id char(36) PRIMARY KEY, subject_id char(36) NOT NULL, title varchar(160) NOT NULL,
      status enum('PENDING','IN_PROGRESS','COMPLETED') NOT NULL DEFAULT 'PENDING', position int unsigned NOT NULL,
      created_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      KEY ix_plan_subject_position (subject_id,position),
      CONSTRAINT fk_plan_subject FOREIGN KEY (subject_id) REFERENCES study_subjects(id) ON DELETE CASCADE
    ) ENGINE=InnoDB`);
  }
  async down(runner: QueryRunner): Promise<void> {
    await runner.query('DROP TABLE subject_plan_items');
    await runner.query('DROP TABLE subject_known_topics');
    await runner.query('DROP TABLE study_subjects');
  }
}
