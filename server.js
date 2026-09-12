const express = require('express');
const path = require('path');
const crypto = require('crypto');
const http = require('http');
const { spawn } = require('child_process');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 80;
const CERT_PORT = 3001;
const ADMIN_CNPJ = (process.env.ADMIN_CNPJ || '34655687000115').replace(/\D/g,'');
const PASSWORD_SALT_HEX = '6a38deeb9d2445c052a8cb49544a36a5';
const PASSWORD_SCRYPT_HEX = '20a698009984d1a5c091aba593a0e208fef6c83750e0e252943b9732efcebf96';
const INTERNAL_CERT_PASSWORD = 'kmo-internal-cert-bridge-v1';

const cert = spawn(process.execPath, [path.join(__dirname, 'certificados-inhucu', 'server.js')], {
  cwd: __dirname,
  env: { ...process.env, PORT: String(CERT_PORT), ADMIN_PASSWORD: INTERNAL_CERT_PASSWORD },
  stdio: 'inherit'
});
cert.on('exit', code => console.error('Servico de certificados encerrado:', code));

const proxy = createProxyMiddleware({ target: `http://127.0.0.1:${CERT_PORT}`, changeOrigin: false });
const loginParser = express.urlencoded({ extended: false, limit: '50kb' });

function verifyPassword(value){
  try{
    const derived = crypto.scryptSync(String(value || ''), Buffer.from(PASSWORD_SALT_HEX,'hex'), 32, {N:16384,r:8,p:1,maxmem:64*1024*1024});
    return crypto.timingSafeEqual(derived, Buffer.from(PASSWORD_SCRYPT_HEX,'hex'));
  }catch{return false;}
}

app.post('/admin/login', loginParser, (req,res) => {
  const cnpjOk = String(req.body.cnpj || '').replace(/\D/g,'') === ADMIN_CNPJ;
  const passOk = verifyPassword(req.body.password);
  if(!cnpjOk || !passOk) return res.redirect('/admin?erro=1');

  const body = new URLSearchParams({ cnpj: ADMIN_CNPJ, password: INTERNAL_CERT_PASSWORD }).toString();
  const internal = http.request({
    host:'127.0.0.1', port:CERT_PORT, path:'/admin/login', method:'POST',
    headers:{'content-type':'application/x-www-form-urlencoded','content-length':Buffer.byteLength(body)}
  }, r => {
    if(r.headers['set-cookie']) res.setHeader('set-cookie', r.headers['set-cookie']);
    if(r.headers.location) res.setHeader('location', r.headers.location);
    res.status(r.statusCode || 302);
    r.pipe(res);
  });
  internal.on('error',()=>res.status(503).send('Serviço de certificados temporariamente indisponível.'));
  internal.end(body);
});

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
