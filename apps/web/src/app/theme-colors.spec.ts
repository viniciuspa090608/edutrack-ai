import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
const css = readFileSync('../../packages/ui/src/styles/globals.css', 'utf8');

function colors(selector: string) {
  const block = css.slice(css.indexOf(`${selector} {`)).split('}')[0]!;
  return Object.fromEntries(
    [...block.matchAll(/--([\w-]+):\s*(#[\da-f]{6});/g)].map((match) => [
      match[1]!,
      match[2]!,
    ]),
  );
}

function rgb(hex: string) {
  return [1, 3, 5].map((index) => parseInt(hex.slice(index, index + 2), 16));
}

function luminance(value: number[]) {
  return value.reduce((sum, channel, index) => {
    const s = channel / 255;
    const linear = s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    return sum + linear * [0.2126, 0.7152, 0.0722][index]!;
  }, 0);
}

function contrast(a: number[], b: number[]) {
  const x = luminance(a),
    y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

describe.each([':root', '.dark'])('%s theme contrast', (selector) => {
  const tokens = colors(selector);

  it('provides every color and its Tailwind mapping in both themes', () => {
    expect(Object.keys(colors(':root')).sort()).toEqual(
      Object.keys(colors('.dark')).sort(),
    );
    for (const token of Object.keys(tokens))
      expect(css).toContain(`--color-${token}: var(--${token});`);
  });

  it('keeps foreground pairs readable, including translucent action hover states', () => {
    for (const surface of [
      'background',
      'card',
      'popover',
      'primary',
      'secondary',
      'muted',
      'accent',
      'destructive',
      'success',
      'warning',
      'info',
    ]) {
      const foreground =
        surface === 'background' ? 'foreground' : `${surface}-foreground`;
      expect(
        contrast(rgb(tokens[surface]!), rgb(tokens[foreground]!)),
        `${foreground} on ${surface}`,
      ).toBeGreaterThanOrEqual(4.5);
    }
    for (const backdrop of ['background', 'card', 'popover']) {
      const bg = rgb(tokens[backdrop]!);
      for (const text of [
        'primary',
        'muted-foreground',
        'success',
        'warning',
        'destructive',
        'info',
      ])
        expect(
          contrast(rgb(tokens[text]!), bg),
          `${text} on ${backdrop}`,
        ).toBeGreaterThanOrEqual(4.5);
      for (const [surface, alpha] of [
        ['primary', 0.9],
        ['destructive', 0.9],
        ['secondary', 0.8],
      ] as const) {
        const mixed = rgb(tokens[surface]!).map(
          (channel, index) => channel * alpha + bg[index]! * (1 - alpha),
        );
        expect(
          contrast(rgb(tokens[`${surface}-foreground`]!), mixed),
          `${surface} hover on ${backdrop}`,
        ).toBeGreaterThanOrEqual(4.5);
      }
      for (const indicator of [
        'input',
        'ring',
        'chart-1',
        'chart-2',
        'chart-3',
      ])
        expect(
          contrast(rgb(tokens[indicator]!), bg),
          `${indicator} on ${backdrop}`,
        ).toBeGreaterThanOrEqual(3);
    }
  });
});
