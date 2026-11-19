# Spec Delta

## MODIFIED Requirements

### Requirement: Identidade estável por conquista
Cada conquista do catálogo SHALL possuir uma cor de destaque diferente das demais e identidade consistente entre o mural Progresso e sua prévia no Dashboard. A associação SHALL permanecer estável após recarga, mudança de ordem e alternância de tema, com ajustes de contraste por tema. A cor SHALL complementar ícone, nome, critério e estado textual, preservando concessão oficial, progresso parcial, pendência e legibilidade de conquistas bloqueadas.

#### Scenario: Comparar superfícies
- **WHEN** a pessoa consulta uma conquista no Dashboard e em Progresso
- **THEN** reconhece o mesmo ícone e a mesma identidade de cor em ambas.

#### Scenario: Alternância de tema
- **WHEN** alterna entre claro e escuro ou recebe o catálogo em outra ordem
- **THEN** as cores continuam associadas às mesmas conquistas com contraste legível e estados identificáveis sem depender da cor.

Borda, ícone e preenchimento da barra de cada card em Progresso SHALL aplicar a cor da medalha correspondente no Dashboard: primeiro dia verde, três dias âmbar, sete dias lilás, dez tarefas azul, cinco blocos Pomodoro rosa, vinte revisões ciano e cinco marcos de disciplinas magenta, com ajustes de contraste por tema.

#### Scenario: Paleta no mural
- **WHEN** o catálogo aparece após acesso direto ou recarga
- **THEN** os cards usam efetivamente as cores das medalhas na borda, ícone e barra, preservando estados textuais e legibilidade.
