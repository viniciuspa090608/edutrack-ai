import {
  studyProgressSchema,
  studyTimeZoneSettingsSchema,
  studyTimeZoneUpdateSchema,
} from '@study-platform/contracts';
import { send } from '../auth/auth-api.js';
export async function studyProgress() {
  return studyProgressSchema.parse(
    await (await send('/study-progress')).json(),
  );
}
export async function studyTimeZone() {
  return studyTimeZoneSettingsSchema.parse(
    await (await send('/account/study-timezone')).json(),
  );
}
export async function saveStudyTimeZone(timeZone: string) {
  return studyTimeZoneSettingsSchema.parse(
    await (
      await send('/account/study-timezone', {
        method: 'PATCH',
        body: JSON.stringify(studyTimeZoneUpdateSchema.parse({ timeZone })),
      })
    ).json(),
  );
}
