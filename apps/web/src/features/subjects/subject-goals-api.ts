import {
  subjectGoalInputSchema,
  subjectInsightsSchema,
  subjectSchema,
  type SubjectGoalInput,
} from '@study-platform/contracts';
import { send } from '../auth/auth-api.js';

export async function readSubjectInsights(id: string) {
  return subjectInsightsSchema.parse(
    await (
      await send(`/subjects/${subjectSchema.shape.id.parse(id)}/insights`)
    ).json(),
  );
}
export async function saveSubjectGoal(id: string, input: SubjectGoalInput) {
  return subjectInsightsSchema.parse(
    await (
      await send(`/subjects/${subjectSchema.shape.id.parse(id)}/goal`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subjectGoalInputSchema.parse(input)),
      })
    ).json(),
  );
}
