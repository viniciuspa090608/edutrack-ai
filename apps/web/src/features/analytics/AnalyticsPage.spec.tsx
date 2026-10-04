import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
  fireEvent,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import type { StudyAnalytics } from '@study-platform/contracts';
import { AnalyticsPage } from './AnalyticsPage.js';
import { studyAnalytics } from './analytics-api.js';
import { setTheme } from '../../app/theme.js';
vi.mock('./analytics-api.js', () => ({ studyAnalytics: vi.fn() }));
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
  document.documentElement.classList.remove('dark');
});
it('renders original daily values and dates with distinct zeros and gaps without mixing units', async () => {
  vi.mocked(studyAnalytics).mockResolvedValue({
    ...data,
    metrics: {
      tasks: { ...metric, percent: 25, previous: 4, difference: 1 },
      activeMs: { ...metric, current: 90000 },
    },
    series: [
      { date: '2026-10-01', values: { tasks: 5, activeMs: 90000 } },
      { date: '2026-10-02', values: { tasks: 0, activeMs: 0 } },
      { date: '2026-10-03', values: {} },
    ],
  });
  render(<AnalyticsPage />);
  const taskChart = await screen.findByRole('region', {
    name: 'Série diária: Tarefas concluídas',
  });
  const timeChart = screen.getByRole('region', {
    name: 'Série diária: Tempo ativo Pomodoro',
  });
  expect(within(taskChart).getByText('5')).toBeTruthy();
  expect(within(taskChart).getByText('0')).toBeTruthy();
  expect(within(taskChart).getByText('Indisponível')).toBeTruthy();
  expect(within(timeChart).getByText('1,5 min')).toBeTruthy();
  expect(taskChart.querySelectorAll('time')).toHaveLength(3);
  expect(
    Array.from(taskChart.querySelectorAll('time')).map((item) => item.dateTime),
  ).toEqual(['2026-10-01', '2026-10-02', '2026-10-03']);
  const textSeries = screen.getByRole('list');
  expect(within(textSeries).getAllByRole('listitem')).toHaveLength(3);
  expect(within(textSeries).getByText('1,5 min')).toBeTruthy();
  expect(
    within(textSeries).getAllByText('Histórico indisponível'),
  ).toHaveLength(2);
  expect(screen.getByText('25%')).toBeTruthy();
  expect(screen.queryByText('Flashcards avaliados')).toBeNull();
});

it('preserves draft on theme changes, validates query and refreshes only on existing events', async () => {
  vi.mocked(studyAnalytics).mockResolvedValue(data);
  const view = render(<AnalyticsPage />);
  await screen.findByText(/Período atual parcial/);
  const user = userEvent.setup();
  const zone = screen.getByLabelText('Fuso IANA');
  await user.clear(zone);
  await user.type(zone, 'Invalid/Timezone');
  setTheme('dark');
  expect((zone as HTMLInputElement).value).toBe('Invalid/Timezone');
  await user.click(screen.getByRole('button', { name: 'Consultar' }));
  expect(
    await screen.findByText('Informe uma data e um fuso IANA válidos.'),
  ).toBeTruthy();
  expect(studyAnalytics).toHaveBeenCalledTimes(1);
  setTheme('light');
  fireEvent(window, new Event('focus'));
  await waitFor(() => expect(studyAnalytics).toHaveBeenCalledTimes(2));
  fireEvent(window, new Event('edutrack:preferences'));
  await waitFor(() => expect(studyAnalytics).toHaveBeenCalledTimes(3));
  view.unmount();
  fireEvent(window, new Event('focus'));
  expect(studyAnalytics).toHaveBeenCalledTimes(3);
});

it('retains every annual sample and provides a focusable local chart region', async () => {
  const series = Array.from({ length: 365 }, (_, index) => ({
    date: new Date(Date.UTC(2025, 0, index + 1)).toISOString().slice(0, 10),
    values: { tasks: index % 3 },
  }));
  vi.mocked(studyAnalytics).mockResolvedValue({
    ...data,
    metrics: { tasks: metric },
    series,
  });
  render(<AnalyticsPage />);
  const region = await screen.findByRole('region', {
    name: 'Série diária: Tarefas concluídas',
  });
  expect(region.getAttribute('tabindex')).toBe('0');
  expect(region.querySelectorAll('time')).toHaveLength(365);
  expect(screen.getAllByRole('listitem')).toHaveLength(365);
  expect(region.querySelector('time')?.dateTime).toBe('2025-01-01');
  expect(Array.from(region.querySelectorAll('time')).at(-1)?.dateTime).toBe(
    '2025-12-31',
  );
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
it.each([
  ['Dia', 'day'],
  ['Semana', 'week'],
  ['Trimestre', 'quarter'],
  ['Semestre', 'semester'],
  ['Ano', 'year'],
])(
  'submits the supported %s period with the original date and timezone',
  async (label, granularity) => {
    vi.mocked(studyAnalytics).mockResolvedValue(data);
    render(<AnalyticsPage />);
    await screen.findByText(/Período atual parcial/);
    const user = userEvent.setup();
    await user.click(screen.getByRole('combobox', { name: 'Período' }));
    await user.click(screen.getByRole('option', { name: label }));
    fireEvent.change(screen.getByLabelText('Data de referência'), {
      target: { value: '2026-10-01' },
    });
    await user.clear(screen.getByLabelText('Fuso IANA'));
    await user.type(screen.getByLabelText('Fuso IANA'), 'America/Sao_Paulo');
    screen.getByRole('button', { name: 'Consultar' }).focus();
    await user.keyboard('{Enter}');
    await waitFor(() =>
      expect(studyAnalytics).toHaveBeenLastCalledWith({
        granularity,
        date: '2026-10-01',
        timeZone: 'America/Sao_Paulo',
      }),
    );
  },
);
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
  await user.click(screen.getByRole('combobox', { name: 'Período' }));
  await user.click(screen.getByRole('option', { name: 'Ano' }));
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
