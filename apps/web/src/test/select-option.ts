import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/** Exercise the visible Radix menu instead of dispatching native select events. */
export async function selectOption(
  trigger: HTMLElement,
  value: string | number,
) {
  const user = userEvent.setup();
  await user.click(trigger);
  const option = (await screen.findAllByRole('option')).find(
    (item) =>
      item.getAttribute('data-value') ===
      (value === '' ? '__edutrack_empty__' : String(value)),
  );
  if (!option) throw new Error(`Select option unavailable: ${value}`);
  await user.click(option);
}
