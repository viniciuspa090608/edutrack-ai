import type { Capability, ModulePreferences } from '@study-platform/contracts';
import type { DataSource } from 'typeorm';
import type { RequestHandler } from 'express';
import { HttpError } from '../../shared/http-error.js';
import { PreferencesRepository } from './preferences.repository.js';

export class PreferencesService {
  private readonly repository: PreferencesRepository;
  constructor(source: DataSource) {
    this.repository = new PreferencesRepository(source);
  }
  async read(userId: string): Promise<ModulePreferences> {
    return this.repository.read(userId);
  }
  async update(
    userId: string,
    values: { [K in Capability]?: boolean | undefined },
  ): Promise<ModulePreferences> {
    return this.repository.update(userId, values);
  }
  async requireEnabled(userId: string, capability: Capability): Promise<void> {
    if (!(await this.read(userId))[capability])
      throw new HttpError(
        403,
        capability === 'ai' ? 'AI_DISABLED' : 'MODULE_DISABLED',
        capability === 'ai'
          ? 'Ative a IA nas preferências.'
          : 'Reative este módulo nas preferências.',
      );
  }
  guard(module: Exclude<Capability, 'ai'>, ai = false): RequestHandler {
    return async (_request, response, next) => {
      try {
        await this.requireEnabled(response.locals.userId as string, module);
        if (ai)
          await this.requireEnabled(response.locals.userId as string, 'ai');
        next();
      } catch (error) {
        next(error);
      }
    };
  }
}
