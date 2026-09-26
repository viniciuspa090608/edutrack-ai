import {
  createRoutineSchema,
  updateRoutineSchema,
  routineSchema,
  routineListSchema,
  routineScheduleSchema,
  routinePaginationSchema,
} from '@study-platform/contracts';
import type { UpdateRoutine } from '@study-platform/contracts';
import { send } from '../auth/auth-api.js';
export async function listRoutines(page = 1) {
  const query = routinePaginationSchema.parse({ page });
  return routineListSchema.parse(
    await (
      await send(`/routines?page=${query.page}&pageSize=${query.pageSize}`)
    ).json(),
  );
}
export async function routineSchedule() {
  return routineScheduleSchema.parse(
    await (await send('/routines/schedule')).json(),
  );
}
export async function routineDetail(id: string) {
  return routineSchema.parse(
    await (await send(`/routines/${routineSchema.shape.id.parse(id)}`)).json(),
  );
}
export async function saveRoutine(id: string | null, input: UpdateRoutine) {
  const body = id
    ? updateRoutineSchema.parse(input)
    : createRoutineSchema.parse(input);
  return routineSchema.parse(
    await (
      await send(
        id ? `/routines/${routineSchema.shape.id.parse(id)}` : '/routines',
        {
          method: id ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        },
      )
    ).json(),
  );
}
export async function deleteRoutine(id: string) {
  await send(`/routines/${routineSchema.shape.id.parse(id)}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  });
}
