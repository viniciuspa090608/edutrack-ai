import type { Capability, ModulePreferences } from '@study-platform/contracts';

export const moduleCatalog: ReadonlyArray<{
  capability: Exclude<Capability, 'ai'>;
  path: string;
  label: string;
  delivered: boolean;
}> = [
  { capability: 'tasks', path: '/tarefas', label: 'Tarefas', delivered: false },
  {
    capability: 'subjects',
    path: '/materias',
    label: 'Matérias',
    delivered: false,
  },
  {
    capability: 'flashcards',
    path: '/flashcards',
    label: 'Flashcards',
    delivered: false,
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
