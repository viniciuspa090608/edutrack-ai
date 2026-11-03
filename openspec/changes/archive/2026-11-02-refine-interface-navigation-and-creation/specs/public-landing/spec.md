## ADDED Requirements

### Requirement: Entrada animada no acesso pela landing
Ao ativar Entrar ou Criar conta na landing, o conteúdo de destino SHALL entrar com `backInLeft` uma única vez, preservando o modo login/cadastro, parâmetros e destino seguro existentes. A animação SHALL NOT repetir em mudanças de campo, feedback ou renderização e SHALL evitar flashes, cortes e bloqueios de interação. Acesso direto, recarga e alternância entre login/cadastro não SHALL simular nova chegada pela landing. Movimento reduzido SHALL desativar ou reduzir a entrada.

#### Scenario: Ações públicas
- **WHEN** a pessoa ativa Entrar ou Criar conta na landing
- **THEN** o modo correspondente de acesso aparece com uma entrada backInLeft, sem animar novamente a cada alteração do formulário.

#### Scenario: Entrada direta e movimento reduzido
- **WHEN** acesso é aberto diretamente ou a pessoa usa movimento reduzido
- **THEN** o formulário correto permanece imediatamente operável sem depender da animação.
