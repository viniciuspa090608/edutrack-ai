# Proposal

## Why

Algumas ações de Flashcards ocupam linhas separadas mesmo com espaço disponível, e estilos de botões distorcem os checkboxes de Módulos. Paginação com ícones e visibilidade opcional de senhas digitadas melhoram a usabilidade sem alterar funcionalidades ou autenticação.

## What Changes

- Agrupar ações existentes de Flashcards em linhas flexíveis, preservando textos, eventos e estados; permitir quebra em espaços estreitos sem comprimir os controles ou gerar overflow.
- Corrigir exclusivamente a apresentação dos checkboxes de Configurações > Módulos, preservando proporção quadrada e estados interativos.
- Substituir textos direcionais das paginações existentes por chevrons já adotados, mantendo nomes acessíveis, navegação e desativação nos limites.
- Adicionar controle reutilizável com olho/olho riscado do Font Awesome apenas a campos explicitamente destinados à senha da conta, ocultos por padrão, preservando atributos e validações.
- Validar somente frontend/UI diretamente relacionado, incluindo temas claro/escuro, teclado e largura mínima de 320 px.

## Capabilities

### New Capabilities

- `frontend-ui-controls`: apresentação responsiva das ações de Flashcards, checkboxes de Módulos e paginações existentes.

### Modified Capabilities

- `user-authentication`: acrescentar apresentação de senha com visibilidade alternável exclusivamente nos campos reais de senha existentes; nenhuma alteração das regras de autenticação.

## Impact

- `apps/web/src/features/flashcards`, estilos `flashcards.css` e `account.css`, paginações que renderizam seus próprios botões, e componentes visuais de `packages/ui`.
- Campos existentes: `AccessPage` (senha em login/cadastro), `PasswordRecoveryPage` (nova senha), `ProfilePage` (senha para confirmar identidade, senha atual e nova senha).
- Não existem campos de confirmação de senha nessas telas; não serão criados. Códigos, OTPs, tokens, PINs, e-mail e outros controles não recebem olho nem mudança de tipo.
- Nenhuma alteração em backend, APIs, contratos, banco, rotas, regras de negócio, arquitetura ou estados globais. Não instalar uma biblioteca completa de ícones se dois assets SVG locais do Font Awesome forem suficientes.
- O pedido explícito de testes restritos prevalece sobre a convenção geral de suíte completa do AGENTS.md. O apply concluído terá um único commit incluindo implementação e tarefas finais; sem push, tag ou arquivamento automático.
