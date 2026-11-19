# Spec Delta

## ADDED Requirements

### Requirement: Posição estável da ação de impressão
Imprimir relatório SHALL ocupar sua posição definitiva desde a primeira renderização em Progresso e Estatísticas, ao recarregar e alternar abas. Em desktop SHALL permanecer à direita do título como na referência; em telas estreitas SHALL adotar quebra responsiva estável. Carregamento, logo, erro e motivos de bloqueio SHALL NOT deslocar momentaneamente o botão. SHALL preservar os gates, motivos acessíveis e impressão unificada existentes.

#### Scenario: Rede lenta e navegação
- **WHEN** a pessoa recarrega ou alterna abas com fontes e logo ainda carregando
- **THEN** o botão já ocupa o alinhamento final e permanece nele ao concluir ou falhar o carregamento.

#### Scenario: Tela estreita
- **WHEN** a página abre em 320 px
- **THEN** título, botão e motivo de indisponibilidade ficam legíveis e estáveis sem overflow horizontal.
