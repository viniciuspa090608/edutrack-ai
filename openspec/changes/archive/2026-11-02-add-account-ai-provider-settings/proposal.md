# Proposal

## Why

A geração de estudos está vinculada a um único provedor e credencial global. Cada pessoa precisa escolher sua IA e informar sua própria chave na conta, mantendo Gemini como padrão oferecido pela EduTrack e protegendo os segredos do projeto.

## What Changes

- Adicionar em `/conta` modo padrão EduTrack (Gemini) e modo pessoal com provedor, modelo e API key substituível e removível.
- Permitir exclusivamente Gemini (Google), Claude (Anthropic), ChatGPT (API OpenAI), DeepSeek e Kimi (Moonshot), com modelos compatíveis de catálogo mantido no servidor.
- Referenciar a chave Gemini fornecida pelo responsável somente como segredo privado de implantação, sem reproduzir seu valor em artefatos, código, exemplos ou respostas.
- Criptografar credenciais pessoais em repouso, isolar por conta e nunca devolvê-las após salvar. Mostrar apenas existência de chave configurada.
- Aplicar a seleção a roadmaps, regeneração de passos e flashcards, preservando preferências, validação de saída, prévias e confirmações.
- Limitar uso compartilhado por conta e globalmente, sem fallback silencioso entre credenciais.
- **BREAKING**: substituir o padrão implicitamente OpenAI por configuração explícita Gemini; documentar migração sem reinterpretar chaves OpenAI como Gemini.

## Capabilities

### New Capabilities

- `account-ai-settings`: configuração privada por conta, catálogo restrito e ciclo de vida da credencial pessoal.
- `ai-provider-routing`: resolução segura e execução dos cinco provedores nos fluxos existentes, com padrão Gemini.

### Modified Capabilities

- `environment-validation`: configuração explícita do padrão Gemini e criptografia dedicada para credenciais pessoais.

## Impact

Contratos em `packages/contracts`; seção em `apps/web/src/features/profile`; módulo de configuração de IA na API com controllers, services e repositories; migrations MySQL; composição em `apps/api/src/app.ts`; adaptadores e consumidores de geração. Atualizar README e `.env.example` sem valores secretos. Não inclui chat genérico, provedores adicionais, URLs arbitrárias, assinatura comercial ou alteração das regras existentes de confirmação. Esta proposta não instala nem testa a chave real; sua configuração privada fica para o apply/implantação.
