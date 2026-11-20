# Tasks

## 1. Regularização documental

- [x] 1.1 Registrar estado Git e alterações preexistentes e conferir que a branch própria contém somente .env.example, AGENTS.md e README.md modificados pelo pedido de URLs.
- [x] 1.2 Conferir os três callbacks autorizados nos documentos e a origem local 3001; preservar derivação por API_PUBLIC_ORIGIN e produção HTTPS, verificando o diff e os serviços OAuth existentes.
- [x] 1.3 Preparar os artefatos documentais com skip_specs e manifesto de paths explícitos com sync vazio; verificar status OpenSpec e preservar mudanças históricas.
- [x] 1.4 Executar a normalização de formatação autorizada pelo usuário e revisar o diff; verificar que a normalização de finais de linha não introduziu alterações funcionais nem novos arquivos versionáveis fora do manifesto.

## 2. Validação e conclusão

- [x] 2.1 Aprovar pnpm lint, pnpm typecheck, pnpm test e pnpm build; registrar os resultados reais, usando MySQL real isolado para os testes de banco.
- [x] 2.2 Preparar a conclusão com manifesto explícito, revisar o diff staged e aprovar git diff --cached --check e openspec:finish --inspect; a execução final de openspec:finish deverá validar novamente os checks, criar o commit e archive únicos e permitir integração em master por fast-forward, sem push.
