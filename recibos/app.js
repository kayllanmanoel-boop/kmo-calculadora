pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
const $=i=>document.getElementById(i),F=$('file'),S=$('status');
const EMP='K M O GESTÃO LTDA - EPP',CNPJ='34.655.687/0001-15',END='Tv. Benjamin Cavalcante, nº 123, Bairro Nenê Plácido, Tianguá - CE';
function st(t,ok=1){S.textContent=t;S.classList.remove('hidden');S.style.background=ok?'#edf6ef':'#fff0ef';S.style.color=ok?'#27663a':'#9c2b25'}
const one=(r,t)=>{let m=t.match(r);return m?(m[1]||'').replace(/\s+/g,' ').trim():''};
function bloco(t,a,b){let i=t.search(a);if(i<0)return'';let s=t.slice(i),m=s.match(b);return m?s.slice(0,m.index):s}
function parse(t){t=t.replace(/[ \t]+/g,' ').trim();let bt=bloco(t,/TOMADOR\s*\/\s*ADQUIRENTE/i,/DESTINAT[ÁA]RIO|INTERMEDI[ÁA]RIO|SERVI[ÇC]O PRESTADO/i);return{
nf:one(/N[ÚU]MERO DA NFS-E\s*\n?\s*(\d+)/i,t)||one(/NFS-E[^\d]{0,20}(\d{3,12})/i,t),
data:one(/DATA E HORA DA EMISS[AÃ]O DA NFS-E\s*\n?\s*(\d{2}\/\d{2}\/\d{4})/i,t)||one(/COMPET[EÊ]NCIA DA NFS-E\s*\n?\s*(\d{2}\/\d{2}\/\d{4})/i,t),
tom:one(/NOME\s*\/\s*NOME EMPRESARIAL\s*\n?\s*([^\n]+)/i,bt),
cnpj:one(/CNPJ\s*\/\s*CPF\s*\/\s*NIF\s*\n?\s*([0-9.\/-]+)/i,bt),
mun:one(/MUNIC[ÍI]PIO\s*\/\s*SIGLA UF\s*\n?\s*([^\n]+)/i,bt),
desc:one(/DESCRI[ÇC][ÃA]O DO SERVI[ÇC]O\s*\n?\s*([\s\S]*?)(?=TRIBUTA[ÇC][ÃA]O MUNICIPAL|ISSQN)/i,t),
val:one(/VALOR DA OPERA[ÇC][ÃA]O\s*\/\s*SERVI[ÇC]O\s*\n?\s*(R\$\s*[\d.]+,\d{2})/i,t)||one(/VALOR L[ÍI]QUIDO DA NFS-E\s*\n?\s*(R\$\s*[\d.]+,\d{2})/i,t)||one(/BC ISSQN\s*\n?\s*(R\$\s*[\d.]+,\d{2})/i,t)}}
F.onchange=async()=>{if(!F.files[0])return;st('Lendo a nota fiscal...');try{let p=await pdfjsLib.getDocument({data:await F.files[0].arrayBuffer()}).promise,t='';for(let i=1;i<=p.numPages;i++){let c=await(await p.getPage(i)).getTextContent();t+=c.items.map(x=>x.str).join('\n')+'\n'}let d=parse(t);$('nf').value=d.nf;$('emissao').value=d.data;$('tomador').value=d.tom;$('cnpjTomador').value=d.cnpj;$('municipio').value=d.mun;$('descricao').value=d.desc;$('valor').value=d.val;$('ano').value=(d.data.match(/\d{4}$/)||[new Date().getFullYear()])[0];$('dados').classList.remove('hidden');st('Nota lida. Confira os dados antes de gerar.')}catch(e){console.error(e);st('Não foi possível ler automaticamente este PDF.',0)}};
function num(v){v=String(v||'').replace(/R\$|\s/g,'');if(v.includes(','))v=v.replace(/\./g,'').replace(',','.');return Number(v)||0}
function brl(n){return n.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}
const U=['','UM','DOIS','TRÊS','QUATRO','CINCO','SEIS','SETE','OITO','NOVE','DEZ','ONZE','DOZE','TREZE','QUATORZE','QUINZE','DEZESSEIS','DEZES