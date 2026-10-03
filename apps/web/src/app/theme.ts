/** Follow the OS without remounting React or persisting an account preference. */
export function initializeTheme(): () => void {
  const root = document.documentElement;
  if (typeof window.matchMedia !== 'function') {
    root.classList.remove('dark');
    return () => undefined;
  }

  const preference = window.matchMedia('(prefers-color-scheme: dark)');
  const update = () => root.classList.toggle('dark', preference.matches);
  update();
  preference.addEventListener('change', update);
  return () => preference.removeEventListener('change', update);
}
