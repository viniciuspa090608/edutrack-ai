import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import type { AuthUser, ModulePreferences } from '@study-platform/contracts';
import { Button } from '@study-platform/ui/components/ui/button';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@study-platform/ui/components/ui/sheet';
import {
  BookOpen,
  CalendarDays,
  ChartNoAxesCombined,
  ClipboardList,
  GraduationCap,
  House,
  Layers,
  LogOut,
  Moon,
  MoreHorizontal,
  Sun,
  Timer,
  Trophy,
  UserRound,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useTheme, setTheme } from '../../app/theme.js';
import { availableModules, moduleAtPath } from '../profile/module-catalog.js';
import { ShellAvatar, type ConfirmedAvatar } from './ShellAvatar.js';
import '../../styles/authenticated-shell.css';

const desktopQuery = '(min-width: 1024px)';
function subscribeDesktop(listener: () => void) {
  const media = window.matchMedia?.(desktopQuery);
  media?.addEventListener('change', listener);
  return () => media?.removeEventListener('change', listener);
}
function isDesktop() {
  return window.matchMedia?.(desktopQuery).matches ?? true;
}
const moduleIcons = {
  tasks: ClipboardList,
  subjects: BookOpen,
  flashcards: Layers,
};
type Destination = { path: string; label: string; icon: LucideIcon };
const home: Destination = { path: '/app', label: 'Início', icon: House };
const secondary: Destination[] = [
  { path: '/app/pomodoro', label: 'Pomodoro', icon: Timer },
  { path: '/app/rotinas', label: 'Rotinas', icon: CalendarDays },
  {
    path: '/app/estatisticas',
    label: 'Estatísticas',
    icon: ChartNoAxesCombined,
  },
  { path: '/app/progresso', label: 'Progresso', icon: Trophy },
  { path: '/conta', label: 'Conta', icon: UserRound },
];
function activeDestination(item: Destination, pathname: string) {
  return item.path === pathname || moduleAtPath(pathname)?.path === item.path;
}
function DestinationLink({
  item,
  pathname,
  close = false,
}: {
  item: Destination;
  pathname: string;
  close?: boolean;
}) {
  const Icon = item.icon;
  const link = (
    <a
      className="shell-nav-link"
      href={item.path}
      aria-current={activeDestination(item, pathname) ? 'page' : undefined}
    >
      <Icon aria-hidden="true" />
      <span>{item.label}</span>
    </a>
  );
  return close ? <SheetClose asChild>{link}</SheetClose> : link;
}

export function AuthenticatedShell({
  user,
  prefs,
  busy,
  onLogout,
  confirmedAvatar,
  account,
  error,
  children,
}: {
  user: AuthUser;
  prefs: ModulePreferences | null;
  busy: boolean;
  onLogout: () => void;
  confirmedAvatar: ConfirmedAvatar | null;
  account: boolean;
  error: string;
  children: ReactNode;
}) {
  const desktop = useSyncExternalStore(subscribeDesktop, isDesktop, () => true);
  const [moreOpen, setMoreOpen] = useState(false);
  const brand = useRef<HTMLAnchorElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const theme = useTheme();
  const pathname = window.location.pathname;
  const primary = [
    home,
    ...(prefs
      ? availableModules(prefs).map((item) => ({
          ...item,
          icon: moduleIcons[item.capability],
        }))
      : []),
  ];
  const moreActive = secondary.some((item) =>
    activeDestination(item, pathname),
  );
  useEffect(() => {
    if (desktop) setMoreOpen(false);
  }, [desktop]);
  useEffect(() => {
    if (!error) return;
    const frame = requestAnimationFrame(() =>
      body.current
        ?.querySelector('[role="alert"]')
        ?.scrollIntoView({ block: 'center' }),
    );
    return () => cancelAnimationFrame(frame);
  }, [error]);
  const signout = (
    <Button
      type="button"
      variant="ghost"
      className="shell-signout"
      disabled={busy}
      onClick={() => {
        setMoreOpen(false);
        onLogout();
      }}
    >
      <LogOut aria-hidden="true" />
      <span>{busy ? 'Processando…' : 'Sair'}</span>
    </Button>
  );
  return (
    <div
      className={`private-page authenticated-shell${account ? ' account-shell' : ''}`}
    >
      <header className="private-header shell-header">
        <a ref={brand} className="private-brand shell-brand" href="/app">
          <span className="shell-brand-icon">
            <GraduationCap aria-hidden="true" />
          </span>
          EduTrack
        </a>
        <div className="shell-header-actions">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shell-theme"
            aria-label={
              theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'
            }
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? (
              <Sun aria-hidden="true" />
            ) : (
              <Moon aria-hidden="true" />
            )}
          </Button>
          <ShellAvatar user={user} confirmedAvatar={confirmedAvatar} />
        </div>
      </header>
      <div className="shell-layout">
        {desktop && (
          <aside
            className="shell-sidebar"
            aria-label="Navegação da área pessoal"
          >
            <nav aria-label="Área pessoal">
              {[...primary, ...secondary].map((item) => (
                <DestinationLink
                  key={item.path}
                  item={item}
                  pathname={pathname}
                />
              ))}
            </nav>
            <div className="shell-signout-region">{signout}</div>
          </aside>
        )}
        <div ref={body} className="shell-content-region">
          {children}
        </div>
      </div>
      {!desktop && (
        <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
          <nav className="shell-bottom-nav" aria-label="Área pessoal">
            {primary.map((item) => (
              <DestinationLink
                key={item.path}
                item={item}
                pathname={pathname}
              />
            ))}
            <SheetTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                className="shell-more-trigger"
                data-active={moreActive || undefined}
                aria-label={moreActive ? 'Mais, contém a página atual' : 'Mais'}
              >
                <MoreHorizontal aria-hidden="true" />
                <span>Mais</span>
              </Button>
            </SheetTrigger>
          </nav>
          <SheetContent
            side="bottom"
            showCloseButton={false}
            className="shell-more-sheet"
            onCloseAutoFocus={(event) => {
              if (isDesktop()) {
                event.preventDefault();
                brand.current?.focus();
              }
            }}
          >
            <SheetHeader>
              <SheetTitle>Mais</SheetTitle>
              <SheetDescription>
                Outros destinos da sua área pessoal.
              </SheetDescription>
            </SheetHeader>
            <SheetClose asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shell-more-close"
                aria-label="Fechar menu Mais"
              >
                <X aria-hidden="true" />
              </Button>
            </SheetClose>
            <nav
              className="shell-more-destinations"
              aria-label="Outros destinos"
            >
              {secondary.map((item) => (
                <DestinationLink
                  key={item.path}
                  item={item}
                  pathname={pathname}
                  close
                />
              ))}
            </nav>
            <div className="shell-signout-region">{signout}</div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}
