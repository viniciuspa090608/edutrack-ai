import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import type { StudyAnalytics } from '@study-platform/contracts';
import { AnalyticsPage } from './AnalyticsPage.js';
import { studyAnalytics } from './analytics-api.js';
vi.mock('./analytics-api.js', () => ({ studyAnalytics: vi.fn() }));
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});
const metric = {
  current: 5,
  previous: 0,
  difference: 5,
  percent: null,
  coverageStart: '2026-01-01T00:00:00.000Z',
  currentStatus: 'available' as const,
  previousStatus: 'available' as const,
};
const data: StudyAnalytics = {
  timeZone: 'UTC',
  period: { start: '2026-10-01', end: '2026-10-02', partial: true, days: 1 },
  previousPeriod: {
    start: '2026-09-30',
    end: '2026-10-01',
    partial: false,
    days: 1,
  },
  metrics: { tasks: metric, activeMs: { ...metric, current: 600000 } },
  series: [{ date: '2026-10-01', values: { tasks: 5, activeMs: 600000 } }],
  frequency: { activeDays: 1, days: 1, status: 'available' },
};
it('shows partial comparisons, text series and omitted modules, and submits filters by keyboard', async () => {
  vi.mocked(studyAnalytics).mockResolvedValue(data);
  render(<AnalyticsPage />);
  expect(await screen.findByText(/Período atual parcial/)).toBeTruthy();
  expect(screen.getAllByText('Não calculável', { exact: false })).toHaveLength(
    2,
  );
  expect(screen.queryByText('Flashcards avaliados')).toBeNull();
  expect(screen.getByRole('list')).toBeTruthy();
  const user = userEvent.setup();
  await user.selectOptions(screen.getByLabelText('Período'), 'year');
  await user.clear(screen.getByLabelText('Fuso IANA'));
  await user.type(screen.getByLabelText('Fuso IANA'), 'America/New_York');
  screen.getByRole('button', { name: 'Consultar' }).focus();
  await user.keyboard('{Enter}');
  await waitFor(() =>
    expect(studyAnalytics).toHaveBeenLastCalledWith(
      expect.objectContaining({
        granularity: 'year',
        timeZone: 'America/New_York',
      }),
    ),
  );
});
it('distinguishes loading, recoverable failure, empty and unavailable history', async () => {
  vi.mocked(studyAnalytics).mockImplementationOnce(() => new Promise(() => {}));
  const first = render(<AnalyticsPage />);
  expect(screen.getByRole('status').textContent).toContain('Carregando');
  first.unmount();
  vi.mocked(studyAnalytics).mockRejectedValueOnce(new Error('offline'));
  render(<AnalyticsPage />);
  expect(await screen.findByRole('alert')).toBeTruthy();
  vi.mocked(studyAnalytics).mockResolvedValueOnce({
    ...data,
    metrics: {
      tasks: {
        ...metric,
        current: null,
        previous: null,
        difference: null,
        currentStatus: 'history_unavailable',
        previousStatus: 'history_unavailable',
      },
    },
    series: [{ date: '2026-10-01', values: {} }],
    frequency: { activeDays: 0, days: 1, status: 'history_unavailable' },
  });
  await userEvent.click(
    screen.getByRole('button', { name: 'Tentar novamente' }),
  );
  expect(await screen.findByText(/Nenhuma atividade registrada;/)).toBeTruthy();
  expect(
    screen.getByText(/frequência mostra apenas atividades registradas/),
  ).toBeTruthy();
  cleanup();
  vi.mocked(studyAnalytics).mockResolvedValueOnce({
    ...data,
    frequency: { activeDays: 0, days: 1, status: 'available' },
  });
  render(<AnalyticsPage />);
  expect(
    await screen.findByText('Nenhuma atividade neste período.'),
  ).toBeTruthy();
});
