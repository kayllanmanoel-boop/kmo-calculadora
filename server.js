const express = require('express');
const path = require('path');
const { spawn } = require('child_process');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 80;
const CERT_PORT = 3001;

const cert = spawn(process.execPath, [path.join(__dirname, 'certificados-inhucu', 'server.js')], {
  cwd: __dirname,
  env: { ...process.env, PORT: String(CERT_PORT) },
  stdio: 'inherit'
});
cert.on('exit', code => console.error('Servico de certificados encerrado:', code));

const proxy = createProxyMiddleware({ target: `http://127.0.0.1:${CERT_PORT}`, changeOrigin: false });

app.use('/certificados', (req, res, next) => {
  req.url = req.originalUrl.replace(/^\/certificados/, '') || '/';
  proxy(req, res, next);
});
for (const prefix of ['/admin', '/validar', '/certificado']) {
  app.use(prefix, (req, res, next) => {
    req.url = req.originalUrl;
    proxy(req, res, next);
  });
}

const mounts = [
  ['/apps/recibos', 'recibos'],
  ['/apps/motorista', 'kmo-driver'],
  ['/apps/desconto', 'desconto'],
  ['/apps/quantitativo-refeicoes', 'quantitativo-refeicoes'],
  ['/apps/quiz-lobo', 'quiz-lobo'],
  ['/apps/feogia', 'feogia']
];
for (const [route, dir] of mounts) app.use(route, express.static(path.join(__dirname, dir)));

app.get('/apps/calculadora/', (req,res)=>res.sendFile(path.join(__dirname,'index.html')));
app.get('/apps/calculadora/index.html', (req,res)=>res.sendFile(path.join(__dirname,'index.html')));
app.get('/apps/calculadora/logo-kmo.png', (req,res)=>res.sendFile(path.join(__dirname,'logo-kmo.png')));
app.get('/apps/calculadora/manifest.json', (req,res)=>res.sendFile(path.join(__dirname,'manifest.json')));
app.get('/apps/calculadora/sw.js', (req,res)=>res.sendFile(path.join(__dirname,'sw.js')));
app.get('/apps/logo-kmo.png', (req,res)=>res.sendFile(path.join(__dirname,'logo-kmo.png')));
app.get('/logo-kmo.png', (req,res)=>res.sendFile(path.join(__dirname,'logo-kmo.png')));

app.use(express.static(path.join(__dirname,'central-kmo')));
app.get('*', (req,res)=>res.sendFile(path.join(__dirname,'central-kmo','index.html')));

process.on('SIGTERM',()=>{ cert.kill('SIGTERM'); process.exit(0); });
process.on('SIGINT',()=>{ cert.kill('SIGINT'); process.exit(0); });

app.listen(PORT,()=>console.log(`Central KMO rodando na porta ${PORT}; certificados em /certificados`));
