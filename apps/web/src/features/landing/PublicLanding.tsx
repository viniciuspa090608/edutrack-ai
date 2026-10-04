import { Button } from '@study-platform/ui/components/ui/button';
import { Card, CardContent } from '@study-platform/ui/components/ui/card';
import { Badge } from '@study-platform/ui/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from '@study-platform/ui/components/ui/sheet';
import {
  ArrowRight,
  BookOpen,
  Check,
  GraduationCap,
  Layers3,
  Menu,
  Moon,
  Route,
  Sparkles,
  Sun,
  Timer,
  TrendingUp,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  DashboardPreview,
  RoadmapPreview,
  FocusPreview,
  FlashcardPreview,
  AnalyticsPreview,
  AIPreview,
} from './ProductPreview.js';
import { ThemeToggle } from './ThemeToggle.js';
import { useLandingMotion } from './useLandingMotion.js';
import { navigatePublicLink } from './public-navigation.js';

const sections = [
  ['como-funciona', 'Como funciona'],
  ['funcionalidades', 'Funcionalidades'],
  ['ia-opcional', 'IA opcional'],
  ['personalizacao', 'Personalização'],
] as const;
const login = '/acesso?mode=login';
const register = '/acesso?mode=register';

function Brand() {
  return (
    <a className="landing-brand" href="/" aria-label="EduTrack, início">
      <span>
        <GraduationCap aria-hidden="true" />
      </span>
      EduTrack
    </a>
  );
}
function CreateAccount() {
  return (
    <Button asChild>
      <a href={register}>
        Criar conta <ArrowRight aria-hidden="true" />
      </a>
    </Button>
  );
}
function FeatureSection({
  index,
  title,
  icon,
  children,
  points,
  preview,
}: {
  index: string;
  title: string;
  icon: ReactNode;
  children: ReactNode;
  points: string[];
  preview: ReactNode;
}) {
  return (
    <article className="landing-feature" data-reveal>
      <div className="landing-feature-copy">
        <span className="landing-icon">{icon}</span>
        <p className="landing-kicker">Módulo {index}</p>
        <h3>{title}</h3>
        <p>{children}</p>
        <ul className="landing-benefits">
          {points.map((point) => (
            <li key={point}>
              <Check aria-hidden="true" />
              {point}
            </li>
          ))}
        </ul>
      </div>
      {preview}
    </article>
  );
}

export function PublicLanding() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const page = useRef<HTMLDivElement>(null);
  const hero = useRef<HTMLDivElement>(null);
  useLandingMotion(page, hero);
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const desktop = window.matchMedia('(min-width: 1024px)');
    const update = () => {
      if (desktop.matches) setMenuOpen(false);
    };
    desktop.addEventListener('change', update);
    return () => desktop.removeEventListener('change', update);
  }, []);

  return (
    <div
      className="landing-page"
      ref={page}
      id="topo"
      onClick={navigatePublicLink}
    >
      <a className="landing-skip" href="#conteudo">
        Pular para o conteúdo
      </a>
      <Sheet modal={false} open={menuOpen} onOpenChange={setMenuOpen}>
        <header className="landing-header">
          <div className="landing-container landing-header-inner">
            <Brand />
            <nav className="landing-desktop-nav" aria-label="Seções da página">
              {sections.slice(0, 3).map(([id, label]) => (
                <a key={id} href={`#${id}`}>
                  {label}
                </a>
              ))}
            </nav>
            <div className="landing-header-actions">
              <ThemeToggle />
              <div className="landing-desktop-access">
                <a href={login}>Entrar</a>
                <CreateAccount />
              </div>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  ref={menuButton}
                  className="landing-menu-toggle"
                  aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
                  aria-expanded={menuOpen}
                  aria-controls="mobile-navigation"
                >
                  {menuOpen ? (
                    <X aria-hidden="true" />
                  ) : (
                    <Menu aria-hidden="true" />
                  )}
                </Button>
              </SheetTrigger>
            </div>
          </div>
        </header>
        <SheetContent
          side="top"
          className="landing-mobile-sheet"
          showCloseButton={false}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            menuButton.current?.focus();
          }}
        >
          <SheetTitle className="sr-only">Navegação da EduTrack</SheetTitle>
          <SheetDescription className="sr-only">
            Seções da página e acesso à conta
          </SheetDescription>
          <nav id="mobile-navigation" aria-label="Navegação mobile">
            {sections.map(([id, label]) => (
              <a key={id} href={`#${id}`} onClick={() => setMenuOpen(false)}>
                {label}
              </a>
            ))}
            <a href={login}>Entrar</a>
            <Button asChild>
              <a href={register}>
                Criar conta <ArrowRight aria-hidden="true" />
              </a>
            </Button>
          </nav>
        </SheetContent>
      </Sheet>
      <main id="conteudo" tabIndex={-1}>
        <section
          className="landing-container landing-hero"
          aria-labelledby="hero-title"
        >
          <div className="landing-hero-copy">
            <Badge variant="secondary" className="landing-eyebrow">
              <Sparkles aria-hidden="true" /> Um jeito mais claro de estudar
            </Badge>
            <h1 id="hero-title">
              Organize seus estudos.
              <br />
              <em>Encontre seu ritmo.</em>
            </h1>
            <p>
              Reúna tarefas, matérias, sessões de foco e revisões em um só lugar
              para acompanhar sua evolução.
            </p>
            <div className="landing-actions">
              <CreateAccount />
              <Button asChild variant="outline">
                <a href="#funcionalidades">Conhecer os recursos</a>
              </Button>
            </div>
            <div className="landing-hero-notes">
              <span>
                <Check aria-hidden="true" /> Seu plano, no seu ritmo
              </span>
              <span>
                <Check aria-hidden="true" /> IA opcional
              </span>
            </div>
          </div>
          <div className="landing-hero-visual" ref={hero}>
            <DashboardPreview />
          </div>
        </section>
        <section
          id="como-funciona"
          className="landing-band"
          aria-labelledby="steps-title"
        >
          <div className="landing-container">
            <div className="landing-section-intro" data-reveal>
              <p className="landing-kicker">Planeje. Estude. Retome.</p>
              <h2 id="steps-title">Como funciona</h2>
              <p>Três passos para dar direção à sua rotina de estudos.</p>
            </div>
            <div className="landing-steps">
              {[
                {
                  title: 'Organize',
                  icon: <Route aria-hidden="true" />,
                  text: 'Planeje tarefas, matérias e rotinas de acordo com sua disponibilidade. Divida seu plano em passos claros.',
                  note: 'Tarefas, matérias e roadmaps',
                },
                {
                  title: 'Estude',
                  icon: <Timer aria-hidden="true" />,
                  text: 'Siga seu plano e reserve um bloco de foco com o Pomodoro. Pause e retome quando precisar.',
                  note: 'Blocos de foco de 25 minutos',
                },
                {
                  title: 'Revise',
                  icon: <Layers3 aria-hidden="true" />,
                  text: 'Pratique com flashcards e use a fila de revisão espaçada para retomar os conceitos estudados.',
                  note: 'Revisões com autoavaliação',
                },
              ].map((step, index) => (
                <Card key={step.title} className="landing-step" data-reveal>
                  <CardContent>
                    <div className="landing-step-top">
                      <span>0{index + 1}</span>
                      <span className="landing-icon">{step.icon}</span>
                    </div>
                    <h3>{step.title}</h3>
                    <p>{step.text}</p>
                    <small>
                      <Check aria-hidden="true" />
                      {step.note}
                    </small>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
        <section
          id="funcionalidades"
          className="landing-container landing-features"
          aria-labelledby="features-title"
        >
          <div className="landing-section-intro" data-reveal>
            <p className="landing-kicker">Tudo em um só lugar</p>
            <h2 id="features-title">
              Um espaço para cada parte
              <br /> da sua jornada de estudo.
            </h2>
            <p>Do primeiro plano à próxima revisão, encontre o que precisa.</p>
          </div>
          <FeatureSection
            index="01"
            icon={<BookOpen aria-hidden="true" />}
            title="Planejamento e roadmaps por etapas"
            points={[
              'Tarefas com prazos, subtarefas e progresso',
              'Matérias com planos e roadmaps editáveis',
              'Rotinas de estudo recorrentes',
            ]}
            preview={<RoadmapPreview />}
          >
            Organize o próximo passo sem perder a visão do todo. Reúna suas
            matérias, divida conteúdos em etapas e acompanhe o que já concluiu.
          </FeatureSection>
          <FeatureSection
            index="02"
            icon={<Timer aria-hidden="true" />}
            title="Sessões de foco com Pomodoro"
            points={[
              'Blocos de 25 minutos de foco',
              'Pause e retome a sessão',
              'Histórico do tempo de estudo',
            ]}
            preview={<FocusPreview />}
          >
            Reserve um tempo para se concentrar. O Pomodoro acompanha seus
            blocos de estudo, com controle para pausar, retomar e concluir cada
            sessão.
          </FeatureSection>
          <FeatureSection
            index="03"
            icon={<Layers3 aria-hidden="true" />}
            title="Flashcards com revisão espaçada"
            points={[
              'Crie seus baralhos manualmente',
              'Importe cartões por arquivos CSV ou TSV',
              'Avalie sua resposta e acompanhe as revisões',
            ]}
            preview={<FlashcardPreview />}
          >
            Transforme conceitos em perguntas e respostas. A fila de revisão
            organiza o que retomar a partir da sua autoavaliação.
          </FeatureSection>
          <FeatureSection
            index="04"
            icon={<TrendingUp aria-hidden="true" />}
            title="Métricas claras e sequências de estudo"
            points={[
              'Tempo de estudo e dias ativos',
              'Sequências com base nas atividades realizadas',
              'Conquistas com critérios definidos',
            ]}
            preview={<AnalyticsPreview />}
          >
            Veja como sua dedicação se distribui ao longo dos dias. Acompanhe
            estatísticas, sequências e conquistas para conhecer melhor sua
            rotina.
          </FeatureSection>
        </section>
        <section
          id="ia-opcional"
          className="landing-band"
          aria-labelledby="ai-title"
        >
          <div className="landing-container">
            <div className="landing-ai-panel" data-reveal>
              <div>
                <Badge variant="secondary">
                  <Sparkles aria-hidden="true" /> Recurso auxiliar opcional
                </Badge>
                <h2 id="ai-title">Um apoio extra quando você precisar.</h2>
                <p>
                  Use a IA para rascunhar roadmaps ou sugerir flashcards a
                  partir dos seus textos. Revise, edite ou descarte as sugestões
                  antes de confirmar.
                </p>
                <div className="landing-ai-notes">
                  <div>
                    <h3>Controle manual</h3>
                    <p>
                      Seu plano e seus cartões continuam nas suas mãos. Os
                      fluxos manuais funcionam sem IA.
                    </p>
                  </div>
                  <div>
                    <h3>Sem promessas mágicas</h3>
                    <p>
                      Você pode desativar a IA. A geração depende da
                      disponibilidade e configuração do serviço.
                    </p>
                  </div>
                </div>
              </div>
              <AIPreview />
            </div>
          </div>
        </section>
        <section
          id="personalizacao"
          className="landing-container landing-personalization"
          aria-labelledby="personalization-title"
        >
          <div className="landing-section-intro" data-reveal>
            <p className="landing-kicker">Adaptado a você</p>
            <h2 id="personalization-title">
              Seu espaço, seu jeito de estudar.
            </h2>
            <p>
              Escolha a aparência e mantenha à vista os módulos que fazem
              sentido para você.
            </p>
          </div>
          <div className="landing-theme-examples" data-reveal>
            <div>
              <span className="landing-icon">
                <Sun aria-hidden="true" />
              </span>
              <h3>Tema claro</h3>
              <p>Superfícies leves e destaques azuis para sua rotina.</p>
              <div className="landing-theme-lines" aria-hidden="true">
                <i />
                <i />
                <i />
              </div>
            </div>
            <div>
              <span className="landing-icon">
                <Moon aria-hidden="true" />
              </span>
              <h3>Tema escuro</h3>
              <p>
                Superfícies profundas, com o mesmo cuidado com a legibilidade.
              </p>
              <div className="landing-theme-lines" aria-hidden="true">
                <i />
                <i />
                <i />
              </div>
            </div>
          </div>
          <p className="landing-example-caption">
            Exemplo ilustrativo — a aparência acompanha o tema escolhido no
            header.
          </p>
          <Card className="landing-modules" data-reveal>
            <CardContent>
              <div>
                <h3>Módulos configuráveis</h3>
                <p>
                  Ative tarefas, matérias e flashcards conforme sua rotina.
                  Mantenha ao menos um módulo de estudo ativo; a IA é opcional.
                </p>
              </div>
              <div className="landing-module-chips">
                {['Tarefas', 'Matérias', 'Flashcards', 'IA opcional'].map(
                  (label) => (
                    <Badge key={label} variant="secondary">
                      {label}
                    </Badge>
                  ),
                )}
              </div>
              <p>O fuso de estudo organiza seus dias ativos e estatísticas.</p>
            </CardContent>
          </Card>
        </section>
        <section
          className="landing-closing landing-band"
          aria-labelledby="closing-title"
        >
          <div className="landing-container" data-reveal>
            <span className="landing-icon">
              <GraduationCap aria-hidden="true" />
            </span>
            <h2 id="closing-title">
              Seu próximo passo de estudo
              <br /> começa aqui.
            </h2>
            <p>
              Encontre um lugar para organizar seus planos, manter o foco e
              revisar no seu ritmo.
            </p>
            <div className="landing-actions">
              <CreateAccount />
              <Button asChild variant="outline">
                <a href={login}>Já tenho uma conta</a>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <footer className="landing-footer">
        <div className="landing-container landing-footer-inner">
          <div>
            <Brand />
            <p>Um caminho para aprender no seu ritmo.</p>
          </div>
          <nav aria-label="Navegação do rodapé">
            <div>
              <strong>Conheça</strong>
              {sections.map(([id, label]) => (
                <a key={id} href={`#${id}`}>
                  {label}
                </a>
              ))}
            </div>
            <div>
              <strong>Comece</strong>
              <a href={login}>Entrar</a>
              <a href={register}>Criar conta</a>
              <a href="#topo">Voltar ao topo ↑</a>
            </div>
          </nav>
        </div>
      </footer>
    </div>
  );
}
