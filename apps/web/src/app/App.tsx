import { useEffect, useState } from 'react';
import { PrivatePage } from '../features/auth/PrivatePage.js';
import { EmailVerificationPage } from '../features/auth/EmailVerificationPage.js';
import { PasswordRecoveryPage } from '../features/auth/PasswordRecoveryPage.js';
import { AccessPage } from '../features/landing/AccessPage.js';
import { PublicLanding } from '../features/landing/PublicLanding.js';
import { SystemPage } from '../features/system/SystemPage.js';
import { moduleAtPath } from '../features/profile/module-catalog.js';

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
    case '/confirmar-email':
      return <EmailVerificationPage />;
    case '/recuperar-senha':
      return <PasswordRecoveryPage />;
    case '/status':
      return <SystemPage />;
    case '/app':
      return <PrivatePage key="app" page="app" />;
    case '/app/pomodoro':
      return <PrivatePage key="pomodoro" page="pomodoro" />;
    case '/app/rotinas':
      return <PrivatePage key="rotinas" page="rotinas" />;
    case '/app/estatisticas':
      return <PrivatePage key="estatisticas" page="estatisticas" />;
    case '/conta':
      return <PrivatePage key="conta" page="conta" />;
    default:
      if (moduleAtPath(path)) return <PrivatePage key={path} page="module" />;
      return (
        <main className="route-fallback">
          <h1>Página não encontrada</h1>
          <p>Este caminho ainda não existe na EduTrack.</p>
          <a href="/">Voltar à página inicial</a>
        </main>
      );
  }
}
