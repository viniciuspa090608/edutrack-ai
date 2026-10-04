import type { ReactNode } from 'react';
import {
  BookOpen,
  Check,
  Layers,
  ListChecks,
  Mail,
  ShieldCheck,
  Timer,
} from 'lucide-react';
import { Card, CardContent } from '@study-platform/ui/components/ui/card';

export function AuthLayout({
  children,
  recovery = false,
}: {
  children: ReactNode;
  recovery?: boolean;
}) {
  return (
    <main className={`auth-layout${recovery ? ' auth-layout-recovery' : ''}`}>
      <aside className="auth-story" aria-label="Sobre o EduTrack">
        <div className="auth-brand">
          <span aria-hidden="true">
            <BookOpen />
          </span>
          <div>
            EduTrack<small>Seu espaço de estudos</small>
          </div>
        </div>
        <div className="auth-story-content">
          {recovery ? (
            <>
              <div className="auth-illustration" aria-hidden="true">
                <Mail size={56} />
                <span>
                  <ShieldCheck size={24} />
                </span>
              </div>
              <h2>
                Um passo de cada vez.
                <br />
                De volta aos seus estudos.
              </h2>
              <p>
                Siga as instruções para confirmar seu e-mail ou recuperar o
                acesso à sua conta.
              </p>
              <div className="auth-story-note">
                <Mail aria-hidden="true" />
                <p>Confira também sua caixa de spam ao aguardar um código.</p>
              </div>
            </>
          ) : (
            <>
              <span className="auth-story-kicker">
                Organize. Foque. Aprenda.
              </span>
              <h2>
                Seu semestre,
                <br />
                com mais clareza.
              </h2>
              <p>
                Reúna tarefas, matérias e momentos de foco em um espaço feito
                para sua rotina.
              </p>
              <div className="auth-feature">
                <ListChecks aria-hidden="true" />
                <div>
                  <strong>Planeje seus próximos passos</strong>
                  <p>Organize tarefas e acompanhe seu progresso.</p>
                </div>
              </div>
              <div className="auth-feature">
                <Timer aria-hidden="true" />
                <div>
                  <strong>Encontre seu ritmo</strong>
                  <p>Reserve tempo para estudar com o Pomodoro.</p>
                </div>
              </div>
              <div className="auth-feature">
                <Layers aria-hidden="true" />
                <div>
                  <strong>Revise o que aprendeu</strong>
                  <p>Estude com matérias e flashcards.</p>
                </div>
              </div>
            </>
          )}
        </div>
        <p className="auth-story-footer">
          <Check size={16} aria-hidden="true" /> Um lugar para construir sua
          rotina.
        </p>
      </aside>
      <section className="auth-form-region" aria-label="Acesso ao EduTrack">
        <div className="auth-mobile-brand" aria-hidden="true">
          <BookOpen size={22} /> EduTrack
        </div>
        <Card className="auth-surface">
          <CardContent className="auth-form-content">{children}</CardContent>
        </Card>
      </section>
    </main>
  );
}
