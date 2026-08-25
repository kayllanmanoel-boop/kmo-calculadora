let _marca;
function carregarMarca(){
  if(_marca) return _marca;
  _marca=new Promise((ok,fail)=>{
    const im=new Image(); im.crossOrigin='anonymous';
    im.onload=()=>{try{const c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;const x=c.getContext('2d');x.globalAlpha=.055;x.drawImage(im,0,0);ok({logo:im,water:c.toDataURL('image/png')})}catch(e){ok({logo:im,water:null})}};
    im.onerror=fail; im.src='../logo-kmo.png?v=20260825';
  });
  return _marca;
}
async function timbre(doc,titulo){
  const azul=[4,55,126], ouro=[225,170,66], branco=[255,255,255], texto=[24,31,47];
  doc.setFillColor(...branco);doc.rect(0,0,210,297,'F');
  doc.setFillColor(...azul);doc.rect(0,0,210,31,'F');
  doc.setDrawColor(...ouro);doc.setLineWidth(3.4);doc.lines([[28,10],[32,0],[30,-4],[34,-6],[35,1],[51,8]],0,26,[1,1],'S');
  doc.setDrawColor(...branco);doc.setLineWidth(1.2);doc.lines([[28,10],[32,0],[30,-4],[34,-6],[35,1],[51,8]],0,29,[1,1],'S');
  doc.setTextColor(...branco);doc.setFont('helvetica','bold');doc.setFontSize(23);doc.text('KMO',13,18);
  doc.setFont('helvetica','normal');doc.setFontSize(20);doc.text('GESTÃO',45,18);
  try{const m=await carregarMarca();doc.addImage(m.logo,'PNG',160,2,39,39,undefined,'FAST');if(m.water)doc.addImage(m.water,'PNG',57,78,96,96,undefined,'FAST')}catch(e){console.warn(e)}
  doc.setTextColor(...texto);doc.setFont('helvetica','bold');doc.setFontSize(14);doc.text(titulo,105,56,{align:'center'});
  doc.setFillColor(...azul);doc.rect(0,248,210,49,'F');
  doc.setDrawColor(...ouro);doc.setLineWidth(3.4);doc.lines([[33,-6],[35,-1],[38,4],[35,3],[35,-1],[34,-3]],0,248,[1,1],'S');
  doc.setDrawColor(...branco);doc.setLineWidth(1.2);doc.lines([[33,-6],[35,-1],[38,4],[35,3],[35,-1],[34,-3]],0,251,[1,1],'S');
  doc.setDrawColor(...ouro);doc.setLineWidth(.7);doc.line(113,258,113,291);
  doc.setTextColor(...ouro);doc.setFont('helvetica','bold');doc.setFontSize(8.6);doc.text('KMO GESTÃO LTDA - EPP',11,259);
  doc.setTextColor(...branco);doc.setFont('helvetica','bold');doc.setFontSize(7.1);
  doc.text('CNPJ: 34.655.687/0001-15',11,264.5);doc.text('Inscrição Estadual (IE): 062542826',11,269.7);doc.text('Inscrição Municipal (IM): 145133',11,274.9);doc.text('CRA: 14507   |   CRN: 1527   |   CREA: 10561340',11,280.1);
  doc.text('Endereço: Travessa Benjamin Cavalcante, nº 123, Nenê Plácido, Tianguá/CE',11,285.3);doc.text('Unidade de Apoio Administrativo: SCS Q 01 - Asa Sul, Brasília - DF, 70301-000',11,290.5);
  doc.setTextColor(...ouro);doc.setFontSize(9);doc.text('◯',126,263);doc.text('◯',126,275);doc.text('◯',126,287);
  doc.setTextColor(...branco);doc.setFontSize(8.5);doc.text('88 9.94916623',135,263);doc.text('KMO.GESTAO@GMAIL.COM',135,275);doc.text('WWW.KMOGESTAO.COM',135,287);
}
function longa(s){const p=(s||'').split('/');if(p.length<3)return s||'';const m=['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];return(+p[0])+' de '+m[(+p[1])-1]+' de '+p[2]}
function ext(v){return window.valorPorExtenso?window.valorPorExtenso(v):brl(v)}
function wrap(doc,t,x,y,w,sz=9.5,bold=false){doc.setTextColor(24,31,47);doc.setFont('helvetica',bold?'bold':'normal');doc.setFontSize(sz);const a=doc.splitTextToSize(String(t||''),w);doc.text(a,x,y);return y+a.length*4.6}
async function recibo(){const d=dados(),{jsPDF}=window.jspdf,doc=new jsPDF();await timbre(doc,'RECIBO DE NOTA FISCAL');doc.setTextColor(24,31,47);doc.setDrawColor(45);doc.setLineWidth(.35);doc.rect(138,63,52,26);doc.setFont('helvetica','normal');doc.setFontSize(8);doc.text('NÚMERO DO RECIBO',144,70);doc.setFont('helvetica','bold');doc.setFontSize(10);doc.text(d.nf+' / '+d.ano,184,70,{align:'right'});doc.setFont('helvetica','normal');doc.setFontSize(8);doc.text('NOTA FISCAL Nº',144,78);doc.setFont('helvetica','bold');doc.setFontSize(14);doc.text(String(d.nf),184,78,{align:'right'});doc.setFont('helvetica','normal');doc.setFontSize(8);doc.text('VALOR DOS SERVIÇOS',144,86);doc.setFont('helvetica','bold');doc.setFontSize(10);doc.text(brl(d.valor),184,86,{align:'right'});let y=98;y=wrap(doc,'A empresa '+EMP+', estabelecida na '+END+', inscrita no CNPJ nº '+CNPJ+', recebeu(emos) de:',23,y,160)+4;y=wrap(doc,d.tom.toUpperCase(),23,y,160,10.5,true)+5;y=wrap(doc,'A importância de '+ext(d.valor)+', referente à Nota Fiscal nº '+d.nf+', correspondente aos serviços prestados.',23,y,160)+7;doc.setFillColor(241,242,244);doc.rect(23,y,162,19,'F');doc.setFont('helvetica','bold');doc.setFontSize(9);doc.text('DADOS BANCÁRIOS',28,y+7);doc.setFont('helvetica','normal');doc.text(d.banco+': AGÊNCIA Nº '+d.ag+'   CONTA Nº '+d.conta,28,y+14);y+=34;const dt=$('blankRecibo').checked?'TIANGUÁ, ____/____/'+d.ano:'TIANGUÁ, '+longa(d.data).toUpperCase();doc.setFontSize(10);doc.text(dt,105,y,{align:'center'});doc.line(60,y+25,150,y+25);doc.setFont('helvetica','bold');doc.text(d.rep,105,y+31,{align:'center'});doc.save('RECIBO_NF_'+d.nf+'.pdf')}
async function requerimento(){const d=dados(),{jsPDF}=window.jspdf,doc=new jsPDF();await timbre(doc,'REQUERIMENTO DE PAGAMENTO');doc.setTextColor(24,31,47);doc.setDrawColor(45);doc.setLineWidth(.35);doc.rect(138,63,52,22);doc.setFont('helvetica','normal');doc.setFontSize(8);doc.text('NOTA FISCAL Nº',144,70);doc.setFont('helvetica','bold');doc.setFontSize(14);doc.text(String(d.nf),184,70,{align:'right'});doc.setFont('helvetica','normal');doc.setFontSize(8);doc.text('VALOR TOTAL DOS SERVIÇOS',144,80);doc.setFont('helvetica','bold');doc.setFontSize(10);doc.text(brl(d.valor),184,80,{align:'right'});let y=98,dt=$('dateReq').checked?longa(d.data):'____ de ______________ de '+d.ano;doc.setFont('helvetica','bold');doc.setFontSize(9.5);doc.text('TIANGUÁ, '+dt.toUpperCase(),23,y);y+=12;y=wrap(doc,'A empresa '+EMP+', inscrita no CNPJ nº '+CNPJ+', estabelecida na '+END+', por meio de seu representante legal infra-assinado, vem, respeitosamente, requerer o pagamento a:',23,y,160)+5;y=wrap(doc,d.tom.toUpperCase(),23,y,160,10.5,true)+5;y=wrap(doc,'Da importância de '+ext(d.valor)+' ('+brl(d.valor)+'), referente à Nota Fiscal nº '+d.nf+', pelos serviços prestados.',23,y,160)+7;doc.setFont('helvetica','bold');doc.setFontSize(9);doc.text('DADOS BANCÁRIOS',23,y);doc.setFont('helvetica','normal');doc.text(d.banco+': AGÊNCIA Nº '+d.ag+'   CONTA Nº '+d.conta,23,y+7);y+=24;doc.setFontSize(9.5);doc.text('Nestes termos, pede deferimento.',23,y);doc.text('Para maior clareza, firmamos o presente.',23,y+8);doc.line(60,y+34,150,y+34);doc.setFont('helvetica','bold');doc.text(d.rep,105,y+40,{align:'center'});doc.save('REQUERIMENTO_NF_'+d.nf+'.pdf')}
function gerar(t){return t==='recibo'?recibo():requerimento()}
async function gerarAmbos(){await recibo();setTimeout(()=>requerimento(),500)}
