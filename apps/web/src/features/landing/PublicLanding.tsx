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
            <a className="header-cta" href="/acesso">
              Login / Inscreva-se <ArrowRight size={16} aria-hidden="true" />
            </a>
            <button
              ref={menuButton}
              type="button"
              className="menu-toggle"
              aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
              aria-expanded={menuOpen}
              aria-controls="mobile-navigation"
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? (
                <X size={22} aria-hidden="true" />
              ) : (
                <Menu size={22} aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
        {menuOpen && (
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
        )}
      </header>

      <main>
        <section className="hero section-wrap" aria-labelledby="hero-title">
          <div className="hero-copy">
            <span className="eyebrow-pill">
              <span aria-hidden="true">✦</span> UM JEITO MAIS CLARO DE ESTUDAR
            </span>
            <h1 id="hero-title">
              Seu plano de estudos, <em>em movimento.</em>
            </h1>
            <p>
              Imagine tarefas, matérias, foco e revisão em um só lugar. A
              EduTrack está sendo criada para ajudar você a encontrar ritmo e
              acompanhar cada conquista.
            </p>
            <div className="hero-actions">
              <a className="button button-primary" href="/acesso">
                Login / Inscreva-se <ArrowRight size={19} aria-hidden="true" />
              </a>
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
            <div className="hero-card">
              <div className="hero-card-top">
                <span>Minha jornada</span>
                <span>✦</span>
              </div>
              <div className="hero-card-title">Um dia de cada vez.</div>
              <div className="hero-progress">
                <span />
              </div>
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
            </div>
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
              <article className="feature-card" key={title}>
                <span className="feature-icon">
                  <Icon size={22} aria-hidden="true" />
                </span>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
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
              <span>React</span>
              <span>TypeScript</span>
              <span>Vite</span>
              <span>Express</span>
              <span>MySQL</span>
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
          <a className="button button-light" href="/acesso">
            Quero me inscrever <ArrowRight size={18} aria-hidden="true" />
          </a>
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
