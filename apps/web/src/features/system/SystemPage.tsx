import { Badge } from '@study-platform/ui/components/ui/badge';
import { ApiStatus } from './ApiStatus.js';

export function SystemPage() {
  return (
    <div className="app-shell system-page">
      <header className="site-header">
        <span className="brand">Study Platform</span>
        <Badge variant="secondary" className="technical-badge">
          Fundação técnica
        </Badge>
      </header>

      <main id="main-content" className="content">
        <div className="eyebrow">Ambiente de desenvolvimento</div>
        <h1 className="animate__animated animate__fadeInUp">
          A base para estudar com clareza.
        </h1>
        <p className="lead">
          O monorepo, a interface React e a API estão sendo preparados para
          receber os módulos de estudo.
        </p>
        <ApiStatus />
      </main>

      <footer className="site-footer">Versão técnica inicial</footer>
    </div>
  );
}
