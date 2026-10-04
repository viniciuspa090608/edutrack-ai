import type { ReactNode } from 'react';
import { Card, CardContent } from '@study-platform/ui/components/ui/card';
import { Progress } from '@study-platform/ui/components/ui/progress';
import { BookOpen, Check, Flame, Layers3, Medal, Timer } from 'lucide-react';

export function ProductPreview({
  title,
  children,
  className = '',
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <figure className={`landing-preview ${className}`} aria-label={title}>
      <Card className="landing-preview-card">
        <CardContent>{children}</CardContent>
      </Card>
      <figcaption>Exemplo ilustrativo — dados demonstrativos</figcaption>
    </figure>
  );
}

function Panel({
  title,
  children,
  className = '',
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`preview-panel ${className}`}>
      <p className="preview-label">{title}</p>
      {children}
    </div>
  );
}

export function DashboardPreview() {
  return (
    <ProductPreview
      title="Exemplo de dashboard de estudos"
      className="dashboard-preview"
    >
      <div className="preview-heading">
        <span>
          <BookOpen aria-hidden="true" /> Meu painel de estudos
        </span>
        <span className="preview-chip">Hoje</span>
      </div>
      <div className="preview-dashboard-grid">
        <Panel title="Tarefas do dia" className="preview-tasks">
          <ul className="preview-list">
            <li>
              <span className="preview-check">
                <Check aria-hidden="true" />
              </span>
              <span>
                Resolver lista de Cálculo II<small>Concluída</small>
              </span>
            </li>
            <li>
              <span className="preview-check">
                <Check aria-hidden="true" />
              </span>
              <span>
                Leitura de Sistemas Operacionais
                <small>Capítulo 4 · Concluída</small>
              </span>
            </li>
            <li>
              <span className="preview-empty" />
              <span>
                Revisar Álgebra Relacional<small>Próximo passo</small>
              </span>
            </li>
          </ul>
        </Panel>
        <Panel title="Bloco de foco" className="preview-focus">
          <Timer aria-hidden="true" />
          <strong>21:45</strong>
          <span>de um bloco de 25 minutos</span>
          <span className="preview-faux-control">Em foco · Cálculo II</span>
        </Panel>
        <Panel title="Estruturas de Dados" className="preview-subject">
          <div className="preview-between">
            <span>Progresso do plano</span>
            <strong>75%</strong>
          </div>
          <Progress
            value={75}
            aria-label="Progresso ilustrativo do plano: 75%"
          />
          <small>3 de 4 itens concluídos</small>
        </Panel>
        <Panel title="Fila de revisão" className="preview-review">
          <Layers3 aria-hidden="true" />
          <strong>14 cartões</strong>
          <small>Exemplo de revisões para hoje</small>
        </Panel>
      </div>
    </ProductPreview>
  );
}

export function RoadmapPreview() {
  return (
    <ProductPreview title="Exemplo de roadmap de uma matéria">
      <div className="preview-heading">
        <span>Arquitetura de Computadores</span>
        <span className="preview-chip">Roadmap</span>
      </div>
      <div className="preview-roadmap">
        <div>
          <span className="preview-step done">
            <Check aria-hidden="true" />
          </span>
          <span>
            <strong>Circuitos lógicos e álgebra booleana</strong>
            <small>Bloco concluído</small>
          </span>
        </div>
        <div className="preview-roadmap-active">
          <span className="preview-step">2</span>
          <div>
            <strong>Conjunto de instruções</strong>
            <small>Em andamento · 1 de 3 passos</small>
            <ul>
              <li>Formatos de instrução</li>
              <li>Pipeline e perigos de dados</li>
              <li>Memória cache</li>
            </ul>
          </div>
        </div>
        <div>
          <span className="preview-step">3</span>
          <span>
            <strong>Hierarquia de memória</strong>
            <small>Próximo bloco do seu plano</small>
          </span>
        </div>
      </div>
    </ProductPreview>
  );
}

export function FocusPreview() {
  return (
    <ProductPreview title="Exemplo de sessão Pomodoro e histórico">
      <div className="preview-pomodoro">
        <div className="preview-clock">
          <Timer aria-hidden="true" />
          <strong>25:00</strong>
          <span>Bloco de foco</span>
        </div>
        <div>
          <p className="preview-label">Histórico de estudo</p>
          <ul className="preview-list">
            <li>
              <Check aria-hidden="true" />
              <span>
                Cálculo Diferencial<small>Bloco concluído · 25 min</small>
              </span>
            </li>
            <li>
              <Check aria-hidden="true" />
              <span>
                Algoritmos de Ordenação<small>Bloco concluído · 25 min</small>
              </span>
            </li>
            <li>
              <Timer aria-hidden="true" />
              <span>
                Redes de Computadores
                <small>Sessão pausada · pode retomar</small>
              </span>
            </li>
          </ul>
        </div>
      </div>
    </ProductPreview>
  );
}

export function FlashcardPreview() {
  return (
    <ProductPreview title="Exemplo de flashcard para revisão">
      <div className="preview-heading">
        <span>Deck: Biologia celular</span>
        <span className="preview-chip">Cartão 7 de 22</span>
      </div>
      <div className="preview-flashcard">
        <p className="preview-label">Pergunta</p>
        <p>Qual é o papel da bomba de sódio-potássio na célula?</p>
        <div className="preview-answer">
          Transportar íons e contribuir para o equilíbrio eletroquímico da
          membrana.
        </div>
      </div>
      <p className="preview-label">Autoavaliação após revelar a resposta</p>
      <div className="preview-ratings">
        {['De novo', 'Difícil', 'Bom', 'Fácil'].map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
    </ProductPreview>
  );
}

const week = [
  { day: 'Seg', minutes: 50 },
  { day: 'Ter', minutes: 25 },
  { day: 'Qua', minutes: 75 },
  { day: 'Qui', minutes: 50 },
  { day: 'Sex', minutes: 100 },
  { day: 'Sáb', minutes: 75 },
  { day: 'Dom', minutes: 25 },
];

export function AnalyticsPreview() {
  return (
    <ProductPreview title="Exemplo de estatísticas, sequência e conquista">
      <div className="preview-metrics">
        <div>
          <span className="preview-label">Tempo na semana</span>
          <strong>6h 40min</strong>
        </div>
        <div>
          <Flame aria-hidden="true" />
          <strong>7 dias</strong>
          <small>Sequência de estudo</small>
        </div>
      </div>
      <div
        className="preview-chart"
        role="img"
        aria-label="Exemplo de tempo estudado: segunda 50, terça 25, quarta 75, quinta 50, sexta 100, sábado 75 e domingo 25 minutos. Total 6 horas e 40 minutos."
      >
        {week.map((item) => (
          <div key={item.day}>
            <span style={{ height: `${item.minutes}%` }} />
            <small>{item.day}</small>
          </div>
        ))}
      </div>
      <div className="preview-achievement">
        <Medal aria-hidden="true" />
        <span>
          <strong>Foco consistente</strong>
          <small>Conquista por concluir 5 blocos Pomodoro</small>
        </span>
      </div>
    </ProductPreview>
  );
}

export function AIPreview() {
  return (
    <ProductPreview title="Exemplo de rascunho gerado com apoio de IA">
      <div className="preview-heading">
        <span>Sugestão de roadmap</span>
        <span className="preview-chip">Rascunho editável</span>
      </div>
      <p className="preview-label">Tema do exemplo</p>
      <strong>Introdução a redes neurais</strong>
      <ol className="preview-ai-steps">
        <li>Derivadas parciais e regra da cadeia</li>
        <li>Funções de ativação</li>
        <li>Gradiente descendente</li>
      </ol>
      <p className="preview-ai-note">
        Revise, edite ou descarte antes de confirmar.
      </p>
    </ProductPreview>
  );
}
