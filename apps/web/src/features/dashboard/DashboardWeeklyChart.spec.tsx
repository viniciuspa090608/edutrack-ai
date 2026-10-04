import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { DashboardWeeklyChart } from './DashboardWeeklyChart.js';

afterEach(cleanup);

it('represents actual observations and distinguishes unavailable values from zero', () => {
  const { container } = render(
    <DashboardWeeklyChart
      series={[
        { date: '2026-10-05', values: { activeMs: 120000 } },
        { date: '2026-10-06', values: { activeMs: 60000 } },
        { date: '2026-10-07', values: { activeMs: 0 } },
        { date: '2026-10-08', values: {} },
      ]}
    />,
  );
  expect(screen.getByText('2 min')).toBeTruthy();
  expect(screen.getByText('1 min')).toBeTruthy();
  expect(screen.getByText('0 min')).toBeTruthy();
  expect(screen.getByText('Indisponível')).toBeTruthy();
  expect(
    [...container.querySelectorAll<HTMLElement>('.dashboard-chart-bar')].map(
      (bar) => bar.style.height,
    ),
  ).toEqual(['100%', '50%', '0%']);
  expect(container.querySelector('time')?.getAttribute('dateTime')).toBe(
    '2026-10-05',
  );
});

it('does not fabricate observations for an empty series or divide by zero', () => {
  const first = render(<DashboardWeeklyChart series={[]} />);
  expect(screen.getByText(/Sem observações/)).toBeTruthy();
  expect(first.container.querySelector('li')).toBeNull();
  first.unmount();
  const second = render(
    <DashboardWeeklyChart
      series={[{ date: '2026-10-05', values: { activeMs: 0 } }]}
    />,
  );
  expect(
    second.container.querySelector<HTMLElement>('.dashboard-chart-bar')?.style
      .height,
  ).toBe('0%');
});
