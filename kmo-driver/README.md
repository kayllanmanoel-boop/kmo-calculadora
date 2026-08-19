# KMO Driver — Rotas Escolares

Aplicativo web/PWA da KMO Gestão para cadastro de motoristas e rotas, início/encerramento de viagens, acompanhamento georreferenciado por GPS, cálculo de quilômetros rodados, tempo, velocidade e relatórios semanais.

## Publicação

A versão principal funciona diretamente pelo GitHub Pages, no mesmo modelo da Calculadora KMO.

Endereço:

`https://kayllanmanoel-boop.github.io/kmo-calculadora/kmo-driver/`

## Fluxo do motorista

1. Cadastrar motorista/veículo uma vez.
2. Cadastrar a rota.
3. Selecionar motorista e rota.
4. Tocar em **INICIAR ROTA**.
5. Autorizar o GPS do celular.
6. Acompanhar no mapa a posição atual e o caminho já percorrido.
7. Tocar em **ENCERRAR ROTA** ao finalizar.

Não existe mais cadastro de aluno/ponto de entrega nesta versão.

## Georreferenciamento

Durante a rota o sistema registra:

- posição inicial;
- posição atual;
- trilha desenhada no mapa;
- latitude e longitude;
- precisão do GPS;
- quantidade de pontos GPS;
- velocidade aproximada;
- quilômetros percorridos;
- horário de início e fim;
- duração da rota.

O mapa utiliza Leaflet com base cartográfica OpenStreetMap.

## Central KMO

O painel administrativo possui:

- mapa de acompanhamento da rota ativa;
- motorista e rota em execução;
- quilômetros em tempo real;
- duração em tempo real;
- coordenadas e precisão atuais;
- relatórios por período;
- exportação CSV;
- backup/importação JSON;
- indicadores por motorista e por rota.

## Armazenamento desta versão

Como o GitHub Pages é uma hospedagem estática, os dados ficam no `localStorage` do navegador de cada aparelho. Assim, o mapa da Central KMO acompanha a rota ativa **no mesmo aparelho**.

Para a Central KMO acompanhar vários motoristas em tempo real a partir de outro computador/celular, será necessário conectar o front-end do GitHub Pages a um banco de dados/API online. O GitHub Pages sozinho não recebe atualizações de localização de outros aparelhos.

## PIN

PIN administrativo inicial: `2026`.

## GPS em segundo plano

Navegadores móveis podem reduzir ou suspender o GPS quando o aplicativo fica muito tempo em segundo plano ou com o celular bloqueado. Para rastreamento contínuo estilo aplicativo nativo, inclusive com tela bloqueada, será necessária uma versão Android/iOS com serviço de localização em segundo plano.
