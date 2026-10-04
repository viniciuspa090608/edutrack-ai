import { Button } from '@study-platform/ui/components/ui/button';
import { Moon, Sun } from 'lucide-react';
import { setTheme, useTheme } from '../../app/theme.js';

export function ThemeToggle() {
  const dark = useTheme() === 'dark';
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="landing-theme-toggle"
      aria-pressed={dark}
      aria-label={`Tema ${dark ? 'escuro' : 'claro'} ativo. Usar tema ${dark ? 'claro' : 'escuro'}`}
      onClick={() => setTheme(dark ? 'light' : 'dark')}
    >
      {dark ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
    </Button>
  );
}
