import { useEffect, useState } from 'react';
import { PrivatePage } from '../features/auth/PrivatePage.js';
import { AccessPage } from '../features/landing/AccessPage.js';
import { PublicLanding } from '../features/landing/PublicLanding.js';
import { SystemPage } from '../features/system/SystemPage.js';

export function App() {
  const [path, setPath] = useState(window.location.pathname);
  useEffect(() => {
    const update = () => setPath(window.location.pathname);
    window.addEventListener('popstate', update);
    return () => window.removeEventListener('popstate', update);
  }, []);
  switch (path) {
    case '/':
      return <PublicLanding />;
    case '/acesso':
      return <AccessPage />;
    case '/status':
      return <SystemPage />;
    case '/app':
      return <PrivatePage key="app" page="app" />;
    case '/conta':
      return <PrivatePage key="conta" page="conta" />;
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
