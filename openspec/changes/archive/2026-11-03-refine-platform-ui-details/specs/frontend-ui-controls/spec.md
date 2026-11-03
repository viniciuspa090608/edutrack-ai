## ADDED Requirements

### Requirement: Menus de seleção com identidade da plataforma
Os selects de escolha única da aplicação SHALL abrir menus personalizados coerentes com tema, tipografia, bordas, cores e estados da plataforma, incluindo quando apresentados em modais. SHALL preservar rótulos acessíveis, opções, valores, escolha vazia quando existente, validações, submissão, disabled e feedback. Os menus SHALL caber na viewport desde 320 px, oferecer rolagem para listas extensas e manter seleção visível.

#### Scenario: Abrir e selecionar
- **WHEN** a pessoa abre um select e escolhe uma opção nos temas claro ou escuro
- **THEN** o menu usa a identidade visual da plataforma, mostra a seleção e atualiza o mesmo valor de domínio utilizado anteriormente.

#### Scenario: Teclado e modal
- **WHEN** a pessoa opera um select por teclado, inclusive dentro de modal
- **THEN** consegue abrir, navegar por opções, confirmar e fechar por Escape, com foco visível e retorno ao acionador, sem quebrar a contenção de foco do modal.

#### Scenario: Vazio, indisponibilidade e listas extensas
- **WHEN** o campo oferece Sem matéria, Sem tarefa ou outra opção vazia, está desabilitado ou possui muitas opções
- **THEN** a escolha vazia mantém seu significado, disabled impede alteração e a lista extensa permanece navegável sem transbordar a tela.
