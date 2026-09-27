import type { Capability, ModulePreferences } from '@study-platform/contracts';

export const moduleCatalog: ReadonlyArray<{
  capability: Exclude<Capability, 'ai'>;
  path: string;
  label: string;
  delivered: boolean;
}> = [
  {
    capability: 'tasks',
    path: '/app/tarefas',
    label: 'Tarefas',
    delivered: true,
  },
  {
    capability: 'subjects',
    path: '/app/materias',
    label: 'Matérias',
    delivered: true,
  },
  {
    capability: 'flashcards',
    path: '/app/flashcards',
    label: 'Flashcards',
    delivered: true,
  },
];
export function availableModules(prefs: ModulePreferences) {
  return moduleCatalog.filter(
    (item) => item.delivered && prefs[item.capability],
  );
}
export function moduleAtPath(path: string) {
  return moduleCatalog.find(
    (item) => path === item.path || path.startsWith(`${item.path}/`),
  );
}
export function canUseAI(
  prefs: ModulePreferences,
  module: Exclude<Capability, 'ai'>,
  delivered: boolean,
): boolean {
  return delivered && prefs[module] && prefs.ai;
}
