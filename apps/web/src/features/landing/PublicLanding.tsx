import { Progress } from '@study-platform/ui/components/ui/progress';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from '@study-platform/ui/components/ui/sheet';
import { Badge } from '@study-platform/ui/components/ui/badge';
import { Button } from '@study-platform/ui/components/ui/button';
import { Card, CardContent } from '@study-platform/ui/components/ui/card';
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  BrainCircuit,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Layers3,
  Menu,
  Sparkles,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { FeatureCarousel } from './FeatureCarousel.js';

const features = [
  {
    icon: CheckCircle2,
    title: 'Tarefas',
    description: 'Planeje entregas e mantenha o próximo passo à vista.',
  },
  {
    icon: BookOpen,
    title: 'Matérias e roadmaps',
    description: 'Reúna assuntos em uma trilha clara de estudos.',
  },
  {
    icon: Clock3,
    title: 'Pomodoro',
    description: 'Divida o tempo entre foco e pausas conscientes.',
  },
  {
    icon: CalendarDays,
    title: 'Rotinas',
    description: 'Dê consistência aos estudos sem perder flexibilidade.',
  },
  {
    icon: Layers3,
    title: 'Flashcards',
    description: 'Retome conceitos importantes sempre que precisar.',
  },
  {
    icon: BarChart3,
    title: 'Estatísticas',
    description: 'Entenda seu progresso e ajuste o plano com clareza.',
  },
  {
    icon: BrainCircuit,
    title: 'IA opcional',
    description:
      'Receba apoio quando fizer sentido, mantendo você no controle.',
  },
];

export function PublicLanding() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        menuButton.current?.focus();
      }
    };
    const desktop = window.matchMedia('(min-width: 760px)');
    const onBreakpoint = () => {
      if (desktop.matches) setMenuOpen(false);
    };
    document.addEventListener('keydown', onEscape);
    desktop.addEventListener('change', onBreakpoint);
    return () => {
      document.removeEventListener('keydown', onEscape);
      desktop.removeEventListener('change', onBreakpoint);
    };
  }, [menuOpen]);

  return (
    <div className="landing-page">
      <Sheet modal={false} open={menuOpen} onOpenChange={setMenuOpen}>
        <header className="landing-header">
          <div className="header-inner">
            <a className="header-brand" href="/" aria-label="EduTrack, início">
              <span className="brand-symbol" aria-hidden="true">
                <Sparkles size={20} />
              </span>{' '}
              EduTrack
            </a>
            <nav className="desktop-nav" aria-label="Seções da página">
              <a href="#funcionalidades">Funcionalidades</a>
              <a href="#tecnologias">Tecnologias</a>
            </nav>
            <div className="header-actions">
              <Button asChild>
                <a className="header-cta" href="/acesso">
                  Login / Inscreva-se{' '}
                  <ArrowRight size={16} aria-hidden="true" />
                </a>
              </Button>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  ref={menuButton}
                  type="button"
                  className="menu-toggle"
                  aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
                  aria-expanded={menuOpen}
                  aria-controls="mobile-navigation"
                >
                  {menuOpen ? (
                    <X size={22} aria-hidden="true" />
                  ) : (
                    <Menu size={22} aria-hidden="true" />
                  )}
                </Button>
              </SheetTrigger>
            </div>
          </div>
          <SheetContent
            side="top"
            className="top-[70px]"
            showCloseButton={false}
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              menuButton.current?.focus();
            }}
          >
            <SheetTitle className="sr-only">Navegação</SheetTitle>
            <SheetDescription className="sr-only">
              Seções da página inicial
            </SheetDescription>
            <nav
              id="mobile-navigation"
              className="mobile-nav"
              aria-label="Seções da página"
            >
              <a href="#funcionalidades" onClick={() => setMenuOpen(false)}>
                Funcionalidades
              </a>
              <a href="#tecnologias" onClick={() => setMenuOpen(false)}>
                Tecnologias
              </a>
            </nav>
          </SheetContent>
        </header>
      </Sheet>

      <main>
        <section className="hero section-wrap" aria-labelledby="hero-title">
          <div className="hero-copy">
            <Badge className="eyebrow-pill" variant="secondary">
              <span aria-hidden="true">✦</span> UM JEITO MAIS CLARO DE ESTUDAR
            </Badge>
            <h1 id="hero-title">
              Seu plano de estudos, <em>em movimento.</em>
            </h1>
            <p>
              Imagine tarefas, matérias, foco e revisão em um só lugar. A
              EduTrack está sendo criada para ajudar você a encontrar ritmo e
              acompanhar cada conquista.
            </p>
            <div className="hero-actions">
              <Button asChild>
                <a href="/acesso">
                  Login / Inscreva-se{' '}
                  <ArrowRight size={19} aria-hidden="true" />
                </a>
              </Button>
              <a className="text-link" href="#funcionalidades">
                Conheça a proposta <ArrowRight size={17} aria-hidden="true" />
              </a>
            </div>
            <span className="availability-note">
              Uma plataforma em construção, feita para o seu futuro.
            </span>
          </div>
          <div className="hero-visual" aria-hidden="true">
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <Card asChild>
              <div className="hero-card">
                <CardContent>
                  <div className="hero-card-top">
                    <span>Minha jornada</span>
                    <span>✦</span>
                  </div>
                  <div className="hero-card-title">Um dia de cada vez.</div>
                  <Progress value={66} className="hero-progress" />
                  <div className="hero-card-row">
                    <CheckCircle2 size={20} />
                    <span>Organizar prioridades</span>
                  </div>
                  <div className="hero-card-row">
                    <Clock3 size={20} />
                    <span>Reservar tempo de foco</span>
                  </div>
                  <div className="hero-card-row">
                    <Layers3 size={20} />
                    <span>Revisar o que importa</span>
                  </div>
                </CardContent>
              </div>
            </Card>
            <div className="floating-tag">
              Seu progresso tem caminho <Sparkles size={15} />
            </div>
          </div>
        </section>

        <section className="showcase-section" aria-labelledby="showcase-title">
          <div className="section-wrap">
            <div className="section-intro">
              <p className="section-kicker">UMA NOVA FORMA DE SE ORGANIZAR</p>
              <h2 id="showcase-title">Cada passo ganha mais sentido.</h2>
              <p>
                Uma visão do que estamos preparando para acompanhar sua rotina
                de estudos.
              </p>
            </div>
            <FeatureCarousel />
          </div>
        </section>

        <section
          id="funcionalidades"
          className="features-section section-wrap"
          aria-labelledby="features-title"
        >
          <div className="section-intro">
            <p className="section-kicker">FUNCIONALIDADES PLANEJADAS</p>
            <h2 id="features-title">Tudo para estudar com intenção.</h2>
            <p>
              Recursos em desenvolvimento para planejar, manter o foco e
              perceber sua evolução.
            </p>
          </div>
          <div className="features-grid">
            {features.map(({ icon: Icon, title, description }) => (
              <Card key={title} asChild>
                <article className="feature-card">
                  <CardContent>
                    <span className="feature-icon">
                      <Icon size={22} aria-hidden="true" />
                    </span>
                    <h3>{title}</h3>
                    <p>{description}</p>
                  </CardContent>
                </article>
              </Card>
            ))}
          </div>
        </section>

        <section
          id="tecnologias"
          className="tech-section"
          aria-labelledby="tech-title"
        >
          <div className="section-wrap tech-layout">
            <div>
              <p className="section-kicker">TECNOLOGIAS</p>
              <h2 id="tech-title">Uma base feita para evoluir.</h2>
              <p>
                A EduTrack nasce com ferramentas modernas para crescer junto com
                as ideias da comunidade. Os recursos de estudo ainda estão em
                desenvolvimento.
              </p>
            </div>
            <div className="tech-list" aria-label="Tecnologias utilizadas">
              <Badge variant="secondary">React</Badge>
              <Badge variant="secondary">TypeScript</Badge>
              <Badge variant="secondary">Vite</Badge>
              <Badge variant="secondary">Express</Badge>
              <Badge variant="secondary">MySQL</Badge>
            </div>
          </div>
        </section>

        <section
          className="closing-section section-wrap"
          aria-labelledby="closing-title"
        >
          <span className="closing-spark" aria-hidden="true">
            <Sparkles size={27} />
          </span>
          <p className="section-kicker">A PRÓXIMA ETAPA COMEÇA AQUI</p>
          <h2 id="closing-title">Pronto para estudar com mais clareza?</h2>
          <p>
            Estamos preparando a EduTrack. Conheça o espaço de acesso e volte
            para acompanhar as novidades.
          </p>
          <Button asChild variant="secondary">
            <a href="/acesso">
              Quero me inscrever <ArrowRight size={18} aria-hidden="true" />
            </a>
          </Button>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="section-wrap footer-inner">
          <span className="footer-brand">
            <Sparkles size={18} aria-hidden="true" /> EduTrack
          </span>
          <span>Um caminho para aprender no seu ritmo.</span>
          <a href="#hero-title">Voltar ao topo ↑</a>
        </div>
      </footer>
    </div>
  );
}
