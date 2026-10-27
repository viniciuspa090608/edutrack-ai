# Design

## Context

Veja [proposal.md](proposal.md) e [specs/flashcard-import/spec.md](specs/flashcard-import/spec.md). O código atual ainda não implementa baralhos; `add-manual-flashcards` define CRUD e vínculo opcional com matéria, mas está em planejamento. A importação entra depois desse módulo, reutiliza sessão, preferência de flashcards e limites de texto dos cartões manuais. A API usa Express, TypeORM e migrations MySQL; `synchronize` permanece desativado.

## Goals / Non-Goals

**Goals:** conferir dados antes de gravar, manter resultado explicável por linha, permitir repetição segura da confirmação e isolar baralhos/tentativas por usuário.

**Non-Goals:** criar baralho durante a importação, alterar cartões existentes, deduplicar cartões manuais antigos, executar IA, sugerir mapeamento com IA, importar XLSX ou revisar cartões automaticamente.

## Decisions

### 1. Leitura limitada e sem efeitos

Receber upload por `POST /decks/:deckId/imports`, limitar corpo a 2 MiB antes de armazená-lo e aceitar apenas UTF-8 válido, com BOM opcional. Delimitador vem do formato escolhido/ extensão CSV ou TSV e é validado contra o conteúdo; cabeçalho é obrigatório, mesmo quando os nomes se repetem. Um parser de registros, sem `split` ingênuo por linha, interpreta aspas dobradas, delimitadores e quebras dentro de aspas. Rejeitar arquivo estruturalmente malformado inteiro; largura incorreta de uma linha estruturalmente legível vira erro daquela linha. Linhas totalmente vazias não contam. Limitar também 1.000 registros não vazios e largura máxima de colunas para conter uso de memória. Não confiar apenas em extensão ou MIME enviado pelo navegador. A etapa de upload não cria cartões.

Persistir tentativa própria com baralho, bytes do arquivo, formato, estado e prazo de 15 minutos em tabela `flashcard_import_attempts`. Conteúdo temporário é privado, não é logado e é removido ao cancelar, expirar ou concluir; o resultado final sem conteúdo do arquivo pode ficar por 24 horas para recuperar uma resposta perdida. Expiração é checada em cada operação e limpeza periódica remove registros vencidos. MySQL permite que confirmação funcione em mais de uma instância da API. A alternativa de guardar somente no navegador permitiria que a confirmação usasse dados diferentes dos pré-visualizados.

### 2. Mapeamento, amostra e classificação

`PUT /decks/:deckId/imports/:attemptId/preview` recebe índices de coluna, não nomes, para suportar cabeçalhos repetidos. Índices devem existir e ser distintos. A API aplica os mesmos limites de frente/verso dos cartões manuais, aparando espaços externos antes de persistir. A chave de comparação é `NFC(trim(front)).toLowerCase()` e o mesmo para verso; espaços internos permanecem significativos. Uma linha inválida é rejeitada antes da deduplicação; entre linhas válidas iguais, a primeira vence. Pares já no baralho entram em ignorados. Pré-visualização exibe até 20 registros, com status previsto, além de todas as contagens e motivo/número de linha para rejeições (máximo de 1.000). Front/verse não são incluídos em logs. Mudar mapeamento substitui a pré-visualização e o snapshot da tentativa, sem criar cartão.

### 3. Confirmação atômica e concorrência

`POST /decks/:deckId/imports/:attemptId/confirm` revalida sessão, proprietário, preferência e validade da tentativa. Dentro de transação MySQL, bloqueia a tentativa e o baralho, relê pares atuais do baralho, classifica novamente as linhas e grava os novos cartões em lote. Integra a criação manual de cartões ao mesmo bloqueio do baralho para impedir inserção concorrente entre checagem e commit; não altera a regra de que cartões manuais podem repetir pares. A transação grava resultado e marca a tentativa como concluída junto aos cartões; erro faz rollback integral. Repetir confirmação de tentativa concluída retorna o mesmo resultado sem inserir novamente. Tentativa expirada/cancelada não confirma. Se o baralho for excluído, a tentativa não pode confirmar. Assim, o resultado efetivo pode diferir do previsto por cartões adicionados após a pré-visualização, mas reflete a gravação real.

Resultado: `imported + ignored + rejected = records` para registros não vazios, sem cabeçalho. Duplicatas, inclusive surgidas depois da pré-visualização, são `ignored`; texto inválido e largura incorreta são `rejected`. Em uma importação com zero cartões válidos, confirmação ainda produz resultado explícito com zero importados, sem criar cartões. A alternativa de inserir cada linha em requisição própria teria resultados parciais e tornaria repetição de chamada perigosa.

### 4. Contratos, autorização e interface

Schemas em `packages/contracts` cobrem mapeamento, metadados de tentativa, amostra, erros e contagens. DTOs não expõem bytes brutos nem entidades TypeORM. Controllers recebem ID de usuário da sessão; consultas de baralho e tentativa sempre filtram por proprietário. A preferência de flashcards é verificada no upload, preview e confirmação; IA não é consultada. Rotas usam a proteção de origem das demais escritas. A web mostra seleção do arquivo, mapeamento por rótulo e posição, amostra tabular responsiva, contagens previstas, rejeições, botão de confirmação e resultado efetivo. Cancelar apaga a tentativa; erro mantém arquivo/mapeamento quando ainda válido. Controles e tabela são navegáveis por teclado, com cabeçalhos acessíveis e layout desde 320 px.

## Risks / Trade-offs

- [Limites dos cartões manuais ainda não publicados] → no apply, usar exatamente os limites efetivos da spec/contratos de `add-manual-flashcards` e testar rejeições com os mesmos casos.
- [Pré-visualização fica desatualizada após edição do baralho] → recalcular duplicatas sob bloqueio na confirmação e mostrar contagens finais efetivas.
- [Tentativas temporárias contêm conteúdo privado] → TTL curto, acesso por proprietário, sem logs de conteúdo e limpeza dos bytes após o fim.
- [CSV/TSV permite células interpretadas como fórmulas em outras ferramentas] → renderizar textos como texto puro na pré-visualização; não executar nem interpretar fórmulas.

## Migration Plan

1. Aplicar autenticação, preferências e `add-manual-flashcards`; confirmar contratos, limites de cartão e tipos de IDs existentes.
2. Aplicar migration versionada da tabela de tentativas e índices/limpeza; verificar rollback em MySQL isolado.
3. Publicar API e web juntas; testar CSV, TSV, aspas, BOM, limites, duas contas, duplicatas, falha e repetição da confirmação.
4. Em rollback do código, ocultar importação e desregistrar rotas; preservar cartões já importados e remover apenas tentativas temporárias vencidas.
