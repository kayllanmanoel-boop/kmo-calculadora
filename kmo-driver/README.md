# KMO Driver — Rotas Escolares

Sistema da KMO Gestão para cadastro de motoristas, ativação de rotas escolares, registro de GPS, cálculo de quilômetros rodados, tempo de execução, entregas de alunos e relatórios semanais.

## Estrutura de implantação

O aplicativo possui backend Python e banco SQLite. Por isso, o GitHub é usado como repositório do código, enquanto a execução pública deve ocorrer em um serviço com servidor e HTTPS, como Railway ou Render.

## Railway

O repositório já possui `railway.toml` na raiz e `kmo-driver/Dockerfile`. O Dockerfile inicia o pacote do KMO Driver e o Railway verifica a saúde em `/api/health`.

Configuração recomendada:
- Variável `KMO_ADMIN_PIN`: PIN administrativo forte.
- Variável `KMO_DB`: `/data/kmo_rotas.db`.
- Volume persistente montado em `/data`.
- Domínio HTTPS público gerado pelo Railway.

## Recursos

- Cadastro de motorista e veículo.
- Cadastro de rotas, alunos e pontos de entrega.
- Ativação e encerramento de rota.
- GPS contínuo.
- Cálculo da quilometragem percorrida.
- Registro de entrega de alunos com horário e coordenadas.
- Tempo total por execução.
- Relatório semanal por motorista e rota.
- Exportação CSV.
- PWA instalável no celular.

## Segurança

O PIN inicial de desenvolvimento é `2026`. Antes do uso em produção, defina a variável `KMO_ADMIN_PIN` no serviço de hospedagem e utilize outro PIN.
