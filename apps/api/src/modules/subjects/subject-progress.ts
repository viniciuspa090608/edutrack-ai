import type { SubjectStudySummary } from '@study-platform/contracts';

export function subjectProgress(
  source: SubjectStudySummary['source'],
  total: number,
  completed: number,
): SubjectStudySummary {
  return {
    source,
    total,
    completed,
    progressPercent: total ? (completed / total) * 100 : null,
  };
}
