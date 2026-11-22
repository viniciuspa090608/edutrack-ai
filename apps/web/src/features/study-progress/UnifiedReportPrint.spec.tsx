import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import {
  studyAchievementCatalog,
  type StudyAnalytics,
  type StudyProgress,
} from '@study-platform/contracts';
import { UnifiedReportPrint } from './UnifiedReportPrint.js';
import { studyProgress } from './progress-api.js';
import { studyAnalytics } from '../analytics/analytics-api.js';
import {
  applyAnalyticsQuery,
  appliedAnalyticsQuery,
  setReportOwner,
} from './report-query.js';

vi.mock('./progress-api.js', () => ({ studyProgress: vi.fn() }));
vi.mock('../analytics/analytics-api.js', () => ({ studyAnalytics: vi.fn() }));
const progress: StudyProgress = {
  timeZone: 'UTC',
  trackingStartedAt: '2026-10-01T00:00:00.000Z',
  today: '2026-10-03',
  currentStreak: 2,
  longestStreak: 2,
  activeDays: 2,
  achievements: studyAchievementCatalog.map((item, index) => ({
    ...item,
    progress: index === 0 ? 1 : 0,
    earnedAt: index === 0 ? '2026-10-01T00:00:00.000Z' : null,
  })),
};
const metric = {
  current: 5,
  previous: 0,
  difference: 5,
  percent: null,
  coverageStart: progress.trackingStartedAt,
  currentStatus: 'available' as const,
  previousStatus: 'available' as const,
};
const analytics: StudyAnalytics = {
  timeZone: 'UTC',
  period: { start: '2026-10-01', end: '2026-10-04', partial: true, days: 3 },
  previousPeriod: {
    start: '2026-09-28',
    end: '2026-10-01',
    partial: false,
    days: 3,
  },
  metrics: { tasks: metric },
  series: [
    { date: '2026-10-01', values: { tasks: 5 } },
    { date: '2026-10-02', values: { tasks: 0 } },
    { date: '2026-10-03', values: {} },
  ],
  frequency: { activeDays: 2, days: 3, status: 'available' },
};
beforeEach(() => {
  setReportOwner('test-owner');
  vi.mocked(studyProgress).mockResolvedValue(progress);
  vi.mocked(studyAnalytics).mockResolvedValue(analytics);
});
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
  setReportOwner(null);
  document.body.removeAttribute('data-unified-printing');
});
function loadLogo(container: HTMLElement) {
  fireEvent.load(container.querySelector('img')!);
}
async function ready(container: HTMLElement) {
  loadLogo(container);
  const button = screen.getByRole<HTMLButtonElement>('button', {
    name: 'Imprimir relatório',
  });
  await waitFor(() => expect(button.disabled).toBe(false));
  return button;
}
it('requires both sources and the logo, prints ordered complete snapshots and restores after cancel', async () => {
  let resolve!: (value: StudyAnalytics) => void;
  vi.mocked(studyAnalytics).mockImplementationOnce(
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );
  const { container } = render(<UnifiedReportPrint />);
  const button = screen.getByRole<HTMLButtonElement>('button', {
    name: 'Imprimir relatório',
  });
  loadLogo(container);
  expect(button.disabled).toBe(true);
  await act(async () => resolve(analytics));
  await waitFor(() => expect(button.disabled).toBe(false));
  const print = vi.spyOn(window, 'print').mockImplementation(() => {
    fireEvent(window, new Event('beforeprint'));
  });
  button.focus();
  await userEvent.click(button);
  const report = document.querySelector<HTMLElement>('.unified-study-report')!;
  expect(print).toHaveBeenCalledOnce();
  expect(document.querySelectorAll('.unified-study-report')).toHaveLength(1);
  expect(report.textContent!.indexOf('Conquistas')).toBeLessThan(
    report.textContent!.indexOf('Estatísticas de estudo'),
  );
  expect(report.querySelector('img')?.getAttribute('src')).toBe('/favicon.png');
  expect(report.querySelector('details')?.open).toBe(true);
  expect(
    within(report)
      .getByRole('table', { name: 'Valores diários em texto', hidden: true })
      .querySelectorAll('tbody tr'),
  ).toHaveLength(3);
  expect(report.textContent).toContain('Não calculável');
  expect(report.textContent).toContain('Histórico indisponível');
  const stamp = report.querySelector('time')?.dateTime;
  fireEvent(window, new Event('beforeprint'));
  expect(report.querySelector('time')?.dateTime).toBe(stamp);
  fireEvent(window, new Event('focus'));
  expect(document.querySelector('.unified-study-report')).toBe(report);
  fireEvent(window, new Event('afterprint'));
  expect(document.querySelector('.unified-study-report')).toBeNull();
  expect(document.body.hasAttribute('data-unified-printing')).toBe(false);
  expect(document.activeElement).toBe(button);
  print.mockRestore();
});
it('recovers an unavailable source and permits a genuinely empty progress section', async () => {
  vi.mocked(studyAnalytics).mockRejectedValueOnce(new Error('offline'));
  vi.mocked(studyProgress).mockResolvedValue({
    ...progress,
    activeDays: 0,
    achievements: progress.achievements.map((item) => ({
      ...item,
      earnedAt: null,
      progress: 0,
    })),
  });
  const { container } = render(<UnifiedReportPrint />);
  loadLogo(container);
  await screen.findByText('Não foi possível preparar o relatório completo.');
  expect(
    screen.getByRole<HTMLButtonElement>('button', {
      name: 'Imprimir relatório',
    }).disabled,
  ).toBe(true);
  await userEvent.click(
    screen.getByRole('button', { name: 'Tentar preparar relatório novamente' }),
  );
  const button = await ready(container);
  const print = vi.spyOn(window, 'print').mockImplementation(() => {});
  await userEvent.click(button);
  expect(
    document.querySelector('.unified-study-report')?.textContent,
  ).toContain('Nenhuma conquista registrada');
  fireEvent(window, new Event('afterprint'));
  print.mockRestore();
});
it('blocks confirmed total inactivity and preserves applied queries only for their owner', async () => {
  vi.mocked(studyProgress).mockResolvedValue({ ...progress, activeDays: 0 });
  vi.mocked(studyAnalytics).mockResolvedValue({
    ...analytics,
    frequency: { ...analytics.frequency, activeDays: 0 },
  });
  const query = {
    granularity: 'year' as const,
    date: '2026-10-03',
    timeZone: 'UTC',
  };
  applyAnalyticsQuery(query);
  const { container } = render(<UnifiedReportPrint />);
  loadLogo(container);
  await screen.findByText('Nenhuma atividade para imprimir.');
  expect(studyAnalytics).toHaveBeenLastCalledWith(query);
  expect(
    screen.getByRole<HTMLButtonElement>('button', {
      name: 'Imprimir relatório',
    }).disabled,
  ).toBe(true);
  setReportOwner('other-owner');
  expect(appliedAnalyticsQuery()).toBeNull();
});
it('removes the print portal when unmounted, and a second entry point prints the same content', async () => {
  const print = vi.spyOn(window, 'print').mockImplementation(() => {});
  const first = render(<UnifiedReportPrint />);
  await userEvent.click(await ready(first.container));
  const original = document.querySelector('.unified-study-report')!.textContent;
  first.unmount();
  expect(document.querySelector('.unified-study-report')).toBeNull();
  const second = render(<UnifiedReportPrint />);
  await userEvent.click(await ready(second.container));
  expect(document.querySelector('.unified-study-report')!.textContent).toBe(
    original,
  );
  fireEvent(window, new Event('afterprint'));
  print.mockRestore();
});

it('imprime as nove conquistas obtidas com total e novos critérios', async () => {
  vi.mocked(studyProgress).mockResolvedValue({
    ...progress,
    achievements: studyAchievementCatalog.map((item) => ({
      ...item,
      progress: item.target,
      earnedAt: '2026-10-03T12:00:00.000Z',
    })),
  });
  const { container } = render(<UnifiedReportPrint />);
  const button = await ready(container);
  const print = vi.spyOn(window, 'print').mockImplementation(() => {});
  await userEvent.click(button);
  const report = document.querySelector('.unified-study-report')!;
  expect(report.querySelectorAll('.achievement-earned')).toHaveLength(9);
  expect(report.textContent).toContain('9 conquistas registradas de 9');
  expect(report.textContent).toContain('Quatorze dias seguidos');
  expect(report.textContent).toContain(
    'Registrar 100 avaliações de flashcards.',
  );
  fireEvent(window, new Event('afterprint'));
  print.mockRestore();
});
