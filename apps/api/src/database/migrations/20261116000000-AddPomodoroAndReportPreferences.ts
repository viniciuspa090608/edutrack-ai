import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPomodoroAndReportPreferences20261116000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE user_preferences ADD pomodoro_enabled BOOLEAN NOT NULL DEFAULT TRUE, ADD reports_visible BOOLEAN NOT NULL DEFAULT TRUE',
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE user_preferences DROP pomodoro_enabled, DROP reports_visible',
    );
  }
}
