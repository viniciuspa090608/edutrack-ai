## Why

A configuração de IA da conta já atende gerações pontuais. Um chat permite consultar o próprio estudo e preparar criações em uma conversa retomável, com confirmação explícita e limites que preservam capacidade para os fluxos atuais.

## What Changes

- Adicionar a aba Assistente IA na área autenticada, com histórico paginado, sugestões editáveis e recuperação de falhas.
- Permitir consultas de matérias, tarefas e flashcards e propor criações nesses módulos, com flashcards destinados a baralhos existentes.
- Confirmar criações pela API com revalidação e idempotência. Reter mensagens no MySQL por 30 dias corridos por mensagem e executar limpeza periódica independente do tráfego.
- Limitar cada envio a uma chamada ao provedor, reservar capacidade na cota compartilhada e medir o piloto antes de ampliar o acesso.

## Capabilities

### New Capabilities

- `ai-study-assistant` — chat, histórico, consultas e confirmações de criação.

### Modified Capabilities

- `ai-provider-routing` — aplicar resolução por conta ao chat e reservar capacidade compartilhada para as gerações existentes.
- `authenticated-shell-visual-experience` — incluir o Assistente IA na sidebar e no menu Mais para contas elegíveis.

## Impact

Interface autenticada React, contratos públicos, rotas Express, serviços de estudo, configuração e uso de IA, migrations MySQL e rotina de limpeza no deploy. A liberação do piloto depende de uma matriz de compatibilidade e de limites medidos na hospedagem e nos provedores oferecidos.
