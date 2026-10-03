# Design

## Context

Veja `proposal.md` e as specs `manual-flashcards` e `shared-contracts`. O código atual contém API de health e páginas públicas; autenticação, preferências e matérias estão em proposals separados. `add-subjects` prevê `study_subjects` e um contrato público de consulta/autorização, mas explicitamente não associa flashcards nessa etapa. Portanto, este apply criará o vínculo depois que matérias existirem, sem importar repository interno delas.

## Goals / Non-Goals

**Goals:** persistir baralhos e cartões manuais com propriedade verificável, permitir consulta frente/verso e manter o vínculo com matéria opcional e reversível.

**Non-Goals:** importação, agendamento ou avaliação de revisão, geração com IA, anexos, compartilhamento, estatísticas e progresso automático.

## Decisions

### 1. Duas entidades de propriedade simples

Migrations versionadas criarão `flashcard_decks` com ID imutável, `user_id`, `subject_id` anulável, nome, descrição opcional e timestamps; `flashcards` com ID, `deck_id`, frente, verso e timestamps. Uma FK de cartão para baralho usa `ON DELETE CASCADE`; uma FK de baralho para matéria usa `ON DELETE SET NULL`. A FK de usuário e índices iniciados por `user_id` suportam isolamento e listagem. O tipo de cada FK acompanhará as migrations já aplicadas. `synchronize` permanece falso. Alternativa rejeitada: guardar cartões em JSON do baralho, que dificultaria edição individual e verificações por cartão.

Nome do baralho terá 1–120 caracteres aparados, descrição até 1.000, frente até 2.000 e verso até 4.000; frente e verso exigem ao menos um caractere não vazio. O conteúdo será texto simples, com quebras de linha preservadas; a web não executará HTML inserido. Um baralho poderá ter zero cartões. O `subjectId` omitido na criação equivale a `null`; em edição, omitido mantém o vínculo e `null` o remove. Esses limites mantêm payloads e renderização previsíveis. Alternativa rejeitada: exigir matéria para criar baralho, o que impediria o uso autônomo.

### 2. API aninhada e autorização em cada operação

Rotas autenticadas: `POST/GET /flashcard-decks`, `GET/PATCH/DELETE /flashcard-decks/:deckId`, `POST/GET /flashcard-decks/:deckId/cards` e `GET/PATCH/DELETE /flashcard-decks/:deckId/cards/:cardId`. Listas usam paginação padrão 1/20, máximo 100, ordenação estável por criação e ID; a lista de cartões contém a frente e metadados, mas não o verso. A consulta individual inclui ambos os lados, para exibição controlada pela web. `PATCH` aceita apenas campos conhecidos e rejeita payload vazio; campo omitido permanece como está. Controllers usam o ID da sessão; services validam regras e repositories filtram `user_id` em toda operação. Para cartões, a consulta combina proprietário, `deck_id` e `card_id`; falha de qualquer vínculo retorna 404. Exclusões de baralho e cartões são transacionais quando houver efeitos em filhos. Alternativa rejeitada: buscar cartão apenas por ID e checar baralho depois, abrindo caminho a vazamento de existência.

### 3. Associação com matéria por contrato público

Ao criar ou trocar associação, o service de flashcards verifica a preferência de matérias e chama a operação pública de `add-subjects` para confirmar que a matéria pertence ao usuário. Não importa repository ou entidade interna de matérias. Erro por matéria alheia ou inexistente vira 404 sem mudar o baralho. Desassociar (`null`) e editar outros campos continuam disponíveis com matérias desativadas; uma edição que omite `subjectId` não altera vínculo já guardado. Quando matérias estão desativadas, o DTO do baralho não inclui nome ou outros dados da matéria, e a web não mostra seletor; o ID vinculado pode ser preservado internamente até reativação. Exclusão da matéria limpa a FK, preservando baralho/cartões. Alternativa rejeitada: exclusão em cascata de baralhos ao excluir matéria.

### 4. Preferências e interação de consulta

O módulo respeita `flashcards_enabled` na rota web e em toda operação da API, consultando a preferência conforme o contrato de conta; desativação bloqueia acesso e preserva dados. `ai_enabled` não é consultado no CRUD manual. A página `/app/flashcards` mostra baralhos, formulário e cartões do baralho. Ao abrir cartão, estado local `revealed=false` renderiza somente a frente; botão **Revelar resposta** mostra o verso, e **Mostrar frente** volta à pergunta. Abrir outro cartão reseta o estado. A revelação não dispara chamada de escrita nem evento de avaliação. Controles de edição e exclusão ficam separados da ação de revelar. Alternativa rejeitada: usar um clique em qualquer ponto do cartão, que pode ser acionado por engano e prejudicar teclado/leitores de tela.

Formulários preservam os valores após erro, exclusões pedem confirmação, listas diferenciam vazio de falha e loading. CSS responsivo desde 320 px, foco visível, rótulos programáticos, anúncio de erros/sucesso e movimento reduzido seguem as regras do projeto.

## Risks / Trade-offs

- [Pré-requisitos ainda não aplicados] → aplicar autenticação, preferências e `add-subjects` antes, e alinhar IDs/FKs aos tipos efetivos.
- [Matéria removida durante associação] → FK e transação impedem vínculo inválido; resposta não modifica parcialmente o baralho.
- [Acesso cruzado por cartão ou baralho] → filtrar `user_id` e hierarquia em todas as consultas e mutações; testar com duas contas.
- [Resposta aparecer antes da revelação] → lista não carrega verso, componente de consulta renderiza apenas frente até ação explícita, e testes verificam a tela.
- [Cartões excluídos com o baralho] → confirmação nomeia o efeito sobre os cartões e testes verificam cancelamento/falha.

## Migration Plan

1. Confirmar migrations de usuários e matérias e a operação pública de autorização de matéria; adicionar contratos e migrations de baralhos/cartões.
2. Publicar API e web do módulo manual com preferência de flashcards e associação opcional; exercitar CRUD, revelação e exclusão em MySQL isolado.
3. Em rollback do código, ocultar a rota e remover endpoints sem apagar dados automaticamente; reversão de migration só após decisão explícita sobre os baralhos existentes.
