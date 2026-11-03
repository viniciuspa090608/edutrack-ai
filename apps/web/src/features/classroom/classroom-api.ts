import { errorResponseSchema } from '@study-platform/contracts';
import { apiUrl } from '../auth/api-url.js';
export async function classroomRequest(
  path: string,
  method = 'GET',
  body?: object,
): Promise<unknown> {
  const response = await fetch(apiUrl(path), {
    credentials: 'include',
    method,
    ...(!['GET', 'HEAD'].includes(method.toUpperCase())
      ? {
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body ?? {}),
        }
      : {}),
  });
  if (!response.ok) {
    const parsed = errorResponseSchema.safeParse(
      await response.json().catch(() => null),
    );
    throw new Error(
      parsed.success
        ? parsed.data.error.message
        : 'Não foi possível concluir a operação. Tente novamente.',
    );
  }
  return response.status === 204 ? null : response.json();
}
export const classroomPath = '/integrations/google-classroom';
export function classroomError(error: unknown): string {
  return error instanceof Error && error.name !== 'ZodError'
    ? error.message
    : 'Não foi possível carregar ou validar os dados. Tente novamente.';
}
