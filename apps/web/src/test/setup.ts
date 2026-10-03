// jsdom does not implement the browser pointer and scrolling APIs used by Radix.
// Keep the components real; browser interaction tests verify the native behavior.
for (const [name, value] of Object.entries({
  hasPointerCapture: (): boolean => false,
  setPointerCapture: (): void => undefined,
  releasePointerCapture: (): void => undefined,
  scrollIntoView: (): void => undefined,
})) {
  if (!(name in HTMLElement.prototype)) {
    Object.defineProperty(HTMLElement.prototype, name, {
      configurable: true,
      value,
    });
  }
}
