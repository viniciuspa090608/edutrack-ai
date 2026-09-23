import { DataSource } from 'typeorm';
import type { MigrationInterface, QueryRunner } from 'typeorm';
import { describe, expect, it } from 'vitest';
import { loadEnv } from '../src/config/env.js';
import { createDataSource } from '../src/database/data-source.js';

class BootstrapProbe1750000000000 implements MigrationInterface {
  name = 'BootstrapProbe1750000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'CREATE TABLE bootstrap_migration_probe (id integer PRIMARY KEY)',
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE bootstrap_migration_probe');
  }
}

describe('MySQL integration', () => {
  it('connects to the isolated test database and applies a migration only once', async () => {
    const env = loadEnv();
    const options = createDataSource({
      ...env,
      DB_NAME: env.TEST_DB_NAME,
    }).options;
    const source = new DataSource({
      ...options,
      migrations: [BootstrapProbe1750000000000],
    });
    expect(source.options.synchronize).toBe(false);

    let applied = false;
    try {
      await source.initialize();
      expect(await source.runMigrations()).toHaveLength(1);
      applied = true;
      expect(await source.runMigrations()).toHaveLength(0);
      expect(
        await source.query('SELECT id FROM bootstrap_migration_probe'),
      ).toEqual([]);
    } finally {
      if (source.isInitialized) {
        if (applied) await source.undoLastMigration();
        await source.destroy();
      }
    }
  });

  it('fails with invalid credentials instead of masking the connection', async () => {
    const env = loadEnv();
    const source = createDataSource({
      ...env,
      DB_NAME: env.TEST_DB_NAME,
      DB_PASSWORD: 'incorrect-password',
    });
    await expect(source.initialize()).rejects.toThrow();
    if (source.isInitialized) await source.destroy();
  });
});
