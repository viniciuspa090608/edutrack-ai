import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSubjectGoals20261122100000 implements MigrationInterface {
  async up(runner: QueryRunner): Promise<void> {
    await runner.query(`CREATE TABLE subject_goals (
      subject_id char(36) PRIMARY KEY, user_id char(36) NOT NULL,
      indicator enum('tasks','studyHours','reviewAccuracy') NOT NULL,
      target decimal(12,4) NOT NULL, due_date date NOT NULL, time_zone varchar(100) NOT NULL,
      started_at datetime(3) NOT NULL,
      KEY ix_subject_goals_owner (user_id,subject_id),
      CONSTRAINT fk_subject_goals_subject FOREIGN KEY (subject_id) REFERENCES study_subjects(id) ON DELETE CASCADE,
      CONSTRAINT fk_subject_goals_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT ck_subject_goal_target CHECK (target > 0 AND target <= 100000 AND
        (indicator <> 'tasks' OR MOD(target,1)=0) AND (indicator <> 'reviewAccuracy' OR target <= 100))
    ) ENGINE=InnoDB`);
  }
  async down(runner: QueryRunner): Promise<void> {
    await runner.query('DROP TABLE subject_goals');
  }
}
