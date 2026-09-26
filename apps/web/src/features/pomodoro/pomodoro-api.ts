import {
  currentPomodoroSchema,
  pomodoroSessionSchema,
  pomodoroHistorySchema,
  pomodoroSummarySchema,
  startPomodoroSchema,
  pomodoroCommandSchema,
  pomodoroActionSchema,
  pomodoroPageSchema,
} from '@study-platform/contracts';
import type { PomodoroAction } from '@study-platform/contracts';
import { send } from '../auth/auth-api.js';

export async function currentPomodoro() {
  return currentPomodoroSchema.parse(
    await (await send('/pomodoro/sessions/current')).json(),
  ).session;
}
export async function pomodoroHistory(page = 1, subjectId?: string) {
  const input = pomodoroPageSchema.parse({ page, subjectId });
  return pomodoroHistorySchema.parse(
    await (
      await send(
        `/pomodoro/sessions?page=${input.page}&pageSize=${input.pageSize}${input.subjectId ? `&subjectId=${input.subjectId}` : ''}`,
      )
    ).json(),
  );
}
export async function pomodoroSummary() {
  return pomodoroSummarySchema.parse(
    await (await send('/pomodoro/summary')).json(),
  );
}
async function post(path: string, body: object) {
  return pomodoroSessionSchema.parse(
    await (
      await send(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
    ).json(),
  );
}
export function startPomodoro(taskId?: string, subjectId?: string) {
  return post(
    '/pomodoro/sessions',
    startPomodoroSchema.parse({
      ...(taskId ? { taskId } : {}),
      ...(subjectId ? { subjectId } : {}),
    }),
  );
}
export function commandPomodoro(
  id: string,
  action: PomodoroAction,
  version: number,
) {
  return post(
    `/pomodoro/sessions/${pomodoroSessionSchema.shape.id.parse(id)}/${pomodoroActionSchema.parse(action)}`,
    pomodoroCommandSchema.parse({ version }),
  );
}
