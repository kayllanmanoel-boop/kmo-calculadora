# KMO Gestão — Área Segura Financeira

Portal PHP + MySQL para hospedagem no cPanel/HostGator, com dois módulos integrados:

1. **Prestação de Contas** — clientes/contratos, notas fiscais, retenções, entradas, saídas, comprovantes, saldo e relatório final.
2. **Calculadora de Desconto e Soma** — cálculo de percentual, valor líquido e soma de valores adicionais.

## Segurança implementada

- Login com `password_hash` / `password_verify`.
- Sessão com expiração automática (30 min por padrão).
- Cookie `HttpOnly`, `SameSite=Lax` e `Secure` quando HTTPS está ativo.
- CSRF nos formulários de gravação.
- Consultas MySQL preparadas com PDO.
- Perfis: `admin`, `financeiro` e `consulta`.
- Registro de auditoria de acessos, lançamentos e emissão de relatórios.
- Comprovantes e notas armazenados em `storage/`, bloqueados por `.htaccess` e acessados somente por `download.php` após login.
- Redirecionamento para HTTPS via `.htaccess`.

## Instalação no HostGator / cPanel

1. Crie no cPanel um banco MySQL e um usuário MySQL com acesso ao banco.
2. Envie a pasta `area-segura` para `public_html/area-segura/`.
3. Copie `config.example.php` para `config.php`.
4. Edite `config.php` com host, nome do banco, usuário e senha.
5. Confirme que `base_url` é `/area-segura`.
6. Acesse `https://www.kmogestao.com/area-segura/setup.php`.
7. Crie o primeiro administrador.
8. Depois do primeiro acesso, **remova ou renomeie `setup.php`**.
9. Acesse `https://www.kmogestao.com/area-segura/`.

## Fluxo de prestação de contas

- Crie uma caderneta por cliente/contrato/período.
- Cadastre uma NF manualmente ou envie XML. Para XML, o sistema tenta ler número, série, data, valor e retenções comuns.
- Ao salvar a NF, o sistema calcula `líquido = bruto - retenções` e cria automaticamente a **entrada líquida**.
- Lance as **saídas manualmente**, indicando finalidade, favorecido, documento, forma de pagamento, categoria e comprovante.
- O painel mostra faturado bruto, retenções, entradas efetivas, saídas e saldo.
- O relatório mostra **de onde o dinheiro veio e para onde foi**, inclusive agrupado por categoria e favorecido.
- Use `Emitir relatório / PDF` e depois `Imprimir / Salvar em PDF` no navegador.

## Observação sobre PDF de nota fiscal

A versão segura aceita PDF como documento anexado, mas não faz OCR nem garante extração automática de dados de PDFs. Para preenchimento automático, prefira **XML da NF-e/NFS-e**. PDFs podem ser cadastrados junto com os campos digitados manualmente.

## Recomendações de produção

- Use HTTPS ativo no domínio.
- Faça backup diário do MySQL e da pasta `storage/`.
- Troque senhas periodicamente e evite compartilhar usuário entre funcionários.
- Considere mover `storage/` para fora de `public_html` se a hospedagem permitir.
