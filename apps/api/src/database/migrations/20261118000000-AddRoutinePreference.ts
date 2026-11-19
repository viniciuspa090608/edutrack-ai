import type { MigrationInterface, QueryRunner } from 'typeorm';
export class AddRoutinePreference20261118000000 implements MigrationInterface {
  async up(runner: QueryRunner): Promise<void> {
    await runner.query(
      'ALTER TABLE user_preferences ADD routines_enabled BOOLEAN NOT NULL DEFAULT TRUE',
    );
  }
  async down(runner: QueryRunner): Promise<void> {
    await runner.query('ALTER TABLE user_preferences DROP routines_enabled');
  }
}
