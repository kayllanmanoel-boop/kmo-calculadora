let _marcaPromise;
function carregarMarca(){
  if(_marcaPromise)return _marcaPromise;
  _marcaPromise=new Promise((resolve,reject)=>{
    const img=new Image();
    img.crossOrigin='anonymous';
    img.onload=()=>{
      try{
        const c=document.createElement('canvas');
        c.width=img.naturalWidth;c.height=img.naturalHeight;
        const ctx=c.getContext('2d');
        ctx.clearRect(0,0,c.width,c.height);
        ctx.globalAlpha=.08;
        ctx.drawImage(img,0,0);
        resolve({logo:img,marcaAgua:c.toDataURL('image/png')});
      }catch(e){resolve({logo:img,marcaAgua:null})}
    };
    img.onerror=reject;
    img.src='../logo-kmo.png';
  });
  return _marcaPromise;
}

async function folhaExata(doc,titulo){
  const AZUL=[7,59,134], OURO=[214,168,74], BRANCO=[255,255,255], TEXTO=[24,32,48];
  doc.setFillColor(...BRANCO);doc.rect(0,0,210,297,'F');
  doc.setFillColor(...AZUL);doc.rect(0,0,210,36,'F');
  doc.setDrawColor(...OURO);doc.setLineWidth(3.2);
  doc.line(0,29,32,38);doc.line(32,38,72,38.5);doc.line(72,38.5,112,31.5);doc.line(112,31.5,152,23.5);doc.line(152,23.5,210,25.5);
  doc.setDrawColor(255,255,255);doc.setLineWidth(1.1);
  doc.line(0,26.5,35,35);doc.line(35,35,76,35.6);doc.line(76,35.6,116,28.5);doc.line(116,28.5,156,21.2);doc.line(156,21.2,210,23.2);
  doc.setTextColor(...BRANCO);doc.setFont('helvetica','bold');doc.setFontSize(22);doc.text('KMO',14,18);
  doc.setFont('helvetica','normal');doc.setFontSize(20);doc.text('GESTÃO',44,18);
  try{
    const m=await carregarMarca();
    doc.addImage(m.logo,'PNG',160,2,40,40,undefined,'FAST');
    if(m.marcaAgua)doc.addImage(m.marcaAgua,'PNG',58,80,95,95,undefined,'FAST');
  }catch(e){console.warn('Falha ao carregar logo',e)}
  doc.setTextColor(...TEXTO);doc.setFont('helvetica','bold');doc.setFontSize(14.5);doc.text(titulo,105,54,{align:'center'});
  doc.setFillColor(...AZUL);doc.rect(0,244,210,53,'F');
  doc.setDrawColor(...OURO);doc.setLineWidth(4);
  doc.line(0,244,36,239.5);doc.line(36,239.5,78,238.5);doc.line(78,238.5,120,242);doc.line(120,242,155,246);doc.line(155,246,210,244.5);
  doc.setDrawColor(255,255,255);doc.setLineWidth(1.2);
  doc.line(0,247.3,36,242.8);doc.line(36,242.8,78,241.7);doc.line(78,241.7,120,245);doc.line(120,245,155,248.2);doc.line(155,248.2,210,246.7);
  doc.setDrawColor(...OURO);doc.setLineWidth(.7);doc.line(116,252,116,289);
  doc.setTextColor(...OURO);doc.setFont('helvetica','bold');doc.setFontSize(8.8);doc.text('KMO GESTÃO LTDA - EPP',11,255);
  doc.setTextColor(...BRANCO);doc.setFont('helvetica','bold');doc.setFontSize(7.2);
  doc.text('CNPJ: 34.655.687/0001-15',11,260.8);
  doc.text('Inscrição Estadual (IE): 062542826',11,266.2);
  doc.text('Inscrição Municipal (IM): 145133',11,271.6);
  doc.text('CRA: 14507   |   CRN: 1527   |   CREA: 10561340',11,277);
  doc.text('Endereço: Travessa Benjamin Cavalcante, nº 123,',11,282.4);
  doc.text('Nenê Plácido, Tianguá/CE',11,287.2);
  doc.text('Unidade de Apoio Administrativo: SCS Q 01 - Asa Sul,',11,292);
  doc.text('Brasília - DF, 70301-000',11,296);
  function icone(x,y,txt){doc.setDrawColor(...OURO);doc.setLineWidth(.8);doc.circle(x,y,3.1);doc.setTextColor(...OURO);doc.setFont('helvetica','bold');doc.setFontSize(7);doc.text(txt,x,y+1.1,{align:'center'})}
  icone(132,261,'T');icone(132,272,'@');icone(132,283,'W');
  doc.setTextColor(...BRANCO);doc.setFont('helvetica','bold');doc.setFontSize(8.8);
  doc.text('88 9.94916623',140,262.2);
  doc.text('KMO.GESTAO@GMAIL.COM',140,273.2);
  doc.text('WWW.KMOGESTAO.COM',140,284.2);
}

function dataLonga(s){let p=(s||'').split('/');if(p.length<3)return s||'';let m=['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];return (+p[0])+' de '+m[(+p[1])-1]+' de '+p[2]}
function porExtenso(v){if(window.valorPorExtenso)return window.valorPorExtenso(v);return brl(v)}
function escreva(doc,txt,x,y,w,size=10,style='normal',align='left'){doc.setFont('helvetica',style);doc.setFontSize(size);doc.setTextColor(24,32,48);const linhas=doc.splitTextToSize(String(txt||''),w);doc.text(linhas,x,y,{align});return y+linhas.length*4.8}

async function recibo(){
  let d=dados(),{jsPDF}=window.jspdf,doc=new jsPDF();
  await folhaExata(doc,'RECIBO DE NOTA FISCAL');
  doc.setDrawColor(20);doc.setLineWidth(.4);doc.rect(139,60,52,25);
  doc.setFont('helvetica','normal');doc.setTextColor(24,32,48);doc.setFontSize(8.7);doc.text('número do recibo',145,68);
  doc.setFont('helvetica','bold');doc.setFontSize(10.5);doc.text(d.nf+' / '+d.ano,184,68,{align:'right'});
  doc.setFont('helvetica','normal');doc.setFontSize(8.7);doc.text('nota fiscal n°',145,76);
  doc.setFont('helvetica','bold');doc.setFontSize(15);doc.text(String(d.nf),184,76,{align:'right'});
  doc.setFont('helvetica','normal');doc.setFontSize(8.7);doc.text('valor do serviços',145,83);
  doc.setFont('helvetica','bold');doc.setFontSize(10.5);doc.text(brl(d.valor),184,83,{align:'right'});
  let y=94;
  y=escreva(doc,'A empresa '+EMP+', estabelecida na '+END+', inscrita no CNPJ nº '+CNPJ+', recebeu(emos) de:',23,y,160,9.7,'normal')+4;
  y=escreva(doc,String(d.tom||'').toUpperCase(),23,y,160,11,'bold')+5;
  y=escreva(doc,'A importância de '+porExtenso(d.valor)+', referente à Nota Fiscal n° '+d.nf+', correspondente aos serviços prestados.',23,y,160,9.8,'normal')+6;
  doc.setDrawColor(120);doc.setLineWidth(.35);doc.rect(23,y,162,17);
  doc.setFont('helvetica','bold');doc.setFontSize(9.8);doc.text('DADOS BANCÁRIOS',28,y+6.5);
  doc.setFont('helvetica','normal');doc.setFontSize(9.5);doc.text(d.banco+': AGÊNCIA N°'+d.ag+'   CONTA N.°'+d.conta,28,y+12.4);
  y+=31;
  let dt=$('blankRecibo').checked?'TIANGUÁ ____/____/'+d.ano:'TIANGUÁ, '+dataLonga(d.data).toUpperCase();
  doc.setFont('helvetica','normal');doc.setFontSize(10);doc.text(dt,105,y,{align:'center'});
  doc.line(58,y+24,152,y+24);
  doc.setFont('helvetica','bold');doc.setFontSize(10);doc.text(d.rep,105,y+30,{align:'center'});
  doc.save('RECIBO_NF_'+d.nf+'.pdf');
}

async function requerimento(){
  let d=dados(),{jsPDF}=window.jspdf,doc=new jsPDF();
  await folhaExata(doc,'REQUERIMENTO DE PAGAMENTO');
  doc.setDrawColor(20);doc.setLineWidth(.4);doc.rect(139,60,52,21);
  doc.setFont('helvetica','normal');doc.setTextColor(24,32,48);doc.setFontSize(8.7);doc.text('nota fiscal n°',145,68);
  doc.setFont('helvetica','bold');doc.setFontSize(15);doc.text(String(d.nf),184,68,{align:'right'});
  doc.setFont('helvetica','normal');doc.setFontSize(8.7);doc.text('valor do total dos serviços',145,77);
  doc.setFont('helvetica','bold');doc.setFontSize(10.5);doc.text(brl(d.valor),184,77,{align:'right'});
  let dt=$('dateReq').checked?dataLonga(d.data):'____ de ______________ de '+d.ano;
  let y=94;
  doc.setFont('helvetica','bold');doc.setFontSize(10);doc.text('TIANGUÁ, '+String(dt).toUpperCase(),23,y);
  y+=12;
  y=escreva(doc,'A empresa '+EMP+', inscrita no CNPJ nº '+CNPJ+', estabelecida na '+END+', por meio de seu representante legal infra-assinado, vem, respeitosamente, requerer o pagamento de:',23,y,160,9.8,'normal')+4;
  y=escreva(doc,String(d.tom||'').toUpperCase(),23,y,160,11,'bold')+5;
  y=escreva(doc,'Referente aos serviços prestados constantes na Nota Fiscal n° '+d.nf+', no valor total de '+brl(d.valor)+' ('+porExtenso(d.valor)+').',23,y,160,9.8,'normal')+6;
  doc.setFont('helvetica','bold');doc.setFontSize(9.8);doc.text('DADOS BANCÁRIOS',23,y);
  doc.setFont('helvetica','normal');doc.setFontSize(9.5);doc.text(d.banco+': AGÊNCIA N°'+d.ag+'   CONTA N.°'+d.conta,23,y+7);
  y+=24;
  doc.setFont('helvetica','normal');doc.setFontSize(10);doc.text('Nestes termos, pede deferimento.',23,y);
  doc.text('Para maior clareza firmamos o presente.',23,y+8);
  doc.line(58,y+32,152,y+32);
  doc.setFont('helvetica','bold');doc.text(d.rep,105,y+38,{align:'center'});
  doc.save('REQUERIMENTO_NF_'+d.nf+'.pdf');
}

function gerar(t){return t==='recibo'?recibo():requerimento()}
async function gerarAmbos(){await recibo();setTimeout(()=>{requerimento()},450)}
