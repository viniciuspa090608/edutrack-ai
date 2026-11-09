# Tasks

## 1. Controles compartilhados e módulos

- [x] 1.1 Padronizar painéis de filtros expansíveis e a submissão explícita dos critérios, começando por Tarefas e revisando Matérias e as demais áreas. Verificar abertura por teclado, preservação dos filtros ao recolher, aplicação, limpeza e envio explícito da consulta de Estatísticas.
- [x] 1.2 Implementar expiração dos avisos transitórios e aplicá-la aos avisos equivalentes da plataforma. Verificar o aviso de origem Classroom, a substituição de mensagens e a permanência de erros que exigem ação.
- [x] 1.3 Reorganizar filtro e ações de Flashcards e implementar o estado Nenhum baralho ainda. Verificar criação, filtro sem resultados, falha e quebra responsiva.
- [x] 1.4 Centralizar ícone, título, descrição e ação do estado vazio de Matérias. Verificar alinhamento e alcance da ação com zoom.
- [x] 1.5 Exibir cada dia de Rotinas em largura inteira. Verificar ordem, preenchimento da linha e ação Adicionar horário com o dia correto.

## 2. Configurações e cadastro

- [x] 2.1 Compactar o Perfil e alinhar Salvar nome ao campo. Verificar a linha em telas largas, a quebra em 320 px e os fluxos de foto, nome e troca de e-mail.
- [x] 2.2 Aplicar 3 px entre título e descrição nos blocos Google e Classroom, alinhar a ação do Classroom e mostrar o badge de conexão. Verificar os estados disponíveis e a disposição em ambos os temas.
- [x] 2.3 Ocultar visualmente Modo de geração. Verificar o nome acessível do grupo e a navegação por teclado.
- [x] 2.4 Aceitar e persistir o nome de exibição opcional no contrato e no cadastro local. Verificar no MySQL isolado nome válido, repetido, ausente e inválido, além do fluxo de confirmação de e-mail.
- [x] 2.5 Adicionar o campo de nome apenas no modo Criar conta. Verificar envio opcional, feedback de validação e compatibilidade com os fluxos de login e Google.

## 3. Dashboard e tarefas

- [x] 3.1 Refinar a barra e o desfoque da lista de Tarefas e remover o aviso de tarefas ativas sem prazo. Verificar listas curtas e longas, ambos os limites de rolagem e acesso por teclado.
- [x] 3.2 Ajustar a altura de Matérias e Progresso ao conteúdo, separar os indicadores de Progresso por 5 px e remover a rolagem interna de Estatísticas. Verificar estados vazios e preenchidos e o conteúdo completo em telas largas e estreitas.
- [x] 3.3 Adicionar a caixa de conclusão rápida e compactar Ver detalhes em tarefas sem subtarefas. Verificar conclusão simples e em lote, cancelamento, falha, sincronização com os filtros e preservação dos fluxos de reabertura.

## 4. Verificação integrada

- [x] 4.1 Revisar os fluxos afetados em 320 px e desktop, nos temas claro e escuro, usando teclado e movimento reduzido.
- [x] 4.2 Executar pnpm lint, pnpm typecheck, pnpm test e pnpm build com MySQL real isolado para os testes de banco.
