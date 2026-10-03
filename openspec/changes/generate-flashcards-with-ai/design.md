# Design

## Context

Veja `proposal.md` e as specs `flashcard-ai-generation` e `shared-contracts`. A API atual tem somente health; os módulos de autenticação, preferências e flashcards manuais ainda são proposals. `add-manual-flashcards` define o baralho como proprietário dos cartões e frente/verso de texto simples. `import-flashcards` define um fluxo separado de arquivo e confirmação. A primeira integração de IA também foi planejada em `generate-subject-roadmaps-with-ai`, mas a geração de flashcards deve funcionar sem matérias ou roadmaps.

## Goals / Non-Goals

**Goals:** reutilizar o modelo de cartões manuais, validar saída não confiável, oferecer revisão sem persistência e confirmar de modo atômico e idempotente.

**Non-Goals:** criar baralho, processar arquivo, alterar cartões existentes, deduplicar contra o baralho, agendar revisões, atribuir avaliações ou depender de matérias.

## Decisions

### 1. Geração separada do salvamento

`POST /flashcard-decks/:deckId/ai-generations` recebe texto de assunto ou conteúdo, aparado, de 1 a 10.000 caracteres. O service verifica sessão, `flashcards_enabled`, `ai_enabled` e propriedade do baralho antes de chamar o provedor. O prompt trata o texto do usuário como dados, não como instrução de sistema, e solicita de 1 a 20 cartões com frente e verso. A resposta é limitada em bytes, parseada e validada integralmente contra o schema de cartões manuais: frente até 2.000 caracteres, verso até 4.000, ambos não vazios. Qualquer cartão inválido rejeita toda a geração. Não há inserção de cartão nem rascunho no banco nessa rota.

Após validação, a API atribui um ID aleatório a cada cartão e retorna a prévia com um comprovante assinado, de 30 minutos, contendo usuário, baralho, ID da geração, expiração e a lista de IDs de cartões autorizados. O comprovante não contém o texto do usuário nem das respostas. A web guarda prévia e comprovante só no estado da página. Alternativa rejeitada: persistir cartões temporários antes da revisão, que deixaria conteúdo salvo após cancelamento.

### 2. Confirmação permite edição e remoção, não inclusão oculta

`POST /flashcard-decks/:deckId/ai-generations/confirm` recebe comprovante e uma lista não vazia de cartões com IDs da prévia, frente e verso revisados. A API verifica assinatura, expiração, usuário, baralho, IDs únicos e subconjunto dos IDs autorizados; IDs removidos não são inseridos. Revalida textos e preferências. A ordem enviada define a ordem de criação e a resposta lista os cartões criados. A web oferece edição e remoção, e desabilita salvar se todos forem removidos. Não oferece adicionar cartão na prévia; a criação manual já cobre isso. Alternativa rejeitada: aceitar qualquer lista de cartões junto de um comprovante válido, o que tornaria a confirmação uma rota de criação arbitrária.

O módulo de IA chama um método público do service de flashcards para confirmar a criação em uma transação. Uma migration versionada cria `flashcard_ai_confirmations` com ID de geração único, usuário, baralho, IDs dos cartões criados e data de confirmação. A transação bloqueia o baralho, grava os cartões e o registro de confirmação juntos. Repetições com o mesmo ID recuperam o resultado persistido; se o envio concorrente divergir, prevalece a primeira confirmação. Para recuperar resposta perdida após expiração, a API pode validar a assinatura e consultar uma confirmação já concluída, sem permitir nova gravação. O módulo de IA não importa repository interno de flashcards. Alternativa rejeitada: gravar um cartão por requisição, que permitiria resultado parcial.

Cartões gerados passam a ser cartões comuns: podem ser editados, excluídos e consultados manualmente e por importação. Esta rota não aplica a deduplicação própria de CSV/TSV; tal como na criação manual, cartões iguais podem coexistir se o usuário os confirmar. A idempotência impede apenas duplicação causada pela repetição da mesma confirmação.

### 3. Adaptador de IA isolado na API

O adaptador de provedor e as variáveis validadas de chave, modelo, timeout, tamanho máximo da resposta e segredo de assinatura ficam no servidor. Se `generate-subject-roadmaps-with-ai` já tiver entregado um adaptador compartilhável, reutilizá-lo sem importar regras do módulo de matérias; caso esta seja a primeira funcionalidade de IA aplicada, criá-lo como infraestrutura genérica para consumidores posteriores. Configuração de IA ausente não impede iniciar a API nem usar criação manual ou importação; a geração retorna erro controlado. Não há repetição automática de chamadas para limitar custo. Nunca registrar prompt completo, saída bruta, chave ou comprovante em logs. Alternativa rejeitada: chamar o provedor na web, que exporia segredos e contornaria autorização.

### 4. Editor de prévia e preferências

Na página de baralhos, a opção **Aprimorar com IA** aparece somente quando flashcards e IA estão habilitados. O formulário exige baralho existente e texto de entrada; após gerar, a web mostra destino, entrada e frente/verso de cada cartão, com editar, remover, **Salvar cartões** e **Cancelar**. A confirmação só é enviada pelo botão de salvar. Erros mantêm entradas e edições para correção ou nova tentativa; expiração pede nova geração. Conteúdo é renderizado como texto escapado, sem interpretar HTML/Markdown. Estados de loading, erro, prévia e sucesso, foco, teclado, 320 px e movimento reduzido seguem as regras do projeto. Se a preferência mudar em outra aba, o servidor recusa a operação seguinte e a web oferece caminho para reativação. Alternativa rejeitada: salvar automaticamente ao receber o modelo.

## Risks / Trade-offs

- [Pré-requisitos ainda não aplicados] → aplicar autenticação, preferências e flashcards manuais; conferir os limites e contratos reais antes da integração.
- [Saída malformada ou prompt malicioso] → limitar tamanho, validar schema integralmente, tratar texto como dado e renderizar texto seguro.
- [Custo ou indisponibilidade do provedor] → limite de entrada/saída e timeout, sem repetição automática; manual e importação não chamam o adaptador.
- [Confirmação duplicada ou concorrente] → ID único de geração e transação com bloqueio do baralho; devolver o resultado confirmado.
- [Baralho excluído entre prévia e confirmação] → revalidar destino e retornar não encontrado sem cartões órfãos.
- [Prévia expirada ou preferência desabilitada] → recusar nova gravação e preservar cartões existentes; oferecer nova geração quando permitido.

## Migration Plan

1. Aplicar `add-manual-flashcards`, autenticação e preferências; `import-flashcards` pode ser aplicado antes ou depois. Conferir o service público de criação de cartões.
2. Adicionar contratos, adaptador de IA se ainda não existir e migration de confirmações idempotentes, mantendo `synchronize: false`.
3. Publicar geração, confirmação e editor juntos; testar MySQL real isolado, duas contas, respostas inválidas, cancelamento e confirmações repetidas.
4. Em rollback do código, ocultar a opção e desregistrar as rotas. Cartões já confirmados continuam como cartões manuais; não apagar dados confirmados automaticamente.
