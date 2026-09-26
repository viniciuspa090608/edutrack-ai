import type { MigrationInterface, QueryRunner } from 'typeorm';
export class AddRoadmapGeneration20260926231000 implements MigrationInterface {
  async up(runner: QueryRunner): Promise<void> {
    await runner.query(
      'ALTER TABLE subject_roadmaps ADD generation_id char(36) NULL, ADD UNIQUE KEY uq_roadmap_generation (generation_id)',
    );
  }
  async down(runner: QueryRunner): Promise<void> {
    await runner.query(
      'ALTER TABLE subject_roadmaps DROP INDEX uq_roadmap_generation, DROP COLUMN generation_id',
    );
  }
}
