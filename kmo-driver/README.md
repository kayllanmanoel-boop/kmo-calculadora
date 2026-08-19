# KMO Driver — Rotas Escolares

Aplicativo web/PWA da KMO Gestão para cadastro de motoristas, rotas escolares, alunos/pontos de entrega, GPS, cálculo de quilômetros rodados, tempo de execução e relatórios semanais.

## Publicação

A versão principal funciona diretamente pelo GitHub Pages, no mesmo modelo da Calculadora KMO. Os arquivos públicos são:

- `index.html` — interface do aplicativo;
- `styles.css` — layout responsivo para celular e computador;
- `app.js` — cadastros, GPS, cálculo de distância e relatórios;
- `manifest.json` — instalação como PWA;
- `sw.js` — cache e funcionamento offline.

Endereço esperado no GitHub Pages:

`https://kayllanmanoel-boop.github.io/kmo-calculadora/kmo-driver/`

## Recursos

- Cadastro de motorista, CNH, telefone, veículo, placa e capacidade;
- Cadastro de rotas e quilometragem prevista;
- Cadastro de alunos e pontos de entrega com coordenadas;
- Uso da localização atual para cadastrar ponto;
- Ativação e encerramento de rota;
- GPS contínuo enquanto o aplicativo está ativo;
- Filtro de precisão e saltos anormais de GPS;
- Cálculo da quilometragem efetivamente percorrida;
- Cronômetro de duração da rota;
- Registro da entrega do aluno com data, hora, latitude, longitude e precisão;
- Navegação até o ponto pelo Google Maps;
- Painel administrativo protegido por PIN local;
- Relatório semanal com motorista, rota, início, fim, duração, km e entregas;
- Valor padrão por quilômetro e cálculo no CSV;
- Exportação CSV;
- Backup e importação JSON;
- PWA instalável no celular;
- Cache para abertura offline.

## Armazenamento desta versão

Como o GitHub Pages é uma hospedagem estática, os dados desta versão ficam no `localStorage` do navegador de cada aparelho. O backup JSON permite guardar ou transferir os registros entre aparelhos.

Para uma central KMO receber automaticamente dados de vários motoristas em tempo real, é necessário acrescentar um banco de dados/API externa. Isso não pode ser feito somente pelo GitHub Pages sem expor credenciais.

## PIN

PIN administrativo inicial: `2026`.

O PIN pode ser alterado no painel administrativo. Na versão estática, ele é uma proteção local de interface, não substitui autenticação de servidor.

## GPS em segundo plano

Navegadores móveis podem reduzir ou suspender o GPS quando o aplicativo fica muito tempo em segundo plano ou com o celular bloqueado. Para rastreamento contínuo no estilo aplicativo nativo, inclusive com tela bloqueada, será necessária uma versão Android/iOS com serviço de localização em segundo plano.
