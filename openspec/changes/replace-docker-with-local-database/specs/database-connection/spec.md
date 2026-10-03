# Spec Delta

## ADDED Requirements

### Requirement: Desenvolvimento com MySQL local sem Docker
O projeto SHALL documentar e permitir inicialização da API, execução de migrations e testes usando MySQL local sem Docker ou Docker Compose. A configuração SHALL usar variáveis de ambiente, com exemplo de host `localhost`, porta `3306`, usuário `root`, `DB_NAME` e `TEST_DB_NAME` distintos e `DB_PASSWORD` vazio para preenchimento privado. Credenciais reais MUST permanecer fora de arquivos versionados.

#### Scenario: Preparação local
- **WHEN** a pessoa configura a senha no ambiente privado, cria os bancos documentados e disponibiliza MySQL local
- **THEN** os comandos de migrations e a API usam essa conexão sem iniciar containers
- **AND** testes usam banco real isolado e podem criar e remover seus bancos temporários.

#### Scenario: Exemplo sem segredo
- **WHEN** a pessoa copia `.env.example`
- **THEN** encontra as variáveis necessárias sem senha real
- **AND** precisa preencher a senha antes de iniciar a API, preservando a validação de configuração.

### Requirement: Serviços auxiliares sem Docker
O projeto SHALL disponibilizar instruções para SMTP local nativo ou provedor configurado sem Docker, preservando entrega pelo worker e configurações de e-mail existentes. Comandos ativos de desenvolvimento e qualidade MUST funcionar sem Docker e sem referências a arquivos removidos.

#### Scenario: E-mail local
- **WHEN** a pessoa inicia Mailpit nativo nas portas SMTP e de interface documentadas e executa o worker com ambiente válido
- **THEN** pode receber mensagens de teste na caixa local sem Docker Compose.

#### Scenario: Verificações após remoção
- **WHEN** a pessoa executa os comandos de qualidade com dependências e ambiente válidos
- **THEN** nenhum comando exige Docker ou procura o arquivo Compose removido.
