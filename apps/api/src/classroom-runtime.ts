import type { DataSource } from 'typeorm';
import type { CustomFetch } from 'openid-client';
import type { ApiEnv } from './config/env.js';
import { PreferencesService } from './modules/preferences/preferences.service.js';
import { SubjectsService } from './modules/subjects/subjects.service.js';
import { SubjectsRepository } from './modules/subjects/subjects.repository.js';
import { TasksService } from './modules/tasks/tasks.service.js';
import { TasksRepository } from './modules/tasks/tasks.repository.js';
import { ClassroomRepository } from './modules/classroom/classroom.repository.js';
import { ClassroomOAuthService } from './modules/classroom/classroom-oauth.service.js';
import { ClassroomGoogleClient } from './modules/classroom/google-client.js';
import { ClassroomOperationsRepository } from './modules/classroom/operations.repository.js';
import { ClassroomService } from './modules/classroom/classroom.service.js';
import { StudyProgressService } from './modules/study-progress/study-progress.service.js';
import { StudyProgressRepository } from './modules/study-progress/study-progress.repository.js';

export function createClassroomRuntime(
  source: DataSource,
  env: ApiEnv,
  oidcFetch?: CustomFetch,
  transport?: typeof fetch,
) {
  const prefs = new PreferencesService(source),
    subjects = new SubjectsService(new SubjectsRepository(source), prefs);
  const tasks = new TasksService(new TasksRepository(source), subjects);
  const repository = new ClassroomRepository(source, prefs),
    oauth = new ClassroomOAuthService(repository, env, oidcFetch);
  return {
    service: new ClassroomService(
      repository,
      oauth,
      new ClassroomGoogleClient(oauth, transport),
      new ClassroomOperationsRepository(source),
      subjects,
      tasks,
      prefs,
      new StudyProgressService(new StudyProgressRepository(source)),
      env,
    ),
  };
}
