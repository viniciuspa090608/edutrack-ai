import type { MigrationInterface, QueryRunner } from 'typeorm';
export class AddClassroomOAuthOrigin20261122000000 implements MigrationInterface {
  name = 'AddClassroomOAuthOrigin20261122000000';
  async up(q: QueryRunner): Promise<void> {
    await q.query(
      "ALTER TABLE classroom_oauth_attempts ADD origin varchar(16) NOT NULL DEFAULT 'account'",
    );
  }
  async down(q: QueryRunner): Promise<void> {
    await q.query('ALTER TABLE classroom_oauth_attempts DROP COLUMN origin');
  }
}
