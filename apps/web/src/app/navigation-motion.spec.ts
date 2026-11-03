import { afterEach, expect, it, vi } from 'vitest';
import { waitForExit } from './navigation-motion.js';
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
it('finishes without animationend and ignores bubbled child events', async () => {
  vi.useFakeTimers();
  const node = document.createElement('main');
  const child = node.appendChild(document.createElement('span'));
  const done = vi.fn();
  const result = waitForExit(node).then(done);
  child.dispatchEvent(new Event('animationend', { bubbles: true }));
  await Promise.resolve();
  expect(done).not.toHaveBeenCalled();
  await vi.advanceTimersByTimeAsync(650);
  await result;
  expect(done).toHaveBeenCalledTimes(1);
});
it('completes immediately for reduced motion and on cancellation', async () => {
  vi.stubGlobal('matchMedia', () => ({ matches: true }));
  await waitForExit(document.createElement('main'));
  vi.stubGlobal('matchMedia', () => ({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
  const node = document.createElement('main');
  const result = waitForExit(node);
  node.dispatchEvent(new Event('animationcancel'));
  await result;
});
