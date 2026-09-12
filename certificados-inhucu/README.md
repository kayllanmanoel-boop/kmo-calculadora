# Certificados Inhuçu Sustentável

Emissor e validador de certificados do Projeto Inhuçu Sustentável.

## Variáveis de ambiente

- `ADMIN_CNPJ` — CNPJ de login (somente números)
- `ADMIN_PASSWORD` — senha administrativa
- `SESSION_SECRET` — segredo aleatório para sessão
- `DATA_FILE` — caminho do arquivo JSON (opcional)
- `NODE_ENV=production`

## Rotas

- `/` — validação pública
- `/admin` — área de emissão
- `/validar?codigo=...` — validação pública
- `/certificado/CODIGO` — certificado imprimível/PDF
- `/health` — healthcheck

> Por padrão os registros ficam em arquivo JSON no filesystem do serviço. Faça backup pela área administrativa, especialmente antes de novos deploys.
