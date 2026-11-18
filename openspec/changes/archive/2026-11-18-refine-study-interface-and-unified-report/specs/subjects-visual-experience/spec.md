## ADDED Requirements

### Requirement: Busca de disciplinas na mesma linha das ações
Em largura suficiente, a listagem SHALL apresentar Buscar por nome, Aplicar filtros e Limpar filtros na mesma linha, com o input mais largo que cada botão. Em telas estreitas SHALL reorganizar os controles sem overflow, preservando labels, submissão explícita, limpeza e paginação existentes.

#### Scenario: Filtro em desktop
- **WHEN** a pessoa expande Filtros na listagem em desktop
- **THEN** campo e dois botões aparecem em uma linha e o campo ocupa a maior largura.

#### Scenario: Filtro em tela estreita
- **WHEN** a listagem é aberta em 320 px
- **THEN** os controles quebram de linha e continuam utilizáveis por teclado.

### Requirement: Percentual nos cards de disciplinas
Cada card da listagem SHALL mostrar o percentual oficial dos estudos da disciplina correspondente, com rótulo acessível e formatação que não anuncie conclusão parcial como 0% ou 100%. Ausência de base de cálculo SHALL ser indicada como progresso não calculável, distinta de zero confirmado.

#### Scenario: Disciplinas com progresso diferente
- **WHEN** duas disciplinas retornam 25% e 75%
- **THEN** seus cards mostram os respectivos valores sem reutilizar o percentual da disciplina destacada.

#### Scenario: Disciplina sem itens de estudo
- **WHEN** a disciplina não possui itens na fonte oficial de progresso
- **THEN** seu card indica progresso não calculável sem inventar percentual.

### Requirement: Detalhes exclusivos da disciplina selecionada
Ao abrir detalhes, a interface SHALL mostrar somente a disciplina selecionada e seus roadmaps, plano e registros vinculados, ocultando filtros, listagem geral e paginação da coleção. Voltar SHALL ficar à direita na mesma linha do nome da disciplina quando houver espaço, com quebra acessível em telas estreitas. Retornar SHALL restaurar critérios, página e foco de origem quando ainda disponível, preservando links diretos e âncoras existentes.

#### Scenario: Abrir e retornar
- **WHEN** a pessoa abre uma disciplina a partir de uma lista filtrada
- **THEN** vê somente seu detalhe sem filtros ou cards de outras disciplinas e Voltar restaura a lista anterior.

#### Scenario: Acesso contextual
- **WHEN** abre um link do Dashboard com disciplina e roadmap específicos
- **THEN** somente a disciplina e seus dados relacionados são exibidos e a âncora continua funcional.


## MODIFIED Requirements

### Requirement: Apresentação subordinada aos dados reais

A interface SHALL apresentar somente dados reais obtidos pelos fluxos atuais e SHALL preservar validações, operações de escrita e campos existentes da API, permitindo acrescentar à listagem o resumo oficial de progresso descrito em Percentual nos cards de disciplinas. Elementos do Stitch sem campo, rota ou comportamento implementado SHALL ser omitidos ou adaptados a informações existentes com rótulos semanticamente corretos. A atualização SHALL NOT introduzir mocks em runtime, dados acadêmicos fictícios, funcionalidades ou consultas adicionais sem requisito funcional para preencher o protótipo.

#### Scenario: Card com dados reais
- **WHEN** a API retorna uma matéria com nome, nível, objetivo, prazo, horas semanais e assuntos conhecidos
- **THEN** sua apresentação utiliza esses dados sem inventar professor, créditos, média, frequência ou recomendações de IA.

#### Scenario: Disponibilidade e registros recentes
- **WHEN** a pessoa consulta horas semanais e registros vinculados recentes
- **THEN** horas declaradas não são rotuladas como tempo estudado e uma página de registros não é apresentada como total global ou contagem de pendências.
