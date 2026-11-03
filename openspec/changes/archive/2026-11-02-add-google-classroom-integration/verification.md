# Validação da integração Classroom

## Escopo final aprovado

Importação opcional de matérias/tarefas e gestão da conexão. PDFs/arquivos, geração e CRUD de notas, materiais/Drive e chat foram retirados por solicitação explícita do usuário. Aprimoramentos existentes de roadmaps/flashcards e configuração anterior dos provedores permanecem. Indisponibilidade real do Gemini não é dependência desta importação.

## Homologação real autorizada

Ambiente separado: API 3002, web 5174 e MySQL de homologação exclusivo. Conta local sintética com consentimento Google dado pela pessoa titular. Nenhuma senha, chave ou token integra os arquivos versionados.

- Callback autorizado: http://localhost:3002/integrations/google-classroom/callback; Classroom API habilitada no projeto OAuth.
- Aplicativo em teste e usuário de teste cadastrado. Consentimento Classroom independente do login. Políticas de domínio e verificação para produção continuam sendo responsabilidades do projeto Google; o teste não comprova autorização para outros domínios.
- Consentimento inicial leu turmas/atividades sem Drive. O Google retornou alias canônico de leitura de coursework, agora reconhecido estritamente.
- Consulta real retornou 12 turmas; somente SQL Fundamentals foi selecionada e associada a nova matéria com planejamento sintético revisado.
- Primeira importação: 1 matéria e 10 tarefas adicionadas; 3 atividades recusadas por descrições acima do limite atual de 2.000 caracteres. Resultado parcial claro, sem truncamento.
- Reimportação: zero adições; 1 matéria e 10 tarefas inalteradas; mesmos 3 erros. Sem duplicação. Onboarding continuou apesar do resultado parcial.
- Desconexão real, após correção do JSON de DELETE/POST sem payload, confirmou revogação remota. Matéria e links de proveniência permaneceram disponíveis.
- Revisão por teclado em 320 px: seleção/resultado/desconexão e detalhe de matéria sem rolagem horizontal (305 px de conteúdo em 305 px disponíveis). Estados e foco também cobertos pelos testes de interface. Regras globais de movimento reduzido preservadas.

Os testes anteriores de PDFs/Gemini não fazem parte da entrega final e não são apresentados como sucesso. A conexão de teste foi revogada após a homologação; não há sincronização automática. O banco de homologação anterior pode conservar tabelas experimentais sem dados de notas geradas, que não são criadas pela migration final nem usadas pela aplicação.

## Verificação após redução

Checks finais aprovados: pnpm lint, pnpm typecheck, pnpm test e pnpm build. Suíte completa: 22 testes do workflow, 41 de contratos, 277 da API e 267 da web (607 no total). Build mantém somente o aviso de tamanho do bundle web. Auditoria de 62 arquivos próprios sem valores secretos do ambiente; quatro snapshots preservam integralmente as specs atuais. git diff --cached --check aprovado. Refs reais do servidor consultadas antes de iniciar o fluxo de conclusão. Testes usam MySQL real isolado e simulam apenas serviços HTTP externos; nenhuma configuração inválida de banco é ocultada por mock.

Na revisão final da versão reduzida, o perfil mostrou apenas o resultado de importação anterior: uma matéria e dez tarefas inalteradas, três erros de descrição extensa, nenhuma geração/contagem/controle de arquivos. Em 320 px, conteúdo e largura disponível foram iguais a 305 px; Tab percorreu conectar e tentar novamente. IA permaneceu habilitada na conta sem produzir controles ou chamadas de arquivos. A homologação anterior de importação/reimportação e revogação permanece válida para o fluxo preservado.

Testes direcionados do escopo final: 21 testes API/política com MySQL isolado, 5 de interface Classroom e 3 de contratos passaram. Após ajuste das fixtures antigas de perfil/cadastro, seus 37 testes também passaram. Lint, typecheck, build e suíte completa final aprovados.
