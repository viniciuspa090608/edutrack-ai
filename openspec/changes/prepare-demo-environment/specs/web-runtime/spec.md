## ADDED Requirements

### Requirement: Acesso local e LAN em porta fixa

O servidor web de desenvolvimento SHALL iniciar com --host 0.0.0.0, porta explícita 5173 e strictPort. A web SHALL permitir acesso à API e autenticação pelo computador e por endereço LAN documentado, com origens explicitamente autorizadas e cookies funcionais, preservando validação de origem e proteção de sessão em produção.

#### Scenario: Login pela rede local

- **WHEN** uma pessoa abre a web pelo IP LAN configurado e autentica um perfil
- **THEN** a sessão persiste e consultas e mutações autenticadas funcionam.

#### Scenario: Origem não autorizada

- **WHEN** uma origem não autorizada tenta executar uma mutação autenticada
- **THEN** a requisição é rejeitada sem alterar dados.

#### Scenario: Porta ocupada

- **WHEN** a porta 5173 já está ocupada ao iniciar a web
- **THEN** a inicialização falha sem trocar silenciosamente de porta.
