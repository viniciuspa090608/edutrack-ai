import type { MigrationInterface, QueryRunner } from 'typeorm';
export class VersionRoadmapSteps20260926232000 implements MigrationInterface {
  async up(runner: QueryRunner): Promise<void> {
    await runner.query(
      'ALTER TABLE subject_roadmap_steps ADD completed boolean NOT NULL DEFAULT false',
    );
    await runner.query(
      'ALTER TABLE subject_roadmaps ADD revision int unsigned NOT NULL DEFAULT 1',
    );
    await runner.query(`CREATE TABLE subject_roadmap_revisions (
      roadmap_id char(36) NOT NULL, revision int unsigned NOT NULL, origin enum('manual','ia','restauracao') NOT NULL,
      source_revision int unsigned NULL, content json NOT NULL, action_id char(36) NULL,
      created_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      PRIMARY KEY (roadmap_id,revision), UNIQUE KEY uq_revision_action (roadmap_id,action_id),
      CONSTRAINT fk_revisions_roadmap FOREIGN KEY (roadmap_id) REFERENCES subject_roadmaps(id) ON DELETE CASCADE
    ) ENGINE=InnoDB`);
    // Preserve every existing UUID and ordered block/step in the initial snapshot.
    const rows = (await runner.query(
      'SELECT id,title,description,created_at,generation_id FROM subject_roadmaps',
    )) as unknown as Array<{
      id: string;
      title: string;
      description: string;
      created_at: Date;
      generation_id: string | null;
    }>;
    for (const row of rows) {
      const blocks = (await runner.query(
        'SELECT id,title,description FROM subject_roadmap_blocks WHERE roadmap_id=? ORDER BY position,id',
        [row.id],
      )) as unknown as Array<{
        id: string;
        title: string;
        description: string;
      }>;
      const content = {
        title: row.title,
        description: row.description,
        blocks: [] as Array<{
          title: string;
          description: string;
          steps: Array<{
            id: string;
            title: string;
            description: string;
            completed: boolean;
          }>;
        }>,
      };
      for (const block of blocks) {
        const steps = (await runner.query(
          'SELECT id,title,description,completed FROM subject_roadmap_steps WHERE block_id=? ORDER BY position,id',
          [block.id],
        )) as unknown as Array<{
          id: string;
          title: string;
          description: string;
          completed: number;
        }>;
        content.blocks.push({
          title: block.title,
          description: block.description,
          steps: steps.map((step) => ({
            ...step,
            completed: Boolean(step.completed),
          })),
        });
      }
      await runner.query(
        'INSERT INTO subject_roadmap_revisions (roadmap_id,revision,origin,content,created_at) VALUES (?,1,?,?,?)',
        [
          row.id,
          row.generation_id ? 'ia' : 'manual',
          JSON.stringify(content),
          row.created_at,
        ],
      );
    }
  }
  async down(runner: QueryRunner): Promise<void> {
    await runner.query('DROP TABLE subject_roadmap_revisions');
    await runner.query('ALTER TABLE subject_roadmaps DROP COLUMN revision');
    await runner.query(
      'ALTER TABLE subject_roadmap_steps DROP COLUMN completed',
    );
  }
}
