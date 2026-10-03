# Proposal

## Why

A EduTrack já implementa os módulos de estudo, mas iniciar os processos separadamente e montar dados manualmente dificulta demonstrações locais consistentes. É necessário preparar três experiências de uso reproduzíveis, com histórico realista e limpeza explícita e protegida do banco de desenvolvimento.

## What Changes

- Adicionar comandos explícitos de inspeção, reset por TRUNCATE e população do banco de desenvolvimento, preservando esquema e migrations, exigindo confirmação do alvo e bloqueando outros ambientes.
- Criar contas locais confirmadas nos perfis ativo, intermediário e iniciante, com dados isolados por usuário, histórico temporal, credenciais documentadas e nenhuma chamada real à IA.
- Disponibilizar `npm run dev` na raiz delegando a pnpm e iniciando web, API e worker de e-mail com encerramento conjunto.
- Configurar Vite em `0.0.0.0:5173` com strictPort e acesso autenticado pelo computador e LAN, preservando restrições de origens e cookies.
- Documentar pré-requisitos, comandos, endereços, consequências do reset e validação dos três perfis.
- Ao aplicar, executar os quatro checks obrigatórios com MySQL real isolado; separar a mudança e alterações preexistentes em dois commits revisados, manter ambos somente no repositório local. Publicação cancelada pela pessoa durante o apply. Não criar tags nem arquivar.

## Capabilities

### New Capabilities

- `demo-database-management`: inspeção e reset seguro e explícito do banco local.
- `demo-profiles`: população reproduzível de três perfis de demonstração.

### Modified Capabilities

- `workspace-bootstrap`: execução integrada documentada por `npm run dev`, mantendo pnpm.
- `web-runtime`: servidor local com porta fixa e acesso autenticado pela rede local.

## Impact

Scripts da raiz e da API, configuração Vite, cliente HTTP, validação de origens e middleware de autenticação quando necessário, README e `.env.example`. Reutiliza MySQL, migrations e regras dos módulos existentes; pode acrescentar dependência de supervisão de processos. Não altera contratos de produto nem cria módulos futuros. O escopo final requer dois commits locais; publicação, push e criação de repositório foram cancelados pela pessoa durante o apply.
