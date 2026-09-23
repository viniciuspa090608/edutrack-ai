import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FeatureCarousel } from './FeatureCarousel.js';

let mediaListeners: Set<() => void>;
let reducedMotion: boolean;

beforeEach(() => {
  vi.useFakeTimers();
  mediaListeners = new Set();
  reducedMotion = false;
  vi.stubGlobal('matchMedia', () => ({
    get matches() {
      return reducedMotion;
    },
    addEventListener: (_event: string, listener: () => void) =>
      mediaListeners.add(listener),
    removeEventListener: (_event: string, listener: () => void) =>
      mediaListeners.delete(listener),
  }));
  Object.defineProperty(document, 'hidden', {
    configurable: true,
    value: false,
  });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  Object.defineProperty(document, 'hidden', {
    configurable: true,
    value: false,
  });
});

function activeSlide() {
  return screen.getByRole('button', {
    name: /Mostrar slide.*Tarefas|Mostrar slide.*Seu caminho|Mostrar slide.*Foco|Mostrar slide.*Revisão/,
    current: true,
  });
}

describe('feature carousel', () => {
  it('keeps one active slide, advances and wraps around', () => {
    render(<FeatureCarousel />);
    expect(
      screen.getByRole('heading', { name: 'Tarefas em perspectiva' }),
    ).toBeTruthy();
    expect(document.querySelectorAll('.carousel-dot.is-active')).toHaveLength(
      1,
    );
    act(() => vi.advanceTimersByTime(6000));
    expect(
      screen.getByRole('heading', { name: 'Seu caminho de estudo' }),
    ).toBeTruthy();
    act(() => vi.advanceTimersByTime(18000));
    expect(
      screen.getByRole('heading', { name: 'Tarefas em perspectiva' }),
    ).toBeTruthy();
    expect(document.querySelectorAll('.carousel-dot.is-active')).toHaveLength(
      1,
    );
    expect(activeSlide().getAttribute('aria-label')).toContain('Tarefas');
  });

  it('allows manual navigation and pauses during hover and focus', () => {
    render(<FeatureCarousel />);
    const carousel = document.querySelector('.feature-carousel')!;
    fireEvent.mouseEnter(carousel);
    act(() => vi.advanceTimersByTime(6000));
    expect(
      screen.getByRole('heading', { name: 'Tarefas em perspectiva' }),
    ).toBeTruthy();
    fireEvent.mouseLeave(carousel);
    fireEvent.focus(screen.getByRole('button', { name: 'Próximo slide' }));
    act(() => vi.advanceTimersByTime(6000));
    expect(
      screen.getByRole('heading', { name: 'Tarefas em perspectiva' }),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Próximo slide' }));
    expect(
      screen.getByRole('heading', { name: 'Seu caminho de estudo' }),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Mostrar slide 4/ }));
    expect(
      screen.getByRole('heading', { name: 'Revisão que acompanha você' }),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Slide anterior' }));
    expect(
      screen.getByRole('heading', { name: 'Foco no seu ritmo' }),
    ).toBeTruthy();
  });

  it('pauses while the document is hidden', () => {
    render(<FeatureCarousel />);
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      value: true,
    });
    fireEvent(document, new Event('visibilitychange'));
    act(() => vi.advanceTimersByTime(6000));
    expect(
      screen.getByRole('heading', { name: 'Tarefas em perspectiva' }),
    ).toBeTruthy();
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      value: false,
    });
    fireEvent(document, new Event('visibilitychange'));
    act(() => vi.advanceTimersByTime(6000));
    expect(
      screen.getByRole('heading', { name: 'Seu caminho de estudo' }),
    ).toBeTruthy();
  });

  it('disables automatic advancement with reduced motion but keeps controls', () => {
    reducedMotion = true;
    render(<FeatureCarousel />);
    act(() => vi.advanceTimersByTime(12000));
    expect(
      screen.getByRole('heading', { name: 'Tarefas em perspectiva' }),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Próximo slide' }));
    expect(
      screen.getByRole('heading', { name: 'Seu caminho de estudo' }),
    ).toBeTruthy();
    reducedMotion = false;
    act(() => mediaListeners.forEach((listener) => listener()));
    act(() => vi.advanceTimersByTime(6000));
    expect(
      screen.getByRole('heading', { name: 'Foco no seu ritmo' }),
    ).toBeTruthy();
  });
});
