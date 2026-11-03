import { useEffect, useState } from 'react';
import { PrivatePage } from '../features/auth/PrivatePage.js';
import { EmailVerificationPage } from '../features/auth/EmailVerificationPage.js';
import { PasswordRecoveryPage } from '../features/auth/PasswordRecoveryPage.js';
import { AccessPage } from '../features/landing/AccessPage.js';
import { PublicLanding } from '../features/landing/PublicLanding.js';
import { SystemPage } from '../features/system/SystemPage.js';
import { moduleAtPath } from '../features/profile/module-catalog.js';

export function App() {
  const [path, setPath] = useState(
    window.location.pathname + window.location.search + window.location.hash,
  );
  useEffect(() => {
    const update = () =>
      setPath(
        window.location.pathname +
          window.location.search +
          window.location.hash,
      );
    window.addEventListener('popstate', update);
    return () => window.removeEventListener('popstate', update);
  }, []);
  const pathname = path.split(/[?#]/)[0]!;
  switch (pathname) {
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
      return <PrivatePage page="app" />;
    case '/app/pomodoro':
      return <PrivatePage page="pomodoro" />;
    case '/app/rotinas':
      return <PrivatePage page="rotinas" />;
    case '/app/estatisticas':
      return <PrivatePage page="estatisticas" />;
    case '/app/progresso':
      return <PrivatePage page="progresso" />;
    case '/conta':
      return <PrivatePage page="conta" />;
    default:
      if (moduleAtPath(pathname)) return <PrivatePage page="module" />;
      return (
        <main className="route-fallback">
          <h1>Página não encontrada</h1>
          <p>Este caminho ainda não existe na EduTrack.</p>
          <a href="/">Voltar à página inicial</a>
        </main>
      );
  }
}
