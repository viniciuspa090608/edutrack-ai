import type { Capability, ModulePreferences } from '@study-platform/contracts';

export const moduleCatalog: ReadonlyArray<{
  capability: Extract<Capability, 'tasks' | 'subjects' | 'flashcards'>;
  path: string;
  label: string;
  delivered: boolean;
}> = [
  {
    capability: 'subjects',
    path: '/app/materias',
    label: 'Disciplinas',
    delivered: true,
  },
  {
    capability: 'tasks',
    path: '/app/tarefas',
    label: 'Tarefas',
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
  module: (typeof moduleCatalog)[number]['capability'],
  delivered: boolean,
): boolean {
  return delivered && prefs[module] && prefs.ai;
}

export const preferenceOrder: readonly Capability[] = [
  'subjects',
  'tasks',
  'flashcards',
  'pomodoro',
  'routines',
  'reports',
  'ai',
];
export const preferenceLabels: Record<Capability, string> = {
  tasks: 'Tarefas',
  subjects: 'Disciplinas',
  flashcards: 'Flashcards',
  pomodoro: 'Pomodoro',
  routines: 'Rotinas',
  reports: 'Relatório',
  ai: 'Recursos de IA',
};
export const preferencePaths: Record<Capability, string> = {
  tasks: '/app/tarefas',
  subjects: '/app/materias',
  flashcards: '/app/flashcards',
  pomodoro: '/app/pomodoro',
  routines: '/app/rotinas',
  reports: '/app/progresso',
  ai: '/conta#account-ai',
};
