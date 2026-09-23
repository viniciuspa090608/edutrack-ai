import { ArrowLeft, Sparkles } from 'lucide-react';

export function AccessPage() {
  return (
    <main className="access-page">
      <div className="access-card">
        <span className="access-mark" aria-hidden="true">
          <Sparkles size={28} />
        </span>
        <p className="section-kicker">EduTrack</p>
        <h1>Em breve</h1>
        <p>
          O login e o cadastro ainda não estão disponíveis. Estamos preparando a
          plataforma para ajudar você a organizar sua jornada de estudos.
        </p>
        <a className="button button-primary" href="/">
          <ArrowLeft size={18} aria-hidden="true" /> Voltar à landing
        </a>
      </div>
    </main>
  );
}
