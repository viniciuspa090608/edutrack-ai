import type { MigrationInterface, QueryRunner } from 'typeorm';
export class CreateStudyRoutines20260926210000 implements MigrationInterface {
  async up(runner: QueryRunner): Promise<void> {
    await runner.query(`CREATE TABLE study_routines (
      id char(36) PRIMARY KEY, user_id char(36) NOT NULL, name varchar(120) NOT NULL, time_zone varchar(100) NOT NULL,
      created_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      KEY ix_routines_owner_created (user_id,created_at,id),
      CONSTRAINT fk_routines_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB`);
    await runner.query(`CREATE TABLE study_routine_slots (
      id char(36) PRIMARY KEY, routine_id char(36) NOT NULL, weekday tinyint unsigned NOT NULL,
      start_time char(5) NOT NULL, end_time char(5) NOT NULL,
      KEY ix_routine_slots_day (routine_id,weekday,start_time),
      CONSTRAINT fk_routine_slots_parent FOREIGN KEY (routine_id) REFERENCES study_routines(id) ON DELETE CASCADE,
      CONSTRAINT ck_routine_slots_day CHECK (weekday BETWEEN 1 AND 7),
      CONSTRAINT ck_routine_slots_order CHECK (start_time < end_time)
    ) ENGINE=InnoDB`);
  }
  async down(runner: QueryRunner): Promise<void> {
    await runner.query('DROP TABLE study_routine_slots');
    await runner.query('DROP TABLE study_routines');
  }
}
