# Spec Delta

## MODIFIED Requirements

### Requirement: Grade das preferências de módulos

A Conta SHALL agrupar os dois textos explicativos existentes em um bloco e apresentar Tarefas, Disciplinas, Flashcards, Pomodoro, Rotinas, Relatório e Recursos de IA na ordem da sidebar, em leitura por linha, com três colunas e linhas necessárias quando houver espaço, reorganizando os controles em telas estreitas.

#### Scenario: Grade das preferências de módulos
- **WHEN** a pessoa abre as preferências em desktop e em 320 px
- **THEN** vê um único bloco explicativo e sete controles legíveis e operáveis na ordem da sidebar, sem rolagem horizontal.

## ADDED Requirements

### Requirement: Preferência independente de Rotinas
A EduTrack SHALL persistir Rotinas como preferência independente, ativa por padrão para contas novas e existentes. Desativar SHALL ocultar a entrada na sidebar, impedir abertura direta das páginas e recusar leitura e escrita no servidor antes de consultar ou alterar rotinas. Sessões e abas abertas SHALL respeitar a preferência na próxima requisição e oferecer caminho para reativação. Reativar SHALL restaurar acesso aos mesmos dados. Rotinas SHALL NOT contar para o mínimo de um módulo entre Tarefas, Disciplinas e Flashcards, nem alterar outras preferências.

#### Scenario: Desativar e reativar
- **WHEN** a pessoa desativa Rotinas, recarrega e entra novamente
- **THEN** permanece desativada e bloqueada na navegação e API, e reativá-la restaura os dados intactos.

#### Scenario: Outra aba e falha
- **WHEN** outra aba consulta Rotinas após desativação ou o salvamento de uma preferência falha
- **THEN** o servidor aplica o estado persistido e a interface comunica o resultado real com caminho de reativação ou nova tentativa.

#### Scenario: Último módulo de estudo
- **WHEN** Tarefas é o último dos três módulos de estudo ativo e Rotinas está ativa
- **THEN** desativar Tarefas continua recusado sem alterar preferências.
