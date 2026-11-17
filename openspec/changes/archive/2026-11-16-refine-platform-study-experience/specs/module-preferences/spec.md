# Spec Delta

## ADDED Requirements

### Requirement: Preferências de Pomodoro e Relatório

A EduTrack SHALL persistir duas preferências independentes por conta, ativadas por padrão para contas novas e existentes. Desativar Pomodoro SHALL ocultá-lo da navegação e da Home e impedir seu uso direto enquanto desativado, preservando o histórico. Ocultar Relatório SHALL remover sua entrada da navegação e manter o acesso por link direto. Somente Tarefas, Matérias e Flashcards SHALL contar para o mínimo de um módulo de estudo ativo.

#### Scenario: Preferências de Pomodoro e Relatório

- **WHEN** a pessoa desativa Pomodoro e oculta Relatório, depois entra novamente
- **THEN** Pomodoro segue indisponível e Relatório segue fora da navegação, com sua rota direta disponível.

### Requirement: Grade das preferências de módulos

A Conta SHALL agrupar os dois textos explicativos existentes em um bloco e apresentar Tarefas, Matérias, Flashcards, Recursos de IA, Pomodoro e Relatório em três colunas e duas linhas quando houver espaço, reorganizando os controles em telas estreitas.

#### Scenario: Grade das preferências de módulos

- **WHEN** a pessoa abre as preferências em desktop e em 320 px
- **THEN** vê um único bloco explicativo e seis controles legíveis e operáveis, sem rolagem horizontal.
