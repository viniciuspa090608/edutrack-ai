# Spec Delta

## MODIFIED Requirements

### Requirement: Ações responsivas de Flashcards
A interface SHALL apresentar cada grupo de botões de Flashcards na mesma linha quando houver espaço horizontal suficiente, permitindo quebra em telas estreitas sem compressão que prejudique textos ou ícones e sem overflow horizontal. A barra de baralhos SHALL omitir o título visual Baralhos e posicionar o filtro Matéria à esquerda, na mesma linha de Aprimorar com IA e Criar baralho quando houver espaço. Os controles SHALL preservar seus nomes acessíveis, ações e estados.

#### Scenario: Espaço amplo
- **WHEN** Flashcards é exibido em tela grande com espaço suficiente para as ações do grupo
- **THEN** o filtro Matéria e os botões da barra permanecem na mesma linha e legíveis.

#### Scenario: Espaço estreito
- **WHEN** Flashcards é exibido em tela pequena, inclusive a 320 px
- **THEN** os grupos podem quebrar em múltiplas linhas sem rolagem horizontal nem sobreposição ou perda de conteúdo.

## ADDED Requirements

### Requirement: Painéis expansíveis e aplicação de filtros
Painéis com múltiplos filtros SHALL iniciar recolhidos, abrir por um controle acessível e manter os critérios aplicados ao recolher. Formulários de filtragem SHALL aplicar as mudanças apenas ao acionar Aplicar filtros e oferecer Limpar filtros para restaurar os valores padrão. Consultas por parâmetros SHALL manter envio explícito, com rótulos coerentes com a ação. Seletores isolados, como Matéria na barra de Flashcards, SHALL manter seu comportamento existente.

#### Scenario: Editar filtros sem aplicar
- **WHEN** a pessoa abre Filtros em Tarefas, altera critérios, recolhe e reabre o painel
- **THEN** a lista mantém os critérios aplicados até a pessoa aplicar ou limpar os filtros.

### Requirement: Expiração de avisos transitórios
Avisos informativos transitórios disparados por uma ação SHALL ser anunciados de forma acessível e desaparecer automaticamente após 6 segundos. Um novo aviso SHALL reiniciar seu prazo. Erros que exigem ação, validações, avisos permanentes e mensagens necessárias para recuperar um fluxo SHALL permanecer disponíveis.

#### Scenario: Consultar registro sem origem
- **WHEN** a consulta confirma que o registro não tem origem Google Classroom
- **THEN** o aviso aparece e é anunciado, depois desaparece após o prazo.
