#!/usr/bin/env python3
import os,json,time,secrets,hashlib,hmac,html,urllib.parse,http.client
from http.server import ThreadingHTTPServer,BaseHTTPRequestHandler
from pathlib import Path
from datetime import datetime
P=int(os.getenv("PORT","80")); DP=int(os.getenv("KMO_DRIVER_INTERNAL_PORT","8001")); F=Path(__file__).with_name("certificates.json")
CNPJ="34655687000115"; SALT=bytes.fromhex("6a38deeb9d2445c052a8cb49544a36a5"); PH=bytes.fromhex("20a698009984d1a5c091aba593a0e208fef6c83750e0e252943b9732efcebf96")
SESS={}; ATT={}
CSS=""":root{--g:#0f5b2c;--l:#83b72a;--v:#b7b8e8;--sg:#c8dfb2;--p:#dda3cc;--o:#f3bda0}*{box-sizing:border-box}body{margin:0;font-family:Arial;background:#f4f4f4;color:#242424}a{color:var(--g)}.w{max-width:1080px;margin:auto;padding:28px 18px}.c{background:#fff;border-radius:18px;box-shadow:0 10px 32px #0001;padding:26px;margin-bottom:20px}.b{display:flex;gap:18px;align-items:center}.b h1{margin:0;color:var(--g)}.m{color:#666}.gr{display:grid;grid-template-columns:1fr 1fr;gap:16px}.f{grid-column:1/-1}label{display:block;font-weight:700;font-size:14px;margin:4px 0 7px}input,textarea{width:100%;padding:12px;border:1px solid #c8c8c8;border-radius:10px;font:inherit}button,.bt{display:inline-block;border:0;border-radius:10px;padding:12px 18px;font-weight:700;text-decoration:none;cursor:pointer;background:var(--g);color:#fff}.a{display:flex;gap:10px;flex-wrap:wrap}.alt{background:#444}.bad{background:#9d2f2f}.n,.e{padding:12px 14px;border-radius:10px}.n{background:#eef8ef;border-left:5px solid var(--g)}.e{background:#fff0f0;border-left:5px solid #b40000}.h{background:linear-gradient(135deg,var(--g),#154f2d);color:#fff;border-radius:22px;padding:34px;display:grid;grid-template-columns:1fr 180px}.h h1{font-size:34px;margin:0}.t{overflow:auto}table{width:100%;border-collapse:collapse}th,td{padding:10px;border-bottom:1px solid #ddd;text-align:left;font-size:14px}.cp{width:297mm;min-height:210mm;margin:18px auto;background:#fff;padding:12mm 14mm}.cf{min-height:184mm;border:3px solid var(--g);outline:1px solid var(--l);outline-offset:5px;padding:9mm 13mm}.ct{text-align:center;font-size:28pt;letter-spacing:2px;color:var(--g);font-weight:800}.cs{text-align:center;color:#555}.cx{font-family:Georgia;font-size:14.5pt;line-height:1.58;text-align:center;margin:5mm 8mm}.nm{font-size:24pt;font-weight:700;border-bottom:2px solid var(--g);display:inline-block;padding:0 7mm 2mm}.meta{display:grid;grid-template-columns:1fr 1fr;gap:4mm 9mm;margin:6mm 17mm}.meta div{border-radius:8px;padding:3mm 4mm}.meta div:nth-child(1){background:var(--v)}.meta div:nth-child(2){background:var(--sg)}.meta div:nth-child(3){background:var(--p)}.meta div:nth-child(4){background:var(--o)}.bot{display:grid;grid-template-columns:1fr 1fr;gap:14mm;align-items:end;margin:10mm 12mm}.sig{text-align:center;border-top:1px solid #333;padding-top:2mm}.val{text-align:center;font-size:8pt;border:1px dashed #aaa;border-radius:8px;padding:3mm}.sm{text-align:center;font-size:7.5pt;color:#666;margin-top:4mm}@media(max-width:760px){.gr,.h{grid-template-columns:1fr}.cp{zoom:.45}}@media print{body{background:#fff}.np{display:none!important}.cp{margin:0;width:297mm;height:210mm}@page{size:A4 landscape;margin:0}}"""
def L(s=100): return f'<svg width="{s}" height="{s}" viewBox="0 0 120 120"><circle cx="60" cy="60" r="54" fill="#0f5b2c"/><circle cx="60" cy="60" r="39" fill="#fff"/><path d="M60 12a48 48 0 0 1 40 20" fill="none" stroke="#83b72a" stroke-width="10"/><path d="M96 23l11 13-17 3z" fill="#83b72a"/><text x="60" y="34" text-anchor="middle" font-family="Georgia" font-weight="700" font-size="13" fill="#0f5b2c">INHUÇU</text><text x="60" y="88" text-anchor="middle" font-family="Georgia" font-weight="700" font-size="10" fill="#0f5b2c">SUSTENTÁVEL</text></svg>'
def page(t,b): return f'<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>{html.escape(t)}</title><style>{CSS}</style><body>{b}</body></html>'
def dig(x): return ''.join(c for c in str(x or "") if c.isdigit())
def cpf(x): d=dig(x); return f"{d[:3]}.{d[3:6]}.{d[6:9]}-{d[9:]}" if len(d)==11 else str(x)
def cnpj(): d=CNPJ; return f"{d[:2]}.{d[2:5]}.{d[5:8]}/{d[8:12]}-{d[12:]}"
def load():
 if not F.exists(): F.write_text('{"certificates":[]}',encoding="utf8")
 try:return json.loads(F.read_text(encoding="utf8"))
 except:return {"certificates":[]}
def save(x): F.write_text(json.dumps(x,ensure_ascii=False,indent=2),encoding="utf8")
def pw(x):
 try:return hmac.compare_digest(hashlib.scrypt(str(x or "").encode(),salt=SALT,n=16384,r=8,p=1,dklen=32,maxmem=67108864),PH)
 except:return False
def cookies(h):
 o={}
 for p in (h.headers.get("Cookie") or "").split(";"):
  if "=" in p:k,v=p.split("=",1);o[k.strip()]=urllib.parse.unquote(v)
 return o
def auth(h):
 s=cookies(h).get("kmo_cert_session"); return bool(s in SESS and time.time()-SESS[s]<28800)
class G(BaseHTTPRequestHandler):
 protocol_version="HTTP/1.1"
 def log_message(self,f,*a): print("[GATEWAY]",f%a,flush=True)
 def sendx(self,st,b="",ct="text/html; charset=utf-8",hs=None):
  if isinstance(b,str):b=b.encode()
  self.send_response(st);self.send_header("Content-Type",ct);self.send_header("Content-Length",str(len(b)));self.send_header("Cache-Control","no-store")
  for k,v in (hs or {}).items():self.send_header(k,v)
  self.end_headers()
  if self.command!="HEAD":self.wfile.write(b)
 def red(self,u,c=None):
  h={"Location":u}
  if c:h["Set-Cookie"]=c
  self.sendx(302,b"",hs=h)
 def form(self):
  n=int(self.headers.get("Content-Length","0") or 0);q=urllib.parse.parse_qs(self.rfile.read(n).decode(errors="replace"),keep_blank_values=True)
  return {k:v[-1] for k,v in q.items()}
 def proxy(self):
  n=int(self.headers.get("Content-Length","0") or 0); body=self.rfile.read(n) if n else None
  hs={k:v for k,v in self.headers.items() if k.lower() not in {"host","connection","content-length","transfer-encoding"}};hs["Host"]=f"127.0.0.1:{DP}"
  if body is not None:hs["Content-Length"]=str(len(body))
  try:
   c=http.client.HTTPConnection("127.0.0.1",DP,timeout=30);c.request(self.command,self.path,body=body,headers=hs);r=c.getresponse();d=r.read();self.send_response(r.status,r.reason)
   for k,v in r.getheaders():
    if k.lower() not in {"connection","keep-alive","transfer-encoding","content-length","upgrade"}:self.send_header(k,v)
   self.send_header("Content-Length",str(len(d)));self.end_headers()
   if self.command!="HEAD":self.wfile.write(d)
  except Exception as e:self.sendx(503,f"Serviço KMO Driver temporariamente indisponível.<br><small>{html.escape(str(e))}</small>")
 def home(self):
  b=f'<div class="w"><section class="h"><div><h1>Certificados — Inhuçu Sustentável</h1><p>Emissão e validação de certificados. Empresa certificadora: <b>KMO Gestão LTDA – EPP</b>, CNPJ {cnpj()}.</p></div>{L(150)}</section><div class="c"><h2>Validar certificado</h2><form action="/validar" class="gr"><div class="f"><label>Código</label><input name="codigo" placeholder="KMO-IS-2026-..." required></div><div class="f a"><button>Validar</button><a class="bt alt" href="/admin">Área de emissão</a></div></form></div></div>'
  self.sendx(200,page("Certificados Inhuçu",b))
 def admin(self):
  if not auth(self):
   e='<div class="e">CNPJ ou senha incorretos.</div>' if "erro=1" in self.path else ""
   return self.sendx(200,page("Área de emissão",f'<div class="w"><div class="c" style="max-width:540px;margin:55px auto"><div class="b">{L(88)}<div><h1>Área de emissão</h1><p class="m">KMO Gestão</p></div></div>{e}<form action="/admin/login" method="post"><label>CNPJ</label><input name="cnpj" required><label>Senha</label><input type="password" name="password" required><div class="a" style="margin-top:18px"><button>Entrar</button><a class="bt alt" href="/certificados">Voltar</a></div></form></div></div>'))
  d=load(); rows=''.join(f'<tr><td>{html.escape(x["code"])}</td><td>{html.escape(x["name"])}</td><td>{html.escape(cpf(x["cpf"]))}</td><td>{html.escape(x["activity"])}</td><td><a href="/certificado/{urllib.parse.quote(x["code"])}">Abrir</a></td></tr>' for x in reversed(d["certificates"][-100:]))
  today=datetime.now().strftime("%Y-%m-%d")
  b=f'<div class="w"><div class="c"><div class="b">{L(88)}<div><h1>Emissor de Certificados</h1><p class="m">KMO Gestão LTDA – EPP • CNPJ {cnpj()}</p></div></div></div><div class="c"><h2>Novo certificado</h2><form action="/admin/emitir" method="post" class="gr"><div><label>Nome completo</label><input name="name" required></div><div><label>CPF</label><input name="cpf" required></div><div class="f"><label>Atividade</label><input name="activity" value="Formação em Coleta Seletiva e Gestão de Resíduos — Projeto Inhuçu Sustentável" required></div><div><label>Carga horária</label><input name="hours" required></div><div><label>Período</label><input name="period" required></div><div><label>Local</label><input name="location" value="Inhuçu — São Benedito/CE" required></div><div><label>Data de emissão</label><input type="date" name="issuedAt" value="{today}" required></div><div class="f"><label>Observação</label><textarea name="notes"></textarea></div><div class="f a"><button>Emitir</button><a class="bt alt" href="/admin/export">Backup</a><a class="bt bad" href="/admin/logout">Sair</a></div></form></div><div class="c"><h2>Emitidos</h2><div class="t"><table><tr><th>Código</th><th>Nome</th><th>CPF</th><th>Atividade</th><th></th></tr>{rows or "<tr><td colspan=5>Nenhum certificado.</td></tr>"}</table></div></div><div class="c"><h3>Restaurar backup</h3><form action="/admin/importar" method="post"><textarea name="json" rows="5"></textarea><button>Importar</button></form></div></div>'
  self.sendx(200,page("Emissor",b))
 def valid(self):
  q=urllib.parse.parse_qs(urllib.parse.urlsplit(self.path).query);code=(q.get("codigo",[""])[0] or "").upper();x=next((z for z in load()["certificates"] if z["code"].upper()==code),None)
  if not x:return self.sendx(404,page("Não localizado",f'<div class="w"><div class="c"><h1>Certificado não localizado</h1><div class="e">Código <b>{html.escape(code)}</b> não encontrado.</div><p><a href="/certificados">Voltar</a></p></div></div>'))
  b=f'<div class="w"><div class="c"><h1 style="color:var(--g)">✓ Certificado válido</h1><div class="n">Registro localizado na base da KMO Gestão.</div><p><b>Participante:</b> {html.escape(x["name"])}<br><b>CPF:</b> {html.escape(cpf(x["cpf"]))}<br><b>Atividade:</b> {html.escape(x["activity"])}<br><b>Carga:</b> {html.escape(x["hours"])}<br><b>Período:</b> {html.escape(x["period"])}<br><b>Código:</b> {html.escape(x["code"])}<br><b>Autenticidade:</b> {html.escape(x["auth"])}</p><a class="bt" href="/certificado/{urllib.parse.quote(x["code"])}">Visualizar certificado</a></div></div>'
  self.sendx(200,page("Certificado válido",b))
 def cert(self,code):
  x=next((z for z in load()["certificates"] if z["code"].upper()==code.upper()),None)
  if not x:return self.sendx(404,"Certificado não encontrado")
  try:dt=datetime.strptime(x["issuedAt"],"%Y-%m-%d").strftime("%d/%m/%Y")
  except:dt=x["issuedAt"]
  host=self.headers.get("Host","");url=f'https://{host}/validar?codigo={urllib.parse.quote(x["code"])}';note=f'<div class="sm">{html.escape(x.get("notes",""))}</div>' if x.get("notes") else ""
  b=f'<div class="np w"><div class="a"><button onclick="window.print()">Salvar / Imprimir PDF</button><a class="bt alt" href="/validar?codigo={urllib.parse.quote(x["code"])}">Validar</a></div></div><section class="cp"><div class="cf"><div class="b" style="justify-content:space-between">{L(100)}<div style="text-align:right"><b>KMO GESTÃO LTDA – EPP</b><br>CNPJ {cnpj()}<br>Empresa certificadora</div></div><div class="ct">CERTIFICADO</div><div class="cs">PROJETO INHUÇU SUSTENTÁVEL</div><div class="cx">A <b>KMO Gestão LTDA – EPP</b>, inscrita no CNPJ {cnpj()}, certifica que<br><span class="nm">{html.escape(x["name"])}</span><br>CPF {html.escape(cpf(x["cpf"]))}, participou da atividade <b>{html.escape(x["activity"])}</b>.</div><div class="meta"><div><b>Carga horária</b><br>{html.escape(x["hours"])}</div><div><b>Período</b><br>{html.escape(x["period"])}</div><div><b>Local</b><br>{html.escape(x["location"])}</div><div><b>Emissão</b><br>{html.escape(dt)}</div></div>{note}<div class="bot"><div class="sig"><b>KMO Gestão LTDA – EPP</b><br>Empresa certificadora</div><div class="val"><b>VALIDAÇÃO PÚBLICA</b><br>{html.escape(x["code"])}<br>{html.escape(x["auth"])}<br>{html.escape(url)}</div></div><div class="sm">Certificação emitida pela KMO Gestão LTDA – EPP. Identidade visual do Projeto Inhuçu Sustentável.</div></div></section>'
  self.sendx(200,page("Certificado - "+x["name"],b))
 def do_GET(self):
  p=urllib.parse.urlsplit(self.path).path
  if p in ("/certificados","/certificados/"):return self.home()
  if p.startswith("/admin"):
   if p=="/admin/logout":
    s=cookies(self).get("kmo_cert_session");SESS.pop(s,None);return self.red("/certificados","kmo_cert_session=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax; Secure")
   if p=="/admin/export":
    if not auth(self):return self.red("/admin")
    z=json.dumps(load(),ensure_ascii=False,indent=2).encode();return self.sendx(200,z,"application/json; charset=utf-8",{"Content-Disposition":f'attachment; filename="backup-certificados-{datetime.now():%Y-%m-%d}.json"'})
   return self.admin()
  if p=="/validar":return self.valid()
  if p.startswith("/certificado/"):return self.cert(urllib.parse.unquote(p.split("/certificado/",1)[1]))
  return self.proxy()
 def do_POST(self):
  p=urllib.parse.urlsplit(self.path).path
  if p=="/admin/login":
   f=self.form();ip=self.client_address[0];r=ATT.get(ip,[0,time.time()])
   if time.time()-r[1]>900:r=[0,time.time()]
   if r[0]>=8:return self.sendx(429,"Muitas tentativas.")
   if dig(f.get("cnpj"))!=CNPJ or not pw(f.get("password")):r[0]+=1;ATT[ip]=r;return self.red("/admin?erro=1")
   ATT.pop(ip,None);s=secrets.token_urlsafe(32);SESS[s]=time.time();return self.red("/admin",f"kmo_cert_session={s}; Path=/; Max-Age=28800; HttpOnly; SameSite=Lax; Secure")
  if p=="/admin/emitir":
   if not auth(self):return self.red("/admin")
   f=self.form();cp=dig(f.get("cpf"));req=[f.get(k,"").strip() for k in ("name","activity","hours","period","location","issuedAt")]
   if len(cp)!=11 or not all(req):return self.sendx(400,"Dados inválidos.")
   d=load();code=f"KMO-IS-{datetime.now().year}-{secrets.token_hex(4).upper()}";x={"code":code,"name":req[0],"cpf":cp,"activity":req[1],"hours":req[2],"period":req[3],"location":req[4],"issuedAt":req[5],"notes":f.get("notes","").strip(),"auth":secrets.token_hex(10).upper()};d["certificates"].append(x);save(d);return self.red("/certificado/"+code)
  if p=="/admin/importar":
   if not auth(self):return self.red("/admin")
   try:d=json.loads(self.form().get("json",""));assert isinstance(d.get("certificates"),list);save(d);return self.red("/admin")
   except:return self.sendx(400,"Backup inválido.")
  return self.proxy()
 def do_PUT(self):return self.proxy()
 def do_PATCH(self):return self.proxy()
 def do_DELETE(self):return self.proxy()
 def do_OPTIONS(self):return self.proxy()
 def do_HEAD(self):return self.do_GET()
if __name__=="__main__":
 load();print(f"[GATEWAY] KMO Driver + Certificados na porta {P}; driver interno {DP}",flush=True);ThreadingHTTPServer(("0.0.0.0",P),G).serve_forever()
