# Spec Delta

## Purpose

Permitir a importação conferida de cartões CSV ou TSV para um baralho próprio, com limites claros, deduplicação previsível e relatório dos resultados sem depender de IA.

## ADDED Requirements

### Requirement: Validar arquivo e destino
A EduTrack SHALL aceitar importação para um baralho próprio de arquivo CSV ou TSV em UTF-8, com cabeçalho, tamanho máximo de 2 MiB (2.097.152 bytes) e até 1.000 registros não vazios após o cabeçalho. CSV SHALL usar vírgula e TSV tabulação; campos entre aspas, delimitadores e quebras de linha dentro de aspas SHALL ser interpretados corretamente. Arquivo vazio, codificação inválida, estrutura de aspas inválida, formato diferente, tamanho ou quantidade acima do limite SHALL ser recusados antes de criar cartões. Um baralho alheio ou inexistente SHALL aparecer como não encontrado.

#### Scenario: CSV válido
- **WHEN** o usuário envia a um baralho próprio CSV UTF-8 com cabeçalho e campos entre aspas contendo vírgulas
- **THEN** a EduTrack reconhece as colunas e permite mapear os cartões sem salvar nenhum ainda.

#### Scenario: Limite excedido
- **WHEN** o arquivo excede 2 MiB ou contém mais de 1.000 registros não vazios
- **THEN** a importação é recusada com indicação do limite e nenhum cartão é criado.

#### Scenario: Baralho alheio
- **WHEN** um usuário tenta importar para ID de baralho de outra conta
- **THEN** a operação retorna não encontrado sem expor o baralho.

### Requirement: Mapear e pré-visualizar antes da gravação
O usuário SHALL selecionar duas colunas distintas do cabeçalho, uma para frente e outra para verso. A EduTrack SHALL apresentar uma amostra de até 20 linhas e os totais previstos de importação, duplicatas ignoradas e linhas rejeitadas, com motivos e números das linhas rejeitadas, antes de permitir confirmação. Cabeçalhos duplicados SHALL ser distinguidos por posição. Trocar o mapeamento SHALL recalcular a pré-visualização. Cancelar SHALL descartar a tentativa sem salvar cartões.

#### Scenario: Mapeamento de colunas invertidas
- **WHEN** o usuário mapeia a segunda coluna como frente e a primeira como verso
- **THEN** a amostra e as contagens previstas usam essa ordem e aguardam confirmação.

#### Scenario: Mesmo campo nos dois lados
- **WHEN** o usuário escolhe a mesma coluna para frente e verso
- **THEN** a pré-visualização não pode ser confirmada e nenhum cartão é salvo.

### Requirement: Ignorar duplicatas e rejeitar linhas inválidas
Frente e verso SHALL seguir os limites de texto dos cartões manuais. Para deduplicar dentro do baralho, a comparação SHALL usar o par frente/verso após aparar espaços externos, normalizar Unicode para NFC e converter caixa, preservando o texto original aparado no cartão salvo. A primeira ocorrência válida do arquivo SHALL prevalecer; ocorrências posteriores e pares já existentes no baralho SHALL ser ignorados. Linhas com frente ou verso vazio, campo acima do limite ou quantidade de colunas incompatível SHALL ser rejeitadas com motivo. Cabeçalho e linhas totalmente vazias SHALL ficar fora das três contagens.

#### Scenario: Duplicata interna e no baralho
- **GIVEN** um par frente/verso já existente no baralho
- **WHEN** o arquivo contém esse par e duas ocorrências de outro par, com diferenças apenas de espaços externos ou caixa
- **THEN** o par existente e a segunda ocorrência do novo par são ignorados, e somente a primeira ocorrência nova é importável.

#### Scenario: Linha inválida
- **WHEN** uma linha contém frente vazia ou número incorreto de colunas
- **THEN** a linha é rejeitada com número e motivo e não impede a importação das demais linhas válidas.

### Requirement: Confirmar e relatar resultado efetivo
Somente uma confirmação explícita SHALL gravar os cartões válidos da pré-visualização no baralho. A confirmação SHALL revalidar propriedade e preferência do módulo, evitar importação repetida pela mesma tentativa e devolver contagens efetivas de `importados`, `ignorados` e `rejeitados`, cuja soma SHALL igualar os registros não vazios. Duplicatas surgidas no baralho após a pré-visualização SHALL entrar em `ignorados` no resultado efetivo. Falha de gravação SHALL não deixar importação parcial e SHALL permitir conhecer o estado final antes de tentar novamente.

#### Scenario: Confirmação após pré-visualização
- **WHEN** o proprietário confirma uma tentativa válida
- **THEN** só os cartões válidos e não duplicados são salvos e o resultado mostra as três contagens efetivas.

#### Scenario: Confirmação repetida
- **WHEN** a mesma confirmação é enviada duas vezes, inclusive após perda da primeira resposta
- **THEN** nenhum cartão é duplicado e ambas as consultas retornam o mesmo resultado final.

#### Scenario: Duplicata concorrente
- **GIVEN** outro cartão igual foi adicionado ao baralho depois da pré-visualização
- **WHEN** o usuário confirma
- **THEN** o cartão passa a constar como ignorado e as contagens finais refletem o banco no momento da confirmação.

### Requirement: Importar sem IA e com controle de preferência
O fluxo SHALL funcionar sem serviço de IA. Quando o módulo de flashcards estiver desativado, a entrada de importação SHALL desaparecer da interface e suas operações SHALL ser bloqueadas pela API sem apagar cartões ou tentativas já concluídas. Cada usuário SHALL ver apenas suas próprias tentativas e resultados.

#### Scenario: IA desativada
- **GIVEN** IA desativada e flashcards ativados
- **WHEN** o usuário importa um arquivo válido
- **THEN** o fluxo completo funciona sem chamada de IA.

#### Scenario: Flashcards desativados antes da confirmação
- **GIVEN** uma pré-visualização criada
- **WHEN** o usuário desativa flashcards e tenta confirmar
- **THEN** a confirmação é recusada sem criar cartões.

### Requirement: Interface acessível da importação
O fluxo SHALL apresentar carregamento, erro, pré-visualização e resultado com rótulos e mensagens compreensíveis, operar por teclado e caber em 320 px sem rolagem horizontal causada pelo layout. O usuário SHALL poder voltar ao mapeamento ou cancelar antes de confirmar.

#### Scenario: Conferência por teclado
- **WHEN** o usuário seleciona arquivo, mapeia colunas, examina rejeições e confirma por teclado em 320 px
- **THEN** todos os controles e as contagens permanecem legíveis e operáveis.
