import { subjectSchema } from '@study-platform/contracts';

export function linkedSubject(enabled: boolean) {
  if (!enabled) return '';
  const parsed = subjectSchema.shape.id.safeParse(
    new URLSearchParams(window.location.search).get('subjectId'),
  );
  return parsed.success ? parsed.data : '';
}
