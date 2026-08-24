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
        ctx.globalAlpha=.075;
        ctx.drawImage(img,0,0);
        resolve({logo:img,marcaAgua:c.toDataURL('image/png')});
      }catch(e){resolve({logo:img,marcaAgua:null})}
    };
    img.onerror=reject;
    img.src='../logo-kmo.png';
  });
  return _marcaPromise;
}

async function folhaTimbrada(doc,titulo){
  doc.setFillColor(4,55,126);doc.rect(0,0,210,29,'F');
  doc.setFillColor(201,162,70);doc.rect(0,25.5,210,2.2,'F');
  doc.setFillColor(245,247,251);doc.rect(0,28.5,210,4,'F');
  doc.setDrawColor(201,162,70);doc.setLineWidth(1.2);doc.line(0,31.5,210,27.5);

  try{
    const m=await carregarMarca();
    doc.addImage(m.logo,'PNG',163,3.5,36,36,undefined,'FAST');
    if(m.marcaAgua)doc.addImage(m.marcaAgua,'PNG',50,80,110,110,undefined,'FAST');
  }catch(e){console.warn('Logo não carregada',e)}

  doc.setTextColor(25,32,48);doc.setFont('helvetica','bold');doc.setFontSize(15);
  doc.text(titulo,105,51,{align:'center'});
  doc.setDrawColor(201,162,70);doc.setLineWidth(.9);doc.line(18,57,192,57);

  doc.setFillColor(201,162,70);doc.rect(0,267.5,210,2.2,'F');
  doc.setFillColor(4,55,126);doc.rect(0,270,210,27,'F');
  doc.setTextColor(255);doc.setFont('helvetica','bold');doc.setFontSize(11);
  doc.text('KMO Gestão LTDA',194,278,{align:'right'});
  doc.setFont('helvetica','normal');doc.setFontSize(7.5);
  doc.text('CNPJ 34.655.687/0001-15',194,283,{align:'right'});
  doc.text('TV BENJAMIN CAVALCANTE, 123 - NENÊ PLÁCIDO - TIANGUÁ/CE',194,287,{align:'right'});
  doc.text('KMO.GESTAO@GMAIL.COM',194,291,{align:'right'});
  doc.setTextColor(23,32,51);
}

function linha(doc,label,valor,y){doc.setTextColor(23,32,51);doc.setFont('helvetica','bold');doc.setFontSize(10);doc.text(label,18,y);doc.setFont('helvetica','normal');let x=18+doc.getTextWidth(label)+3;doc.text(String(valor||'-'),x,y)}
function texto(doc,txt,x,y,w){doc.setTextColor(23,32,51);let a=doc.splitTextToSize(String(txt||''),w);doc.text(a,x,y);return y+a.length*5}
function dataLonga(s){let p=(s||'').split('/');if(p.length<3)return s||'';let m=['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];return (+p[0])+' de '+m[(+p[1])-1]+' de '+p[2]}
function porExtenso(v){if(window.valorPorExtenso)return window.valorPorExtenso(v);return brl(v)}

async function recibo(){
  let d=dados(),{jsPDF}=window.jspdf,doc=new jsPDF();
  await folhaTimbrada(doc,'RECIBO DE NOTA FISCAL');
  linha(doc,'NÚMERO DO RECIBO:',d.nf+' / '+d.ano,69);
  linha(doc,'NOTA FISCAL Nº:',d.nf,78);
  linha(doc,'VALOR:',brl(d.valor),87);
  doc.setFont('helvetica','normal');doc.setFontSize(10);
  let y=104;
  doc.text('A empresa '+EMP+', inscrita no CNPJ nº '+CNPJ+', declara ter recebido de:',18,y);
  doc.setFont('helvetica','bold');y=texto(doc,d.tom.toUpperCase(),18,y+10,174)+5;
  doc.setFont('helvetica','normal');y=texto(doc,'a importância de '+porExtenso(d.valor)+', referente à Nota Fiscal nº '+d.nf+', correspondente aos serviços prestados.',18,y,174)+7;
  doc.setFillColor(238,240,243);doc.roundedRect(18,y,174,24,3,3,'F');
  doc.setFont('helvetica','bold');doc.text('DADOS BANCÁRIOS',23,y+7);
  doc.setFont('helvetica','normal');doc.text(d.banco+' - AGÊNCIA '+d.ag+' - CONTA '+d.conta,23,y+15);
  y+=38;
  let dt=$('blankRecibo').checked?'Tianguá, ____/____/'+d.ano:'Tianguá, '+dataLonga(d.data)+'.';
  doc.text(dt,105,y,{align:'center'});
  doc.line(55,y+28,155,y+28);
  doc.setFont('helvetica','bold');doc.text(d.rep,105,y+35,{align:'center'});
  doc.save('RECIBO_NF_'+d.nf+'.pdf');
}

async function requerimento(){
  let d=dados(),{jsPDF}=window.jspdf,doc=new jsPDF();
  await folhaTimbrada(doc,'REQUERIMENTO DE PAGAMENTO');
  let y=70,dt=$('dateReq').checked?dataLonga(d.data):'____ de ______________ de '+d.ano;
  doc.setFont('helvetica','bold');doc.setFontSize(10);doc.text('TIANGUÁ, '+dt.toUpperCase(),18,y);
  doc.setFont('helvetica','normal');y=texto(doc,'A empresa '+EMP+', inscrita no CNPJ nº '+CNPJ+', estabelecida na '+END+', por meio de seu representante legal infra-assinado, vem respeitosamente requerer o pagamento a:',18,y+13,174)+6;
  doc.setFont('helvetica','bold');y=texto(doc,d.tom.toUpperCase(),18,y,174)+6;
  doc.setFont('helvetica','normal');y=texto(doc,'da importância de '+porExtenso(d.valor)+' ('+brl(d.valor)+'), referente à Nota Fiscal nº '+d.nf+', pelos serviços prestados.',18,y,174)+7;
  linha(doc,'BANCO:',d.banco,y);linha(doc,'AGÊNCIA:',d.ag,y+8);linha(doc,'CONTA:',d.conta,y+16);
  doc.text('Nestes termos, pede deferimento.',18,y+34);
  doc.text('Para maior clareza, firmamos o presente.',18,y+42);
  doc.line(55,y+76,155,y+76);
  doc.setFont('helvetica','bold');doc.text(d.rep,105,y+83,{align:'center'});
  doc.save('REQUERIMENTO_NF_'+d.nf+'.pdf');
}

async function gerar(t){if(t==='recibo')await recibo();else await requerimento()}
async function gerarAmbos(){await recibo();setTimeout(()=>requerimento(),500)}
