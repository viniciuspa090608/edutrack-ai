import { useEffect, useState } from 'react';
import {
  Globe,
  LogOut,
  ShieldCheck,
  SlidersHorizontal,
  Sun,
  UserRound,
} from 'lucide-react';

export const accountSections = [
  { id: 'account-profile', label: 'Perfil', icon: UserRound },
  { id: 'account-preferences', label: 'Preferências', icon: SlidersHorizontal },
  { id: 'account-appearance', label: 'Aparência', icon: Sun },
  { id: 'account-security', label: 'Segurança', icon: ShieldCheck },
  {
    id: 'account-ai',
    label: 'Inteligência artificial',
    icon: SlidersHorizontal,
  },
  { id: 'account-integrations', label: 'Integrações', icon: Globe },
  { id: 'account-access', label: 'Conta', icon: LogOut },
];

export function useAccountSections(ready: boolean) {
  const [active, setActive] = useState(
    window.location.hash.slice(1) || 'account-profile',
  );
  useEffect(() => {
    if (!ready) return;
    const sections = accountSections.flatMap(({ id }) => {
      const element = document.getElementById(id);
      return element ? [element] : [];
    });
    let frame = 0;
    const update = () => {
      frame = 0;
      const header = document.querySelector('.shell-header');
      const line =
        Math.max(24, header?.getBoundingClientRect().bottom ?? 0) + 16;
      const visible = sections.filter(
        (section) => section.getBoundingClientRect().bottom > line,
      );
      const passed = sections.filter(
        (section) => section.getBoundingClientRect().top <= line,
      );
      const atEnd =
        window.scrollY + window.innerHeight >=
        document.documentElement.scrollHeight - 2;
      const current = atEnd ? visible.at(-1) : (passed.at(-1) ?? visible[0]);
      if (current) setActive(current.id);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const jump = () => {
      const target = document.getElementById(window.location.hash.slice(1));
      if (target && sections.includes(target)) {
        setActive(target.id);
        target.scrollIntoView();
        target.focus({ preventScroll: true });
      }
      schedule();
    };
    const intersection =
      typeof IntersectionObserver === 'function'
        ? new IntersectionObserver(schedule)
        : null;
    const resize =
      typeof ResizeObserver === 'function'
        ? new ResizeObserver(schedule)
        : null;
    sections.forEach((section) => {
      intersection?.observe(section);
      resize?.observe(section);
    });
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    window.addEventListener('hashchange', jump);
    if (window.location.hash) jump();
    else schedule();
    return () => {
      cancelAnimationFrame(frame);
      intersection?.disconnect();
      resize?.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('hashchange', jump);
    };
  }, [ready]);
  return active;
}
