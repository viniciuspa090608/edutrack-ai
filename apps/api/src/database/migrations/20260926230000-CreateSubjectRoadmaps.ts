import type { MigrationInterface, QueryRunner } from 'typeorm';
export class CreateSubjectRoadmaps20260926230000 implements MigrationInterface {
  async up(runner: QueryRunner): Promise<void> {
    await runner.query(`CREATE TABLE subject_roadmaps (
      id char(36) PRIMARY KEY, subject_id char(36) NOT NULL, title varchar(120) NOT NULL, description text NOT NULL,
      created_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), updated_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      KEY ix_roadmaps_subject_created (subject_id,created_at,id),
      CONSTRAINT fk_roadmaps_subject FOREIGN KEY (subject_id) REFERENCES study_subjects(id) ON DELETE CASCADE
    ) ENGINE=InnoDB`);
    await runner.query(`CREATE TABLE subject_roadmap_blocks (
      id char(36) PRIMARY KEY, roadmap_id char(36) NOT NULL, title varchar(120) NOT NULL, description text NOT NULL, position int unsigned NOT NULL,
      KEY ix_roadmap_blocks_order (roadmap_id,position),
      CONSTRAINT fk_blocks_roadmap FOREIGN KEY (roadmap_id) REFERENCES subject_roadmaps(id) ON DELETE CASCADE
    ) ENGINE=InnoDB`);
    await runner.query(`CREATE TABLE subject_roadmap_steps (
      id char(36) PRIMARY KEY, block_id char(36) NOT NULL, title varchar(120) NOT NULL, description text NOT NULL, position int unsigned NOT NULL,
      KEY ix_roadmap_steps_order (block_id,position),
      CONSTRAINT fk_steps_block FOREIGN KEY (block_id) REFERENCES subject_roadmap_blocks(id) ON DELETE CASCADE
    ) ENGINE=InnoDB`);
  }
  async down(runner: QueryRunner): Promise<void> {
    await runner.query('DROP TABLE subject_roadmap_steps');
    await runner.query('DROP TABLE subject_roadmap_blocks');
    await runner.query('DROP TABLE subject_roadmaps');
  }
}
