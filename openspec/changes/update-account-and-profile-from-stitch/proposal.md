# Proposal

## Why

A área `/conta` ainda apresenta perfil, segurança e preferências em uma sequência de cards sem a hierarquia visual dos módulos renovados. A referência Stitch permite tornar toda essa área mais clara e consistente, incluindo os fluxos que o protótipo não representa, sem modificar os recursos reais da conta.

## What Changes

- Atualizar visualmente resumo de identidade, edição de nome, foto com preview/upload/remoção, e-mail e meios de entrada reais.
- Organizar navegação interna e cards em Perfil, Preferências, Aparência e Segurança/Conta conforme o conteúdo existente, sem grupos vazios ou rotas novas.
- Derivar o mesmo padrão para troca de e-mail (prova de identidade, solicitação, código e reenvio), senha local, orientação Google, vínculo Google, logout e todos os estados associados.
- Renovar controles dos quatro módulos e fuso de estudo; disponibilizar o controle do tema existente sem mudar sua persistência.
- Utilizar tokens, componentes compartilhados e padrões dos módulos atualizados; garantir temas claro/escuro, teclado e layout desde 320 px.
- Usar `C:/Users/vinic/Downloads/accont_edutrack_ai.zip` somente como referência visual. Omitir dados acadêmicos, telefone, notificações, 2FA, dispositivos, planos e integrações sem suporte. Não criar exclusão de conta.
- Validar apenas testes UI/front-end de Perfil/Conta e componentes diretamente modificados; não executar suíte completa, backend, banco ou testes de outros módulos.

## Capabilities

### New Capabilities

- `account-profile-visual-experience`: apresentação consistente e responsiva de todos os fluxos reais de Perfil/Conta, com temas e feedback acessíveis.

### Modified Capabilities

Nenhuma. Requisitos funcionais de perfil, preferências, autenticação, recuperação e segurança permanecem intactos; esta capacidade especifica a experiência visual.

## Impact

- Principalmente `apps/web/src/features/profile/ProfilePage.tsx`, estilos locais e testes de perfil.
- Apresentação de `StudyTimeZoneSection.tsx`, integração de vínculo Google e logout em `PrivatePage.tsx`, reutilização do mecanismo de tema e componentes de `packages/ui`.
- Sem mudanças em `apps/api`, schemas de `packages/contracts`, endpoints, autenticação, armazenamento de foto ou regras de persistência. Sem novas dependências previstas.
- Alterações preexistentes em Pomodoro e nas propostas de Progresso/Achievements e Sessões/Pomodoro serão preservadas; esta proposta não implementa nem versiona esses trabalhos.
