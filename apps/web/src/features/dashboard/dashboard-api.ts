import { dashboardSchema } from '@study-platform/contracts';
import { send } from '../auth/auth-api.js';
export async function dashboard() {
  return dashboardSchema.parse(await (await send('/dashboard')).json());
}
