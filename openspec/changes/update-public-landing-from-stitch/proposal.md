# Proposal

## Why

A landing ainda apresenta autenticação provisória e recursos planejados, embora o produto já tenha esses fluxos implementados. As quatro referências do Stitch permitem substituí-la por uma apresentação responsiva coerente com o produto, preservando a identidade azul e o sistema React existente.

## What Changes

- Substituir hero, carrossel e grade antiga por hero com dashboard demonstrativo, Como funciona, quatro blocos alternados de funcionalidades, IA opcional, personalização e convite final.
- Unificar referências desktop/mobile e claro/escuro em um layout; manter exemplos estáticos identificados, independentes de API e sessão.
- Corrigir afirmações do export sobre resultados, recursos, preços, limites, notificações e garantias; remover avatar público, barra mobile de módulos, links fictícios e identidade legal inventada.
- Separar Entrar e Criar conta usando `/acesso?mode=login` e `/acesso?mode=register`, sem mudar autenticação ou segurança de returnTo.
- Acrescentar escolha global acessível de tema claro/escuro, persistida apenas no navegador; sistema como padrão, inicialização antes da pintura e fallback seguro.
- Prever animações discretas, teclado, movimento reduzido e comparação visual nos dois temas e cinco larguras.
- Atualizar requisitos obsoletos da landing e remover expressamente o requisito do carrossel automático; a seção Tecnologias deixa de ser obrigatória.

## Capabilities

### New Capabilities

- `application-theme`: consolidar nesta mudança o comportamento global de tema já implementado e a escolha manual local. A capacidade existe na mudança concluída `update-application-theme`, mas ainda não em `openspec/specs`; esta proposta incorpora seus requisitos vigentes sem arquivá-la ou sincronizá-la.

### Modified Capabilities

- `public-landing`: nova apresentação pública, conteúdo factual, exemplos, navegação, acesso real e interações; substituição do carrossel.
- `user-authentication`: seleção explícita do modo inicial de acesso por URL, preservando os fluxos e as proteções existentes.

## Impact

Afeta `apps/web/src/features/landing`, `styles/landing.css`, `app/theme.ts`, a inicialização da web, metadados de `index.html` e testes relacionados. Reutiliza componentes Shadcn de `packages/ui`; ajustes visuais ficam limitados à landing, preservando tokens e aparência interna. Não altera API, contratos de domínio, banco, IA nem módulos de estudo; não exige nova biblioteca de animação.

Depende da implementação já presente de autenticação, dashboard, matérias/roadmaps, Pomodoro, flashcards/revisões, analytics, sequências/conquistas e preferências de módulos. Há dependência documental com `update-application-theme`: reconciliar o requisito de sistema com a precedência manual desta proposta antes de futura sincronização/arquivamento, sem produzir requisitos duplicados.

Somente planejamento nesta etapa. O apply registrará Git inicial, preservará alterações preexistentes, executará os quatro comandos de qualidade com MySQL real isolado e produzirá exatamente um commit da mudança concluída com `tasks.md`; sem push, tag ou arquivamento.
