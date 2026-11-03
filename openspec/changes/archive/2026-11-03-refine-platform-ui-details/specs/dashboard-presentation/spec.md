## ADDED Requirements

### Requirement: Data e hora compactas da consulta
A linha abaixo da saudação SHALL apresentar somente a data e hora do instante da consulta em formato DD/MM/AAAA, HH:mm, sem segundos, prefixos de fuso ou texto explicativo. SHALL preservar o instante real e o atributo temporal acessível. A formatação SHALL manter o fuso de apresentação atualmente utilizado nessa linha; esta alteração visual não SHALL mudar o fuso de estudo ou os períodos das métricas.

#### Scenario: Consulta recebida
- **WHEN** a Dashboard recebe resumos com instante de consulta válido
- **THEN** a linha mostra, por exemplo, 03/11/2026, 19:19, sem segundos nem os textos Fuso de estudo e Resumos consultados em.

### Requirement: Hierarquia dos indicadores da Dashboard
Cada indicador SHALL exibir sua descrição em cinza legível no topo e, abaixo, o ícone e o valor com sua unidade na mesma linha. SHALL preservar os valores reais, indisponibilidade e omissão de módulos desativados.

#### Scenario: Indicadores disponíveis e indisponíveis
- **WHEN** indicadores são apresentados em ambos os temas
- **THEN** descrição antecede a linha de ícone e valor, com contraste acessível e sem transformar indisponibilidade em zero.
