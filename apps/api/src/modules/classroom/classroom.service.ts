import { createHash, randomUUID } from 'node:crypto';
import { z } from 'zod';
import type { EntityManager } from 'typeorm';
import {
  classroomSelectionSchema,
  classroomStartOperationSchema,
  classroomSubjectImportSchema,
  classroomPaginationSchema,
  classroomConsentSchema,
} from '@study-platform/contracts';
import type { ClassroomSelection, Capability } from '@study-platform/contracts';
import type { ApiEnv } from '../../config/env.js';
import { HttpError } from '../../shared/http-error.js';
import type { SubjectsService } from '../subjects/subjects.service.js';
import type { TasksService } from '../tasks/tasks.service.js';
import type { PreferencesService } from '../preferences/preferences.service.js';
import type { StudyProgressService } from '../study-progress/study-progress.service.js';
import type { ActiveSession } from '../auth/session.repository.js';
import { ClassroomRepository, json } from './classroom.repository.js';
import { ClassroomOAuthService } from './classroom-oauth.service.js';
import { ClassroomGoogleClient, taskFromClassroom } from './google-client.js';
import { ClassroomOperationsRepository } from './operations.repository.js';
import type { OperationRow } from './operations.repository.js';

function receiptId(operationId: string, key: string) {
  const h = createHash('sha256').update(`${operationId}:${key}`).digest('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
}
const reason = (error: unknown) => {
  if (error instanceof HttpError) return error.message;
  if (error instanceof z.ZodError) {
    const issue = error.issues[0];
    const field = issue?.path.at(-1);
    const label =
      field === 'description'
        ? 'Descrição'
        : field === 'title'
          ? 'Título'
          : field === 'name'
            ? 'Nome'
            : 'Conteúdo';
    if (issue?.code === 'too_big')
      return `${label} excede o limite de ${String(issue.maximum)} ${issue.origin === 'string' ? 'caracteres' : 'itens'}. Nenhum dado foi truncado.`;
    return 'Conteúdo externo incompatível com os campos do Edutrack. Revise a origem antes de tentar novamente.';
  }
  return 'Não foi possível processar este conteúdo. Verifique os dados e tente novamente.';
};
export class ClassroomService {
  async connect(session: ActiveSession, purpose: 'import' | 'teacher') {
    return this.oauth.start(session, purpose);
  }
  onboarding(userId: string) {
    return this.prefs.onboarding(userId);
  }
  updateOnboarding(userId: string, step: string) {
    return this.prefs.updateOnboarding(userId, step);
  }
  constructor(
    readonly repository: ClassroomRepository,
    readonly oauth: ClassroomOAuthService,
    readonly google: ClassroomGoogleClient,
    readonly operations: ClassroomOperationsRepository,
    private readonly subjects: SubjectsService,
    private readonly tasks: TasksService,
    private readonly prefs: PreferencesService,
    private readonly progress: Pick<StudyProgressService, 'settings'>,
    readonly env: ApiEnv,
  ) {}
  status(userId: string) {
    return this.repository.status(userId, this.oauth.available);
  }
  async courses(userId: string, pageToken?: string) {
    const status = await this.status(userId);
    return this.google.courses(userId, status.version, pageToken);
  }
  async selection(userId: string) {
    const connection = await this.repository.connection(userId);
    if (!connection?.google_subject) return { courses: [] };
    const rows = await this.repository.source.query<
      Array<{ selection: ClassroomSelection['courses'][number] | string }>
    >(
      'SELECT selection FROM classroom_selections WHERE user_id=? AND google_subject=? ORDER BY course_id',
      [userId, connection.google_subject],
    );
    return classroomSelectionSchema.parse({
      courses: rows.map((row) => json(row.selection)),
    });
  }
  async select(userId: string, input: unknown) {
    const selection = classroomSelectionSchema.parse(input);
    const connection = await this.status(userId);
    // Never trust course names/IDs supplied by the browser as authorization.
    for (const course of selection.courses)
      await this.google.course(userId, connection.version, course.courseId);
    return this.repository.allowed(
      userId,
      connection.version,
      [],
      async (manager, row) => {
        for (const item of selection.courses) {
          if (item.destination.kind === 'existing')
            await this.subjects.requireOwned(
              userId,
              item.destination.subjectId,
            );
        }
        await manager.query(
          'DELETE FROM classroom_selections WHERE user_id=? AND google_subject=?',
          [userId, row.google_subject],
        );
        for (const item of selection.courses)
          await manager.query(
            'INSERT INTO classroom_selections(user_id,google_subject,course_id,selection) VALUES (?,?,?,?)',
            [userId, row.google_subject, item.courseId, JSON.stringify(item)],
          );
        return selection;
      },
    );
  }
  async start(userId: string, kind: 'import', input: unknown) {
    const request = classroomStartOperationSchema.parse(input);
    const selected = await this.selection(userId);
    const courses = selected.courses
      .filter((course) => request.courseIds.includes(course.courseId))
      .map((course) => ({ ...course, restoreDeleted: request.restoreDeleted }));
    if (courses.length !== request.courseIds.length)
      throw new HttpError(
        400,
        'CLASSROOM_SELECTION_REQUIRED',
        'Salve a seleção de turmas antes de importar.',
      );
    const status = await this.status(userId);
    const prefs = await this.prefs.read(userId);
    if (kind === 'import' && !prefs.tasks && !prefs.subjects)
      throw new HttpError(
        403,
        'MODULE_DISABLED',
        'Ative tarefas ou matérias para importar.',
      );
    const timeZone = (await this.progress.settings(userId)).timeZone;
    const id = await this.repository.allowed(
      userId,
      status.version,
      [],
      (manager, row) =>
        this.operations.start(
          manager,
          userId,
          status.version,
          row.google_subject!,
          request.requestId,
          kind,
          { courses },
          timeZone,
        ),
    );
    return this.operations.result(userId, id, 1, 20);
  }
  async retry(userId: string, id: string) {
    const status = await this.status(userId);
    if (status.state !== 'connected')
      throw new HttpError(
        409,
        'CLASSROOM_RECONNECT_REQUIRED',
        'Reconecte antes de tentar novamente.',
      );
    const rows = await this.repository.source.query<
      Array<{ connection_version: number }>
    >(
      'SELECT connection_version FROM classroom_operations WHERE user_id=? AND id=?',
      [userId, id],
    );
    if (rows[0]?.connection_version !== status.version)
      throw new HttpError(
        409,
        'CLASSROOM_CONNECTION_CHANGED',
        'A conexão mudou. Solicite uma nova importação para as turmas selecionadas.',
      );
    await this.repository.allowed(userId, status.version, [], () =>
      this.operations.retry(userId, id),
    );
    return this.operations.result(userId, id, 1, 20);
  }
  async runOnce(worker = randomUUID()) {
    const operation = await this.operations.claim(worker);
    if (!operation) return false;
    const heartbeat = setInterval(() => {
      void this.operations.heartbeat(operation).catch(() => {});
    }, 20000);
    try {
      for (const selection of json<ClassroomSelection>(operation.selection)
        .courses) {
        try {
          await this.processCourse(operation, selection);
        } catch (error) {
          await this.operations.item(operation, {
            entity: 'course',
            courseId: selection.courseId,
            externalId: selection.courseId,
            title: 'Turma',
            outcome: 'error',
            reason: reason(error),
            localId: null,
            conflictId: null,
          });
        }
      }
      await this.operations.finish(operation);
    } catch (error) {
      await this.operations.finish(operation, reason(error));
    } finally {
      clearInterval(heartbeat);
    }
    return true;
  }
  private allowed<T>(
    row: OperationRow,
    capabilities: Capability[],
    work: (manager: EntityManager) => Promise<T>,
  ) {
    return this.repository.allowed(
      row.user_id,
      row.connection_version,
      capabilities,
      work,
    );
  }
  private async processCourse(
    row: OperationRow,
    selection: ClassroomSelection['courses'][number],
  ) {
    await this.allowed(row, [], async () => {});
    const course = await this.google.course(
      row.user_id,
      row.connection_version,
      selection.courseId,
    );
    const prefs = await this.prefs.read(row.user_id);
    let subjectId =
      selection.destination.kind === 'existing'
        ? selection.destination.subjectId
        : null;
    if (row.kind === 'import' && prefs.subjects) {
      await this.operations.heartbeat(row, 'importing');
      const input = classroomSubjectImportSchema.parse({
        receiptId: receiptId(row.id, `subject:${course.id}`),
        connectionVersion: row.connection_version,
        googleSubject: row.google_subject,
        course,
        destination: selection.destination,
        confirmDestinationChange: selection.confirmDestinationChange,
        ...(selection.restoreDeleted ? { restoreDeleted: true } : {}),
      });
      const result = await this.allowed(row, ['subjects'], (manager) =>
        this.subjects.importClassroom(manager, row.user_id, input),
      );
      subjectId = result.localId;
      await this.operations.item(row, {
        entity: 'subject',
        externalId: course.id,
        courseId: course.id,
        title: course.name,
        outcome: result.outcome,
        reason: result.reason,
        localId: result.localId,
        conflictId: result.conflict?.id ?? null,
      });
      if (subjectId)
        await this.allowed(row, ['subjects'], async (manager) => {
          await manager.query(
            'UPDATE classroom_selections SET selection=? WHERE user_id=? AND google_subject=? AND course_id=?',
            [
              JSON.stringify({
                ...selection,
                destination: { kind: 'existing', subjectId },
              }),
              row.user_id,
              row.google_subject,
              course.id,
            ],
          );
        });
    }
    if (row.kind === 'import' && !prefs.tasks) return;
    const works = await this.google.works(
      row.user_id,
      row.connection_version,
      course.id,
    );
    const zone = row.checkpoint
      ? json<{ timeZone: string }>(row.checkpoint).timeZone
      : 'UTC';
    for (const work of works) {
      try {
        await this.operations.heartbeat(row, 'importing');
        const current = await this.prefs.read(row.user_id);
        const input = taskFromClassroom(
          work,
          course,
          row.google_subject,
          zone,
          current.subjects ? subjectId : null,
        );
        const result = await this.allowed(
          row,
          current.subjects && subjectId ? ['tasks', 'subjects'] : ['tasks'],
          (manager) =>
            this.tasks.importClassroom(manager, row.user_id, {
              ...input,
              receiptId: receiptId(row.id, `task:${course.id}:${work.id}`),
              connectionVersion: row.connection_version,
              relinkSubject: selection.linkExistingTasks,
              ...(selection.restoreDeleted ? { restoreDeleted: true } : {}),
            }),
        );
        await this.operations.item(row, {
          entity: 'task',
          externalId: work.id,
          courseId: course.id,
          title: work.title,
          outcome: result.outcome,
          reason: result.reason,
          localId: result.localId,
          conflictId: result.conflict?.id ?? null,
        });
      } catch (error) {
        await this.operations.item(row, {
          entity: 'task',
          externalId: work.id,
          courseId: course.id,
          title: work.title,
          outcome: 'error',
          reason: reason(error),
          localId: null,
          conflictId: null,
        });
      }
    }
  }
}

// Export request validators at the HTTP boundary, independent of controllers.
export const classroomRequests = {
  pagination: classroomPaginationSchema,
  consent: classroomConsentSchema,
};
