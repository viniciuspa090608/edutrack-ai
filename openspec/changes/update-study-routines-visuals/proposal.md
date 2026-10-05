# Proposal

## Why

A página de Rotinas de estudo ainda usa uma apresentação básica, enquanto Matérias, Tarefas e Pomodoro já adotam uma hierarquia visual consistente na área autenticada. Esta mudança alinha exclusivamente sua apresentação a esses padrões, preservando integralmente os dados e o funcionamento atual.

## What Changes

- Atualizar cabeçalho, espaçamento, tipografia, superfícies e hierarquia das ações existentes.
- Aplicar o padrão atual de cards à lista de rotinas e aos sete dias da programação semanal, usando somente nome, fuso e horários existentes.
- Harmonizar o formulário inline de criação/edição, a confirmação de exclusão, a paginação e os estados de loading, erro, vazio e sucesso.
- Reutilizar componentes e tokens existentes com suporte a tema claro/escuro, teclado, movimento reduzido e largura mínima de 320 px.
- Preservar handlers, efeitos, refs, validações, requisições e condições de renderização. Não adicionar funcionalidades, campos, métricas, status, dados fictícios nem alterar outras páginas.

## Capabilities

### New Capabilities

Nenhuma. A atualização é exclusivamente de apresentação.

### Modified Capabilities

Nenhuma. Não há alteração de requisitos comportamentais; `skip_specs: true` dispensa delta specs sem inventar novos requisitos funcionais.

## Impact

Implementação limitada a `apps/web/src/features/routines/RoutinesPage.tsx` e `apps/web/src/styles/routines.css`, com ajustes somente nos testes UI afetados dessa página, se necessários. Componentes compartilhados existentes serão consumidos sem modificar suas implementações ou estilos globais. Não afeta APIs, contratos, backend, banco, hooks, stores, rotas, navegação, dependências ou arquitetura.

No apply, executar somente testes UI diretamente relacionados, excluindo os casos de autenticação presentes no mesmo arquivo. Não executar suíte geral, backend, banco ou outros módulos. Verificações de lint, tipos e build seguem as convenções do projeto e não substituem a inspeção visual da página.

Exceção de escopo autorizada pelo usuário durante o apply: incluir a correção pontual de TS2412 em `apps/api/src/modules/auth/email.repository.ts`, atribuindo o fallback de `newEmail` somente quando o e-mail consultado existir. Nenhuma rota, contrato ou regra de Rotinas muda; a correção permite concluir typecheck/build gerais sem atribuir undefined a uma propriedade opcional.
