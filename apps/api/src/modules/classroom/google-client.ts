import { z } from 'zod';
import { setTimeout } from 'node:timers/promises';
import { Temporal } from '@js-temporal/polyfill';
import {
  classroomCourseSchema,
  classroomSourceSchema,
  createTaskSchema,
} from '@study-platform/contracts';
import type { ClassroomCourse } from '@study-platform/contracts';
import type { ClassroomOAuthService } from './classroom-oauth.service.js';
import { classroomScopes } from './scopes.js';
import { HttpError } from '../../shared/http-error.js';

const safeLink = (value: string | undefined) =>
  value?.startsWith('https://') ? value : null;
const attachment = z.object({
  driveFile: z
    .object({
      driveFile: z.object({
        id: z.string(),
        title: z.string().optional(),
        alternateLink: z.string().optional(),
      }),
    })
    .optional(),
  link: z.object({ url: z.string(), title: z.string().optional() }).optional(),
  youtubeVideo: z
    .object({
      id: z.string(),
      title: z.string().optional(),
      alternateLink: z.string().optional(),
    })
    .optional(),
  form: z
    .object({ title: z.string().optional(), formUrl: z.string().optional() })
    .optional(),
});
export const googleWorkSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  alternateLink: z.string().optional(),
  state: z.string().optional(),
  materials: z.array(attachment).optional(),
  dueDate: z
    .object({ year: z.number(), month: z.number(), day: z.number() })
    .optional(),
  dueTime: z
    .object({
      hours: z.number().optional(),
      minutes: z.number().optional(),
      seconds: z.number().optional(),
      nanos: z.number().optional(),
    })
    .optional(),
});
export type GoogleWork = z.infer<typeof googleWorkSchema>;
export class ClassroomGoogleClient {
  constructor(
    private readonly oauth: ClassroomOAuthService,
    private readonly transport: typeof fetch = fetch,
  ) {}
  async request(
    userId: string,
    version: number,
    path: string,
    scopes: string[],
    attempt = 0,
  ): Promise<unknown> {
    const token = await this.oauth.access(userId, version, scopes);
    const response = await this.transport(
      `https://classroom.googleapis.com/v1/${path}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        redirect: 'error',
        signal: AbortSignal.timeout(30000),
      },
    );
    if ((response.status === 429 || response.status >= 500) && attempt < 2) {
      await response.body?.cancel();
      const delay = Math.min(
        10000,
        Math.max(
          500,
          Number(response.headers.get('Retry-After') ?? 0) * 1000,
          500 * 2 ** attempt,
        ),
      );
      await setTimeout(delay);
      return this.request(userId, version, path, scopes, attempt + 1);
    }
    if (!response.ok) {
      const failure = await readBounded(response, 65536)
        .then((bytes) => JSON.parse(bytes.toString('utf8')) as unknown)
        .catch(() => null);
      const details = z
        .object({
          error: z
            .object({
              details: z
                .array(z.object({ reason: z.string().optional() }))
                .optional(),
            })
            .optional(),
        })
        .safeParse(failure);
      if (
        details.success &&
        details.data.error?.details?.some(
          (detail) => detail.reason === 'SERVICE_DISABLED',
        )
      )
        throw new HttpError(
          503,
          'CLASSROOM_API_DISABLED',
          'Ative a Google Classroom API no projeto Google Cloud do Edutrack antes de importar turmas.',
        );
      if (
        details.success &&
        details.data.error?.details?.some(
          (detail) => detail.reason === 'ACCESS_TOKEN_SCOPE_INSUFFICIENT',
        )
      )
        throw new HttpError(
          403,
          'CLASSROOM_SCOPES_MISSING',
          'Reconecte autorizando as permissões de leitura necessárias.',
        );
      throw new HttpError(
        response.status === 429 || response.status >= 500 ? 503 : 403,
        'CLASSROOM_READ_FAILED',
        response.status === 403
          ? 'Acesso negado pelo Google. Verifique permissões e restrições da instituição.'
          : response.status === 429
            ? 'Limite do Google atingido. Tente novamente mais tarde.'
            : 'Não foi possível ler o conteúdo no Google Classroom.',
      );
    }
    // Bound untrusted remote response size before parsing.
    const bytes = await readBounded(response, 5 * 1024 * 1024);
    try {
      return JSON.parse(bytes.toString('utf8')) as unknown;
    } catch {
      throw new HttpError(
        502,
        'CLASSROOM_INVALID_RESPONSE',
        'Resposta inválida do Google.',
      );
    }
  }
  async courses(userId: string, version: number, pageToken?: string) {
    const query = new URLSearchParams({ pageSize: '100' });
    if (pageToken) query.set('pageToken', pageToken);
    const result = z
      .object({
        courses: z
          .array(
            z.object({
              id: z.string(),
              name: z.string(),
              section: z.string().optional(),
              alternateLink: z.string().optional(),
              courseState: z.string(),
            }),
          )
          .optional(),
        nextPageToken: z.string().optional(),
      })
      .parse(
        await this.request(userId, version, `courses?${query}`, [
          classroomScopes.courses,
        ]),
      );
    return {
      items: (result.courses ?? []).map((course) =>
        classroomCourseSchema.parse({
          id: course.id,
          name: course.name,
          section: course.section ?? null,
          link: safeLink(course.alternateLink),
          state: course.courseState,
        }),
      ),
      nextPageToken: result.nextPageToken ?? null,
    };
  }
  async course(
    userId: string,
    version: number,
    id: string,
  ): Promise<ClassroomCourse> {
    const course = z
      .object({
        id: z.string(),
        name: z.string(),
        section: z.string().optional(),
        alternateLink: z.string().optional(),
        courseState: z.string(),
      })
      .parse(
        await this.request(
          userId,
          version,
          `courses/${encodeURIComponent(id)}`,
          [classroomScopes.courses],
        ),
      );
    return classroomCourseSchema.parse({
      id: course.id,
      name: course.name,
      section: course.section ?? null,
      link: safeLink(course.alternateLink),
      state: course.courseState,
    });
  }
  async works(userId: string, version: number, courseId: string) {
    const result: GoogleWork[] = [];
    let token: string | undefined;
    const seen = new Set<string>();
    do {
      const query = new URLSearchParams({ pageSize: '100' });
      if (token) query.set('pageToken', token);
      const resource = 'courseWork';
      const page = z
        .object({
          courseWork: z.array(googleWorkSchema).optional(),
          nextPageToken: z.string().optional(),
        })
        .parse(
          await this.request(
            userId,
            version,
            `courses/${encodeURIComponent(courseId)}/${resource}?${query}`,
            [classroomScopes.courses],
          ),
        );
      result.push(
        ...(page.courseWork ?? []).filter(
          (item) => !item.state || item.state === 'PUBLISHED',
        ),
      );
      token = page.nextPageToken;
      if (token && seen.has(token))
        throw new HttpError(
          502,
          'CLASSROOM_INVALID_RESPONSE',
          'A paginação do Google não avançou.',
        );
      if (token) seen.add(token);
      if (result.length > 10000)
        throw new HttpError(
          422,
          'CLASSROOM_LIMIT',
          'A turma excede 10.000 itens por operação.',
        );
    } while (token);
    return result;
  }
}
export async function readBounded(response: Response, maximum: number) {
  if (!response.body)
    throw new HttpError(
      502,
      'CLASSROOM_EMPTY_RESPONSE',
      'Resposta vazia do Google.',
    );
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > maximum)
        throw new HttpError(
          422,
          'CLASSROOM_RESPONSE_LIMIT',
          'Conteúdo excede o limite permitido.',
        );
      chunks.push(value);
    }
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
  return Buffer.concat(chunks);
}
export function taskFromClassroom(
  work: GoogleWork,
  course: ClassroomCourse,
  googleSubject: string,
  timeZone: string,
  subjectId: string | null,
) {
  let originalDueDate: string | null = null,
    originalDueTime: string | null = null,
    dueAt: string | null = null,
    dueDate: string | null = null;
  if (work.dueDate) {
    const date = Temporal.PlainDate.from(work.dueDate);
    originalDueDate = date.toString();
    dueDate = originalDueDate;
    if (work.dueTime) {
      const time = work.dueTime;
      const instant = date
        .toPlainDateTime({
          hour: time.hours ?? 0,
          minute: time.minutes ?? 0,
          second: time.seconds ?? 0,
        })
        .toZonedDateTime('UTC')
        .toInstant();
      dueAt = instant.toString();
      originalDueTime = `${String(time.hours ?? 0).padStart(2, '0')}:${String(time.minutes ?? 0).padStart(2, '0')}:${String(time.seconds ?? 0).padStart(2, '0')}`;
      dueDate = instant.toZonedDateTimeISO(timeZone).toPlainDate().toString();
    }
  }
  const attachments = (work.materials ?? []).flatMap((material) => {
    const file = material.driveFile?.driveFile;
    const link = safeLink(
      file?.alternateLink ??
        material.link?.url ??
        material.youtubeVideo?.alternateLink ??
        material.form?.formUrl,
    );
    return link
      ? [
          {
            title:
              file?.title ??
              material.link?.title ??
              material.youtubeVideo?.title ??
              material.form?.title ??
              'Material',
            link,
          },
        ]
      : [];
  });
  return {
    source: classroomSourceSchema.parse({
      googleSubject,
      courseId: course.id,
      itemId: work.id,
      courseName: course.name,
      link: safeLink(work.alternateLink),
      attachments,
      originalDueDate,
      originalDueTime,
      dueAt,
      timeZone,
    }),
    task: createTaskSchema.parse({
      title: work.title,
      description: work.description ?? null,
      dueDate,
      subjectId,
    }),
  };
}
