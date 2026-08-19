(function(){
  const money=n=>Number(n||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  const style=document.createElement('style');
  style.textContent=`
    #activeTrip:not(.hidden){padding-bottom:96px}
    #activeTrip:not(.hidden) #finishTrip{position:fixed;left:50%;bottom:max(14px,env(safe-area-inset-bottom));transform:translateX(-50%);width:min(720px,calc(100% - 24px));z-index:1200;margin:0!important;padding:18px 22px!important;border-radius:18px!important;font-size:17px!important;letter-spacing:.3px;box-shadow:0 14px 34px rgba(127,29,29,.34),0 0 0 4px rgba(255,255,255,.92);background:linear-gradient(180deg,#ef4444,#b91c1c)!important;border:1px solid #991b1b!important}
    .pay-stat{background:linear-gradient(180deg,#fff,#fff8e7)!important;border-color:#efd595!important}
    .pay-stat strong{color:#8a6423!important;font-size:24px!important}
    .pay-editor{display:flex;gap:6px;align-items:center;min-width:210px}.pay-editor input{width:110px;padding:8px 9px;border:1px solid #d6b45f;border-radius:9px;font-size:12px}.pay-editor button{padding:8px 10px;border:0;border-radius:9px;background:#0c3b86;color:#fff;font-weight:800;cursor:pointer}.pay-cell small{display:block;color:#8a6c32;margin-top:5px;white-space:normal;line-height:1.25}.pay-unset input{background:#fffdf7}.pay-set input{background:#f0fdf4;border-color:#86efac}
    @media(max-width:620px){#activeTrip:not(.hidden) #finishTrip{width:calc(100% - 18px);bottom:max(9px,env(safe-area-inset-bottom));padding:16px 14px!important;font-size:15px!important}.pay-editor{min-width:180px}.pay-editor input{width:92px}}
  `;
  document.head.appendChild(style);

  function enhanceFinish(){
    const btn=document.getElementById('finishTrip');
    if(btn&&btn.textContent.indexOf('E SALVAR')<0)btn.textContent='■ ENCERRAR ROTA E SALVAR';
  }
  function currentTrips(){try{return typeof reportTrips==='function'?reportTrips():[]}catch{return []}}
  function assignedPay(t){
    if(t.driverPay===null||t.driverPay===undefined||t.driverPay==='')return null;
    const n=Number(t.driverPay);return Number.isFinite(n)?n:null;
  }
  function ensurePayStat(){
    const stats=document.querySelector('.premium-stats')||document.querySelector('#adminPanel .cards4');
    if(!stats)return null;
    let box=document.getElementById('weekPayBox');
    if(!box){
      box=document.createElement('div');box.id='weekPayBox';box.className='stat card pay-stat';
      box.innerHTML='<span>VALOR MOTORISTAS</span><strong id="weekPay">R$ 0,00</strong><small id="weekPayInfo">Opcional por rota</small>';
      stats.appendChild(box);
    }
    return box;
  }
  function updatePaySummary(){
    ensurePayStat();
    const trips=currentTrips(),vals=trips.map(assignedPay).filter(v=>v!==null),total=vals.reduce((s,v)=>s+v,0);
    const el=document.getElementById('weekPay'),info=document.getElementById('weekPayInfo');
    if(el)el.textContent=money(total);
    if(info)info.textContent=vals.length?`${vals.length} de ${trips.length} rota(s) com valor`:'Nenhum valor informado';
  }
  function paymentCell(t){
    const val=assignedPay(t),rate=Number(db?.settings?.valuePerKm||0),suggested=Number(t.km||0)*rate;
    const cell=document.createElement('td');cell.className='pay-cell '+(val===null?'pay-unset':'pay-set');cell.dataset.payCell=t.id;
    cell.innerHTML=`<div class="pay-editor"><input data-pay-input="${t.id}" type="number" min="0" step="0.01" inputmode="decimal" placeholder="Opcional" value="${val===null?'':val.toFixed(2)}"><button type="button" data-pay-save="${t.id}">Salvar</button></div><small>${rate>0?'Sugestão por KM: '+money(suggested):'Valor opcional definido pela administração'}</small>`;
    return cell;
  }
  function enhanceReport(){
    const body=document.getElementById('reportRows');if(!body)return;
    const table=body.closest('table'),head=table?.tHead?.rows?.[0];
    if(head&&!head.querySelector('[data-pay-head]')){const th=document.createElement('th');th.dataset.payHead='1';th.textContent='VALOR MOTORISTA';head.appendChild(th)}
    const trips=currentTrips(),rows=[...body.querySelectorAll('tr')];
    if(!trips.length){const td=rows[0]?.querySelector('td');if(td)td.colSpan=9;updatePaySummary();return}
    rows.forEach((row,i)=>{
      const t=trips[i];if(!t)return;
      let cell=row.querySelector(`[data-pay-cell="${t.id}"]`);
      if(!cell)row.appendChild(paymentCell(t));
      else if(document.activeElement!==cell.querySelector('input')){
        const input=cell.querySelector('input'),v=assignedPay(t);if(input)input.value=v===null?'':v.toFixed(2);
        cell.classList.toggle('pay-set',v!==null);cell.classList.toggle('pay-unset',v===null);
      }
    });
    updatePaySummary();
  }
  function savePayment(id){
    const trip=db.trips.find(t=>t.id===id),input=document.querySelector(`[data-pay-input="${id}"]`);if(!trip||!input)return;
    const raw=String(input.value||'').trim().replace(',','.');
    if(raw==='')trip.driverPay=null;
    else{const n=Number(raw);if(!Number.isFinite(n)||n<0){toast('Informe um valor válido ou deixe em branco');return}trip.driverPay=Math.round(n*100)/100}
    trip.driverPayUpdatedAt=new Date().toISOString();saveDB();toast(trip.driverPay===null?'Valor do motorista removido':'Valor do motorista salvo');enhanceReport();
  }
  document.addEventListener('click',e=>{const b=e.target.closest('[data-pay-save]');if(b)savePayment(b.dataset.paySave)});
  document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.matches('[data-pay-input]')){e.preventDefault();savePayment(e.target.dataset.payInput)}});

  function replaceExport(){
    const old=document.getElementById('exportCsv');if(!old||old.dataset.payExport==='1')return;
    const btn=old.cloneNode(true);btn.dataset.payExport='1';old.replaceWith(btn);
    btn.addEventListener('click',()=>{
      const rows=[['Data','Motorista','Veiculo','Placa','Rota','Origem','Destino','Inicio','Fim','Duracao','KM','Pontos GPS','Valor KM referencia','Valor estimado KM','Valor motorista']];
      currentTrips().forEach(t=>{const d=byId(db.drivers,t.driverId),r=byId(db.routes,t.routeId),vk=+db.settings.valuePerKm||0,p=assignedPay(t);rows.push([dmy(t.startAt),d?.name||'',d?.vehicle||'',d?.plate||'',r?.name||'',r?.origin||'',r?.destination||'',hm(t.startAt),t.endAt?hm(t.endAt):'',duration(t.durationMs),(t.km||0).toFixed(3),t.gpsPoints||t.track?.length||0,vk.toFixed(2),((t.km||0)*vk).toFixed(2),p===null?'':p.toFixed(2)])});
      download('relatorio-kmo-driver.csv','\ufeff'+rows.map(r=>r.map(csvCell).join(';')).join('\n'),'text/csv;charset=utf-8');
    });
  }
  function enhance(){enhanceFinish();replaceExport();const panel=document.getElementById('adminPanel');if(panel&&!panel.classList.contains('hidden'))enhanceReport()}
  enhance();setInterval(enhance,700);
})();
