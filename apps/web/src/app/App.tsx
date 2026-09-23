import { AccessPage } from '../features/landing/AccessPage.js';
import { PublicLanding } from '../features/landing/PublicLanding.js';
import { SystemPage } from '../features/system/SystemPage.js';

export function App() {
  switch (window.location.pathname) {
    case '/':
      return <PublicLanding />;
    case '/acesso':
      return <AccessPage />;
    case '/status':
      return <SystemPage />;
    default:
      return (
        <main className="route-fallback">
          <h1>Página não encontrada</h1>
          <p>Este caminho ainda não existe na EduTrack.</p>
          <a href="/">Voltar à página inicial</a>
        </main>
      );
  }
}
