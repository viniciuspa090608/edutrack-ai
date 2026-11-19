# Validação do Assistente IA

## Banco e fluxos

- Integração HTTP com Express e MySQL real em bancos descartáveis com prefixo de teste. A validação cobre migrations, isolamento, paginação, as três criações, replay e concorrência da confirmação, rollback do lote, expiração e recuperação de falhas.
- Os cinco protocolos do catálogo passaram com respostas sintéticas. Uma configuração fora da matriz devolveu erro de incompatibilidade e fez zero chamadas externas.

## Homologação local isolada

- API em 3002 e web em 5174, com conta sintética. No Edge, a aba passou em 320 px e 1280 px nos temas claro e escuro. O teclado preencheu uma sugestão, enviou a mensagem em uma ação separada, abriu o menu Mais e recuperou o foco após Escape. A verificação incluiu movimento reduzido e largura sem rolagem horizontal.
- A API compilada removeu uma mensagem vencida e sua conversa em cada uma de duas inicializações, sem tráfego e com o piloto desligado. Foram observados 16 ms e 12 ms na coleta de limpeza.
- Um turno com resposta sintética e atraso de 300 ms no limite HTTP fez uma chamada externa simulada e respondeu em 382 ms no endpoint. As amostras de telemetria registraram durações, contagens e códigos de erro, com a rota de leitura parametrizada nos logs.

## Capacidade medida

- Carga mista com quatro solicitações, uma por conta, três chamadas admitidas e pico de três chamadas simultâneas. O teto do chat de um slot reservou dois slots para roadmap e flashcards. A segunda tentativa simultânea de chat recebeu 429 antes da fronteira HTTP. O lote completou em 105 ms com respostas sintéticas.
- O teste de carga usou teto diário de 10 por conta e 30 no total para chat, diante dos limites gerais de 20 e 500. O teto preservou 470 chamadas diárias do orçamento global para os fluxos existentes no cenário medido. As execuções reais usaram limites de duas chamadas por conta, quatro no total e um slot simultâneo para chat. Esses valores pertencem aos ambientes isolados. A configuração de abertura do piloto exige números calibrados com a hospedagem e resultados de chamadas reais.

## Provedor real

- A consulta autenticada ao modelo Gemini configurado localmente retornou HTTP 200. As tentativas de geração em Node e curl expiraram sem cabeçalhos de resposta, inclusive com prompt sintético mínimo e timeout estendido. Uma tentativa posterior através da API local retornou HTTP 200 do Gemini e HTTP 200 do Assistente IA com uma chamada externa em 67.082 ms. O timeout de validação foi ajustado para 120.000 ms dentro do limite existente. Na homologação isolada em 3002, três tentativas retornaram AI_TIMEOUT após cerca de 120 segundos. Uma nova tentativa com pergunta sintética de estudo devolveu HTTP 200 do Gemini e HTTP 200 do Assistente IA com uma chamada externa em 118.625 ms. O Gemini é a combinação oferecida neste piloto. A variabilidade observada deixa pouca margem no timeout máximo e exige nova medição de latência antes de ampliar o acesso.

## Checks do repositório

- Passaram pnpm lint, pnpm typecheck, pnpm test com MySQL local isolado e pnpm build. O fluxo openspec:finish executa os quatro checks novamente antes do commit.
