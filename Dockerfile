FROM caddy:2-alpine

COPY central-kmo/index.html /usr/share/caddy/index.html
COPY central-kmo/styles.css /usr/share/caddy/styles.css
COPY central-kmo/app.js /usr/share/caddy/app.js
COPY logo-kmo.png /usr/share/caddy/logo-kmo.png

COPY index.html /usr/share/caddy/apps/calculadora/index.html
COPY logo-kmo.png /usr/share/caddy/apps/calculadora/logo-kmo.png
COPY manifest.json /usr/share/caddy/apps/calculadora/manifest.json
COPY sw.js /usr/share/caddy/apps/calculadora/sw.js

COPY logo-kmo.png /usr/share/caddy/apps/logo-kmo.png
COPY recibos /usr/share/caddy/apps/recibos
COPY kmo-driver /usr/share/caddy/apps/motorista
COPY desconto /usr/share/caddy/apps/desconto
COPY quantitativo-refeicoes /usr/share/caddy/apps/quantitativo-refeicoes
COPY quiz-lobo /usr/share/caddy/apps/quiz-lobo
COPY feogia /usr/share/caddy/apps/feogia

EXPOSE 80
