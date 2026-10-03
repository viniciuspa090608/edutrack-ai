export function apiUrl(path: string): string {
  const base =
    import.meta.env.DEV && !import.meta.env.VITEST
      ? '/api'
      : (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001');
  return `${base}${path}`;
}
