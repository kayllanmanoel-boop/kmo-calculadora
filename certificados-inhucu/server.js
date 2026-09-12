const express = require('express');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');

const app = express();
app.set('trust proxy', 1);
app.use(express.urlencoded({ extended: false, limit: '1mb' }));
app.use(express.json({ limit: '1mb' }));

const PORT = process.env.PORT || 3000;
const ADMIN_CNPJ = (process.env.ADMIN_CNPJ || '34655687000115').replace(/\D/g, '');
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
const DATA_FILE = process.env.DATA_FILE || path.join(__dirname, 'data', 'certificates.json');

const sessions = new Map();
const loginAttempts = new Map();

function logo(size=108){
  return `<svg width="${size}" height="${size}" viewBox="0 0 120 120" role="img" aria-label="Inhuçu Sustentável">
  <circle cx="60" cy="60" r="54" fill="#0f5b2c"/><circle cx="60" cy="60" r="39" fill="#fff"/>
  <path d="M60 12a48 48 0 0 1 40 20" fill="none" stroke="#83b72a" stroke-width="10"/>
  <path d="M96 23l11 13-17 3z" fill="#83b72a"/>
  <path d="M37 72c8-24 20-31 23-31 11 1 20 9 25 24-9-6-17-7-24-2-7 5-12 11-24 9z" fill="#83b72a"/>
  <text x="60" y="33" text-anchor="middle" font-family="Georgia,serif" font-weight="700" font-size="13" fill="#0f5b2c">INHUÇU</text>
  <text x="60" y="91" text-anchor="middle" font-family="Georgia,serif" font-weight="700" font-size="10" fill="#0f5b2c">SUSTENTÁVEL</text>
  </svg>`;
}
function ensureData(){fs.mkdirSync(path.dirname(DATA_FILE),{recursive:true});if(!fs.existsSync(DATA_FILE))fs.writeFileSync(DATA_FILE,JSON.stringify({certificates:[]},null,2));}
function loadData(){ensureData();try{return JSON.parse(fs.readFileSync(DATA_FILE,'utf8'));}catch{return {certificates:[]};}}
function saveData(data){ensureData();const t=DATA_FILE+'.tmp';fs.writeFileSync(t,JSON.stringify(data,null,2));fs.renameSync(t,DATA_FILE);}
function esc(v=''){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function onlyDigits(v=''){return String(v).replace(/\D/g,'');}
function fmtCPF(v=''){const d=onlyDigits(v);return d.length===11?d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/,'$1.$2.$3-$4'):v;}
function fmtCNPJ(v=''){const d=onlyDigits(v);return d.length===14?d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,'$1.$2.$3/$4-$5'):v;}
function cookies(req){const o={};(req.headers.cookie||'').split(';').forEach(p=>{const i=p.indexOf('=');if(i>-1)o[p.slice(0,i).trim()]=decodeURIComponent(p.slice(i+1));});return o;}
function sign(v){return crypto.createHmac('sha256',SESSION_SECRET).update(v).digest('hex');}
function newSession(res){const id=crypto.randomBytes(24).toString('hex');sessions.set(id,{createdAt:Date.now()});const tok=id+'.'+sign(id);res.setHeader('Set-Cookie',`kmo_session=${encodeURIComponent(tok)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=28800${process.env.NODE_ENV==='production'?'; Secure':''}`);}
function isAuth(req){const tok=cookies(req).kmo_session;if(!tok)return false;const [id,sig]=tok.split('.');if(!id||!sig)return false;try{if(!crypto.timingSafeEqual(Buffer.from(sig),Buffer.from(sign(id))))return false;}catch{return false;}const s=sessions.get(id);return !!s&&Date.now()-s.createdAt<28800000;}
function requireAuth(req,res,next){if(!isAuth(req))return res.redirect('/admin');next();}
function certCode(){return `KMO-IS-${new Date().getFullYear()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;}
function authHash(c){return crypto.createHash('sha256').update([c.code,c.name,c.cpf,c.activity,c.hours,c.period,c.issuedAt,SESSION_SECRET].join('|')).digest('hex').slice(0,20).toUpperCase();}
function baseUrl(req){return `${req.protocol}://${req.get('host')}`;}

const CSS=`
:root{--green:#0f5b2c;--lime:#83b72a;--lav:#b7b8e8;--softgreen:#c8dfb2;--pink:#dda3cc;--peach:#f3bda0;--ink:#242424}
*{box-sizing:border-box}body{margin:0;font-family:Arial,Helvetica,sans-serif;background:#f4f4f4;color:var(--ink)}a{color:var(--green)}
.wrap{max-width:1080px;margin:auto;padding:28px 18px}.card{background:#fff;border-radius:18px;box-shadow:0 10px 32px #0001;padding:26px;margin-bottom:20px}
.brand{display:flex;gap:18px;align-items:center}.brand h1{margin:0;color:var(--green);font-size:28px}.muted{color:#666}.grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}.full{grid-column:1/-1}
label{display:block;font-weight:700;font-size:14px;margin:4px 0 7px}input,textarea{width:100%;padding:12px 13px;border:1px solid #c8c8c8;border-radius:10px;font:inherit}
button,.btn{display:inline-block;border:0;border-radius:10px;padding:12px 18px;font-weight:700;text-decoration:none;cursor:pointer;background:var(--green);color:#fff}.btn.alt{background:#444}.btn.warn{background:#9d2f2f}
.actions{display:flex;flex-wrap:wrap;gap:10px;align-items:center}.notice{padding:12px 14px;background:#eef8ef;border-left:5px solid var(--green);border-radius:10px}.error{padding:12px 14px;background:#fff0f0;border-left:5px solid #b40000;border-radius:10px}
.hero{background:linear-gradient(135deg,var(--green),#154f2d);color:#fff;border-radius:22px;padding:34px;display:grid;grid-template-columns:1fr 180px;gap:18px;align-items:center}.hero h1{font-size:34px;margin:0 0 10px}.hero p{line-height:1.55}.hero svg{justify-self:end}.badges{display:flex;gap:8px;flex-wrap:wrap}.badge{background:#ffffff2b;border-radius:999px;padding:7px 10px;font-size:13px}
.tablewrap{overflow:auto}table{width:100%;border-collapse:collapse}th,td{padding:10px;border-bottom:1px solid #e4e4e4;text-align:left;font-size:14px}th{background:#f0f0f0}
.cert-page{width:297mm;min-height:210mm;margin:18px auto;background:white;padding:12mm 14mm}.cert-frame{min-height:184mm;border:3px solid var(--green);outline:1px solid var(--lime);outline-offset:5px;padding:9mm 13mm;position:relative}
.cert-top{display:flex;justify-content:space-between;align-items:flex-start}.issuer{text-align:right;font-size:9pt;color:#555}.cert-title{text-align:center;font-size:28pt;letter-spacing:2px;color:var(--green);font-weight:800;margin:1mm 0 4mm}.cert-sub{text-align:center;font-size:12pt;color:#555;margin-bottom:6mm}
.cert-text{font-family:Georgia,serif;font-size:14.5pt;line-height:1.58;text-align:center;margin:3mm 8mm}.cert-name{font-size:24pt;font-weight:700;border-bottom:2px solid var(--green);display:inline-block;padding:0 7mm 2mm}
.cert-meta{display:grid;grid-template-columns:1fr 1fr;gap:4mm 9mm;margin:6mm 17mm 0;font-size:10.5pt}.meta{border-radius:8px;padding:3mm 4mm}.meta:nth-child(1){background:var(--lav)}.meta:nth-child(2){background:var(--softgreen)}.meta:nth-child(3){background:var(--pink)}.meta:nth-child(4){background:var(--peach)}
.cert-bottom{display:grid;grid-template-columns:1fr 32mm;gap:8mm;align-items:end;margin:7mm 12mm 0}.signature{text-align:center}.sigline{border-top:1px solid #333;padding-top:2mm;font-size:10pt}.qr{text-align:center;font-size:7.2pt}.qr img{width:28mm}.inst{text-align:center;font-size:8pt;color:#555;margin-top:5mm}.disclaimer{text-align:center;font-size:7pt;color:#777;margin-top:3mm}
@media(max-width:760px){.grid,.hero{grid-template-columns:1fr}.hero svg{justify-self:start}.cert-page{zoom:.45}}
@media print{body{background:#fff}.no-print{display:none!important}.cert-page{margin:0;border:0;width:297mm;height:210mm;min-height:210mm}.cert-frame{min-height:184mm}@page{size:A4 landscape;margin:0}}
`;
function layout(title,body){return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><style>${CSS}</style></head><body>${body}</body></html>`;}

app.get('/health',(req,res)=>res.json({ok:true}));

app.get('/',(req,res)=>res.send(layout('Certificados | Inhuçu Sustentável',`
<div class="wrap">
<section class="hero"><div><h1>Certificados — Inhuçu Sustentável</h1><p>Emissão e validação de certificados do Projeto Inhuçu Sustentável. Empresa certificadora: <b>KMO Gestão LTDA – EPP</b>, CNPJ ${fmtCNPJ('34655687000115')}.</p><div class="badges"><span class="badge">Código de autenticidade</span><span class="badge">Validação pública</span><span class="badge">PDF por impressão</span></div></div>${logo(150)}</section>
<div class="card"><h2>Validar certificado</h2><form action="/validar" method="get" class="grid"><div class="full"><label>Código do certificado</label><input name="codigo" placeholder="Ex.: KMO-IS-2026-..." required></div><div class="full actions"><button>Validar</button><a class="btn alt" href="/admin">Área de emissão</a></div></form></div>
<div class="card"><div class="brand">${logo(92)}<div><h1>Projeto Inhuçu Sustentável</h1><p class="muted">Identidade visual inspirada no cronograma estratégico do projeto: lilás, verde, rosa e laranja.</p></div></div></div>
</div>`)));

app.get('/admin',(req,res)=>{
 if(!isAuth(req))return res.send(layout('Área de emissão',`<div class="wrap"><div class="card" style="max-width:540px;margin:55px auto"><div class="brand">${logo(88)}<div><h1>Área de emissão</h1><p class="muted">Acesso da KMO Gestão.</p></div></div>${req.query.erro?'<div class="error">CNPJ ou senha incorretos.</div>':''}<form action="/admin/login" method="post"><label>CNPJ</label><input name="cnpj" required><label style="margin-top:14px">Senha</label><input type="password" name="password" required><div class="actions" style="margin-top:18px"><button>Entrar</button><a class="btn alt" href="/">Voltar</a></div></form></div></div>`));
 const data=loadData();const rows=data.certificates.slice().reverse().slice(0,100).map(c=>`<tr><td>${esc(c.code)}</td><td>${esc(c.name)}</td><td>${esc(fmtCPF(c.cpf))}</td><td>${esc(c.activity)}</td><td>${esc(c.issuedAt)}</td><td><a target="_blank" href="/certificado/${encodeURIComponent(c.code)}">Abrir</a></td></tr>`).join('');
 res.send(layout('Emitir certificado',`<div class="wrap"><div class="card"><div class="brand">${logo(88)}<div><h1>Emissor de Certificados</h1><p class="muted">KMO Gestão LTDA – EPP • CNPJ ${fmtCNPJ('34655687000115')}</p></div></div></div>
 <div class="card"><h2>Novo certificado</h2><form action="/admin/emitir" method="post" class="grid">
 <div><label>Nome completo</label><input name="name" required></div><div><label>CPF</label><input name="cpf" inputmode="numeric" required></div>
 <div class="full"><label>Atividade / formação</label><input name="activity" value="Formação em Coleta Seletiva e Gestão de Resíduos — Projeto Inhuçu Sustentável" required></div>
 <div><label>Carga horária</label><input name="hours" placeholder="Ex.: 8 horas" required></div><div><label>Período</label><input name="period" placeholder="Ex.: 14/09/2026 a 21/09/2026" required></div>
 <div><label>Local</label><input name="location" value="Inhuçu — São Benedito/CE" required></div><div><label>Data de emissão</label><input type="date" name="issuedAt" value="${new Date().toISOString().slice(0,10)}" required></div>
 <div class="full"><label>Observação (opcional)</label><textarea name="notes" rows="2"></textarea></div><div class="full actions"><button>Emitir certificado</button><a class="btn alt" href="/admin/export">Baixar backup</a><a class="btn warn" href="/admin/logout">Sair</a></div></form></div>
 <div class="card"><h2>Certificados emitidos</h2><div class="tablewrap"><table><thead><tr><th>Código</th><th>Nome</th><th>CPF</th><th>Atividade</th><th>Emissão</th><th></th></tr></thead><tbody>${rows||'<tr><td colspan="6">Nenhum certificado emitido ainda.</td></tr>'}</tbody></table></div></div>
 <div class="card"><h3>Restaurar backup</h3><p class="muted">Cole o conteúdo JSON de um backup exportado anteriormente.</p><form action="/admin/importar" method="post"><textarea name="json" rows="5"></textarea><div class="actions" style="margin-top:10px"><button>Importar backup</button></div></form></div></div>`));
});

app.post('/admin/login',(req,res)=>{
 const ip=req.ip||'unknown',now=Date.now();let rec=loginAttempts.get(ip)||{count:0,since:now};if(now-rec.since>900000)rec={count:0,since:now};if(rec.count>=8)return res.status(429).send(layout('Bloqueado','<div class="wrap"><div class="error">Muitas tentativas. Tente novamente em alguns minutos.</div></div>'));
 const ok=onlyDigits(req.body.cnpj)===ADMIN_CNPJ && ADMIN_PASSWORD && String(req.body.password)===ADMIN_PASSWORD;
 if(!ok){rec.count++;loginAttempts.set(ip,rec);return res.redirect('/admin?erro=1');}loginAttempts.delete(ip);newSession(res);res.redirect('/admin');
});
app.get('/admin/logout',(req,res)=>{const tok=cookies(req).kmo_session;if(tok)sessions.delete(tok.split('.')[0]);res.setHeader('Set-Cookie','kmo_session=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax');res.redirect('/');});

app.post('/admin/emitir',requireAuth,(req,res)=>{
 const name=String(req.body.name||'').trim(),cpf=onlyDigits(req.body.cpf),activity=String(req.body.activity||'').trim(),hours=String(req.body.hours||'').trim(),period=String(req.body.period||'').trim(),location=String(req.body.location||'').trim(),issuedAt=String(req.body.issuedAt||'').trim(),notes=String(req.body.notes||'').trim();
 if(!name||cpf.length!==11||!activity||!hours||!period||!location||!issuedAt)return res.status(400).send('Dados inválidos.');
 const data=loadData();let code;do{code=certCode();}while(data.certificates.some(c=>c.code===code));const c={code,name,cpf,activity,hours,period,location,issuedAt,notes,createdAt:new Date().toISOString()};c.auth=authHash(c);data.certificates.push(c);saveData(data);res.redirect('/certificado/'+encodeURIComponent(code)+'?emitido=1');
});
app.get('/admin/export',requireAuth,(req,res)=>{res.setHeader('Content-Disposition',`attachment; filename="backup-certificados-inhucu-${new Date().toISOString().slice(0,10)}.json"`);res.type('application/json').send(JSON.stringify(loadData(),null,2));});
app.post('/admin/importar',requireAuth,(req,res)=>{try{const x=JSON.parse(String(req.body.json||''));if(!x||!Array.isArray(x.certificates))throw 0;for(const c of x.certificates)if(!c.code||!c.name||!c.cpf)throw 0;saveData(x);res.redirect('/admin');}catch{res.status(400).send(layout('Backup inválido','<div class="wrap"><div class="error">Backup inválido.</div><p><a href="/admin">Voltar</a></p></div>'));}});

app.get('/validar',(req,res)=>{
 const code=String(req.query.codigo||'').trim().toUpperCase();if(!code)return res.redirect('/');const c=loadData().certificates.find(x=>String(x.code).toUpperCase()===code);
 if(!c)return res.status(404).send(layout('Não localizado',`<div class="wrap"><div class="card"><h1>Certificado não localizado</h1><div class="error">Não foi encontrado o código <b>${esc(code)}</b>.</div><p><a href="/">Tentar novamente</a></p></div></div>`));
 res.send(layout('Certificado válido',`<div class="wrap"><div class="card"><h1 style="color:var(--green)">✓ Certificado válido</h1><div class="notice">Registro localizado na base de certificados emitidos pela KMO Gestão.</div><p><b>Participante:</b> ${esc(c.name)}<br><b>CPF:</b> ${esc(fmtCPF(c.cpf))}<br><b>Atividade:</b> ${esc(c.activity)}<br><b>Carga horária:</b> ${esc(c.hours)}<br><b>Período:</b> ${esc(c.period)}<br><b>Local:</b> ${esc(c.location)}<br><b>Código:</b> ${esc(c.code)}<br><b>Autenticidade:</b> ${esc(c.auth)}</p><div class="actions"><a class="btn" href="/certificado/${encodeURIComponent(c.code)}">Visualizar certificado</a><a class="btn alt" href="/">Início</a></div></div></div>`));
});

app.get('/certificado/:code',async(req,res)=>{
 const code=String(req.params.code||'').toUpperCase(),c=loadData().certificates.find(x=>String(x.code).toUpperCase()===code);if(!c)return res.status(404).send('Certificado não encontrado');
 const verify=`${baseUrl(req)}/validar?codigo=${encodeURIComponent(c.code)}`,qr=await QRCode.toDataURL(verify,{margin:1,width:240});const [y,m,d]=c.issuedAt.split('-');const dateBR=d&&m&&y?`${d}/${m}/${y}`:c.issuedAt;
 res.send(layout('Certificado - '+c.name,`<div class="no-print wrap"><div class="actions"><button onclick="window.print()">Salvar / Imprimir PDF</button><a class="btn alt" href="/validar?codigo=${encodeURIComponent(c.code)}">Validar</a>${isAuth(req)?'<a class="btn alt" href="/admin">Voltar à emissão</a>':''}</div></div>
 <section class="cert-page"><div class="cert-frame"><div class="cert-top">${logo(105)}<div class="issuer"><b>KMO GESTÃO LTDA – EPP</b><br>CNPJ ${fmtCNPJ('34655687000115')}<br>Empresa certificadora</div></div>
 <div class="cert-title">CERTIFICADO</div><div class="cert-sub">PROJETO INHUÇU SUSTENTÁVEL</div>
 <div class="cert-text">A <b>KMO Gestão LTDA – EPP</b>, inscrita no CNPJ ${fmtCNPJ('34655687000115')}, na qualidade de empresa certificadora, certifica que<br><span class="cert-name">${esc(c.name)}</span><br>CPF ${esc(fmtCPF(c.cpf))}, participou da atividade <b>${esc(c.activity)}</b>, realizada no âmbito do Projeto Inhuçu Sustentável.</div>
 <div class="cert-meta"><div class="meta"><b>Carga horária</b><br>${esc(c.hours)}</div><div class="meta"><b>Período</b><br>${esc(c.period)}</div><div class="meta"><b>Local</b><br>${esc(c.location)}</div><div class="meta"><b>Emissão</b><br>${esc(dateBR)}</div></div>
 ${c.notes?`<div style="text-align:center;font-size:9pt;margin-top:4mm">${esc(c.notes)}</div>`:''}
 <div class="cert-bottom"><div class="signature"><div style="height:13mm"></div><div class="sigline"><b>KMO Gestão LTDA – EPP</b><br>Empresa certificadora • CNPJ ${fmtCNPJ('34655687000115')}</div></div><div class="qr"><img src="${qr}" alt="QR"><br>Valide pelo QR Code<br><b>${esc(c.code)}</b><br>${esc(c.auth)}</div></div>
 <div class="inst"><b>Projeto Inhuçu Sustentável</b> • São Benedito/CE • Identidade visual em referência ao cronograma do projeto</div>
 <div class="disclaimer">Certificação emitida pela KMO Gestão LTDA – EPP. Referências institucionais do projeto não alteram a responsabilidade da empresa certificadora pela emissão.</div>
 </div></section>`));
});
app.use((req,res)=>res.status(404).send(layout('Página não encontrada','<div class="wrap"><div class="card"><h1>Página não encontrada</h1><p><a href="/">Início</a></p></div></div>')));
ensureData();app.listen(PORT,()=>console.log(`Certificados Inhuçu na porta ${PORT}`));
