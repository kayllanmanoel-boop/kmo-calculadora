const DBKEY='kmo_driver_db_v2';
const emptyDB=()=>({drivers:[],routes:[],trips:[],activeTrip:null,settings:{adminPin:'2026',valuePerKm:3.50}});
let db=loadDB();
let gpsWatch=null,timer=null,adminUnlocked=false;
let driverMap=null,driverPath=null,driverStart=null,driverCurrent=null,driverFollow=true;
let adminMap=null,adminPath=null,adminStart=null,adminCurrent=null;
const $=id=>document.getElementById(id);
const qsa=s=>[...document.querySelectorAll(s)];

function loadDB(){
  try{
    const x=JSON.parse(localStorage.getItem(DBKEY));
    if(!x||typeof x!=='object') return emptyDB();
    x.drivers=Array.isArray(x.drivers)?x.drivers:[];
    x.routes=Array.isArray(x.routes)?x.routes:[];
    x.trips=Array.isArray(x.trips)?x.trips:[];
    x.settings=x.settings||{adminPin:'2026',valuePerKm:3.50};
    if(!x.settings.adminPin)x.settings.adminPin='2026';
    if(x.settings.valuePerKm===undefined)x.settings.valuePerKm=3.50;
    if(x.activeTrip){
      x.activeTrip.track=Array.isArray(x.activeTrip.track)?x.activeTrip.track:[];
      x.activeTrip.gpsPoints=x.activeTrip.gpsPoints||x.activeTrip.track.length||0;
      x.activeTrip.speedKmh=x.activeTrip.speedKmh||0;
    }
    return x;
  }catch{return emptyDB()}
}
function saveDB(){localStorage.setItem(DBKEY,JSON.stringify(db))}
function uid(prefix='id'){return prefix+'_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,8)}
function toast(msg){const el=$('toast');el.textContent=msg;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),2400)}
function esc(s=''){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function ptNum(n,d=2){return Number(n||0).toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d})}
function dt(v){return new Date(v)}
function dmy(v){return dt(v).toLocaleDateString('pt-BR')}
function hm(v){return dt(v).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}
function hms(v){return dt(v).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}
function duration(ms){ms=Math.max(0,ms||0);const h=Math.floor(ms/3600000),m=Math.floor(ms%3600000/60000),s=Math.floor(ms%60000/1000);return [h,m,s].map(x=>String(x).padStart(2,'0')).join(':')}
function hoursLabel(ms){const h=Math.floor(ms/3600000),m=Math.floor(ms%3600000/60000);return `${h}h${String(m).padStart(2,'0')}`}
function byId(arr,id){return arr.find(x=>x.id===id)}
function hav(a,b){const R=6371,toR=x=>x*Math.PI/180,dLat=toR(b.lat-a.lat),dLon=toR(b.lng-a.lng),la1=toR(a.lat),la2=toR(b.lat);const h=Math.sin(dLat/2)**2+Math.cos(la1)*Math.cos(la2)*Math.sin(dLon/2)**2;return 2*R*Math.asin(Math.sqrt(h))}
function coordText(c){return c&&Number.isFinite(c.lat)&&Number.isFinite(c.lng)?`${c.lat.toFixed(6)}, ${c.lng.toFixed(6)}`:'—'}
function isOnline(){const on=navigator.onLine;$('onlineBadge').textContent=on?'● Online':'● Offline';$('onlineBadge').classList.toggle('offline',!on)}
window.addEventListener('online',isOnline);window.addEventListener('offline',isOnline);

qsa('.tab').forEach(b=>b.addEventListener('click',()=>{
  qsa('.tab').forEach(x=>x.classList.remove('active'));qsa('.page').forEach(x=>x.classList.remove('active'));
  b.classList.add('active');$(b.dataset.tab).classList.add('active');
  setTimeout(()=>{
    if(b.dataset.tab==='driver'&&db.activeTrip){ensureDriverMap();updateDriverMap(db.activeTrip,true)}
    if(b.dataset.tab==='admin'&&adminUnlocked){renderAdmin();setTimeout(()=>{if(adminMap)adminMap.invalidateSize()},80)}
  },30);
}));

function fillSelects(){
  const d=$('tripDriver'),r=$('tripRoute'),curD=d.value,curR=r.value;
  d.innerHTML='<option value="">Selecione...</option>'+db.drivers.map(x=>`<option value="${x.id}">${esc(x.name)} — ${esc(x.plate||x.vehicle||'sem veículo')}</option>`).join('');
  r.innerHTML='<option value="">Selecione...</option>'+db.routes.map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join('');
  if([...d.options].some(o=>o.value===curD))d.value=curD;
  if([...r.options].some(o=>o.value===curR))r.value=curR;
}

$('driverForm').addEventListener('submit',e=>{
  e.preventDefault();const name=$('drvName').value.trim();if(!name)return;
  db.drivers.push({id:uid('drv'),name,phone:$('drvPhone').value.trim(),cnh:$('drvCnh').value.trim(),vehicle:$('drvVehicle').value.trim(),plate:$('drvPlate').value.trim().toUpperCase(),capacity:+$('drvCapacity').value||0,createdAt:new Date().toISOString()});
  saveDB();e.target.reset();$('drvCapacity').value=5;fillSelects();toast('Motorista cadastrado');
});
$('routeForm').addEventListener('submit',e=>{
  e.preventDefault();const name=$('routeName').value.trim();if(!name)return;
  db.routes.push({id:uid('route'),name,school:$('routeSchool').value.trim(),shift:$('routeShift').value,expectedKm:+$('routeExpectedKm').value||0,origin:$('routeOrigin').value.trim(),destination:$('routeDestination').value.trim(),description:$('routeDescription').value.trim(),createdAt:new Date().toISOString()});
  saveDB();e.target.reset();fillSelects();toast('Rota cadastrada');
});

function startTrip(){
  const driverId=$('tripDriver').value,routeId=$('tripRoute').value;
  if(!driverId||!routeId){toast('Selecione motorista e rota');return}
  if(!navigator.geolocation){toast('Este aparelho não oferece GPS');return}
  const btn=$('startTrip');btn.disabled=true;btn.textContent='📍 OBTENDO LOCALIZAÇÃO...';
  navigator.geolocation.getCurrentPosition(p=>{
    const now=Date.now();
    const c={lat:p.coords.latitude,lng:p.coords.longitude,accuracy:p.coords.accuracy||999,at:now,speedKmh:Number.isFinite(p.coords.speed)?Math.max(0,p.coords.speed*3.6):0};
    db.activeTrip={id:uid('trip'),driverId,routeId,startAt:new Date(now).toISOString(),km:0,startCoord:c,currentCoord:c,lastCoord:c,lastGpsAt:new Date(now).toISOString(),gpsPoints:1,speedKmh:c.speedKmh,track:[c]};
    saveDB();renderActiveTrip();startGps();startTimer();toast('Rota iniciada e georreferenciamento ativo');btn.disabled=false;btn.textContent='▶ INICIAR ROTA';
  },err=>{
    btn.disabled=false;btn.textContent='▶ INICIAR ROTA';
    const map={1:'Permita o acesso à localização para iniciar a rota',2:'GPS indisponível neste momento',3:'O GPS demorou para responder'};toast(map[err.code]||'Não foi possível obter a localização');
  },{enableHighAccuracy:true,timeout:20000,maximumAge:0});
}
$('startTrip').addEventListener('click',startTrip);

function startGps(){
  if(!db.activeTrip||gpsWatch!==null)return;
  $('gpsStatus').textContent='GPS conectado';
  gpsWatch=navigator.geolocation.watchPosition(onGps,onGpsError,{enableHighAccuracy:true,maximumAge:1000,timeout:20000});
}
function stopGps(){if(gpsWatch!==null&&navigator.geolocation){navigator.geolocation.clearWatch(gpsWatch);gpsWatch=null}}
function onGps(p){
  if(!db.activeTrip)return;
  const now=Date.now();
  const c={lat:p.coords.latitude,lng:p.coords.longitude,accuracy:p.coords.accuracy||999,at:now,speedKmh:0};
  const a=db.activeTrip,last=a.lastCoord;
  let computedSpeed=0;
  if(last){const hours=Math.max((now-last.at)/3600000,1/3600000);computedSpeed=hav(last,c)/hours}
  c.speedKmh=Number.isFinite(p.coords.speed)&&p.coords.speed>=0?p.coords.speed*3.6:computedSpeed;
  a.currentCoord=c;a.speedKmh=Math.min(220,Math.max(0,c.speedKmh||0));
  $('gpsStatus').textContent=c.accuracy<=30?'GPS excelente':c.accuracy<=70?'GPS ativo':'GPS baixa precisão';
  $('liveCoords').textContent=coordText(c);$('liveAccuracy').textContent=`Precisão ±${Math.round(c.accuracy)} m`;
  if(c.accuracy<=100){
    if(last){
      const dist=hav(last,c),elapsed=Math.max(1,(now-last.at)/3600000),speed=dist/elapsed;
      if(dist>=0.004&&dist<=1.5&&speed<=180)a.km+=dist;
    }
    const lastTrack=a.track?.[a.track.length-1];
    if(!lastTrack||hav(lastTrack,c)>=0.004||(now-lastTrack.at)>=15000){
      a.track=a.track||[];a.track.push(c);if(a.track.length>6000)a.track.splice(0,a.track.length-6000);
    }
    a.lastCoord=c;a.lastGpsAt=new Date(now).toISOString();a.gpsPoints=(a.gpsPoints||0)+1;
    saveDB();
  }
  updateLiveMetrics();updateDriverMap(a);if(adminUnlocked)updateAdminLive(a);
}
function onGpsError(err){
  if(!db.activeTrip)return;const map={1:'Permissão de GPS negada',2:'GPS indisponível',3:'GPS demorando'};
  $('gpsStatus').textContent=map[err.code]||'Erro no GPS';$('liveAccuracy').textContent='Verifique a localização do celular';
}
function startTimer(){
  clearInterval(timer);const tick=()=>{if(!db.activeTrip)return;updateLiveMetrics();if(adminUnlocked)updateAdminLive(db.activeTrip)};tick();timer=setInterval(tick,1000);
}
function stopTimer(){clearInterval(timer);timer=null}
function updateLiveMetrics(){
  const a=db.activeTrip;if(!a)return;
  $('liveKm').textContent=ptNum(a.km);$('liveTime').textContent=duration(Date.now()-dt(a.startAt).getTime());$('liveSpeed').textContent=`${Math.round(a.speedKmh||0)} km/h`;
  $('gpsPoints').textContent=a.gpsPoints||0;$('lastGpsUpdate').textContent=a.lastGpsAt?hms(a.lastGpsAt):'—';$('tripStartCoord').textContent=coordText(a.startCoord);
  if(a.currentCoord){$('liveCoords').textContent=coordText(a.currentCoord);$('liveAccuracy').textContent=`Precisão ±${Math.round(a.currentCoord.accuracy||0)} m`}
}

function baseMap(el){
  const m=L.map(el,{zoomControl:true,attributionControl:true}).setView([-14.235,-51.925],4);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; OpenStreetMap'}).addTo(m);
  return m;
}
function ensureDriverMap(){
  if(driverMap||!window.L)return;
  driverMap=baseMap('driverMap');
  driverPath=L.polyline([],{color:'#111827',weight:5,opacity:.85}).addTo(driverMap);
  driverMap.on('dragstart zoomstart',()=>driverFollow=false);
}
function updateDriverMap(a,force=false){
  if(!a||!window.L)return;ensureDriverMap();if(!driverMap)return;
  const pts=(a.track||[]).map(p=>[p.lat,p.lng]);driverPath.setLatLngs(pts);
  if(a.startCoord){const ll=[a.startCoord.lat,a.startCoord.lng];if(!driverStart)driverStart=L.circleMarker(ll,{radius:7,color:'#15803d',fillColor:'#22c55e',fillOpacity:1,weight:3}).addTo(driverMap).bindTooltip('Início da rota');else driverStart.setLatLng(ll)}
  if(a.currentCoord){const ll=[a.currentCoord.lat,a.currentCoord.lng];if(!driverCurrent)driverCurrent=L.circleMarker(ll,{radius:9,color:'#1d4ed8',fillColor:'#3b82f6',fillOpacity:1,weight:4}).addTo(driverMap).bindTooltip('Veículo');else driverCurrent.setLatLng(ll);if(driverFollow||force)driverMap.setView(ll,Math.max(driverMap.getZoom(),16))}
  setTimeout(()=>driverMap.invalidateSize(),30);
}
$('centerDriverMap').addEventListener('click',()=>{driverFollow=true;if(db.activeTrip?.currentCoord)updateDriverMap(db.activeTrip,true)});
$('openCurrentMap').addEventListener('click',()=>{const c=db.activeTrip?.currentCoord;if(!c){toast('Aguardando posição atual');return}window.open(`https://www.google.com/maps?q=${c.lat},${c.lng}`,'_blank')});

function clearAdminMapLayers(){
  if(adminPath)adminPath.setLatLngs([]);if(adminStart){adminMap.removeLayer(adminStart);adminStart=null}if(adminCurrent){adminMap.removeLayer(adminCurrent);adminCurrent=null}
}
function ensureAdminMap(){
  if(adminMap||!window.L)return;
  adminMap=baseMap('adminMap');adminPath=L.polyline([],{color:'#111827',weight:5,opacity:.85}).addTo(adminMap);
}
function updateAdminLive(a){
  if(!adminUnlocked)return;ensureAdminMap();
  const badge=$('adminLiveBadge');
  if(!a){badge.textContent='Sem rota ativa';badge.classList.remove('live-pill');$('adminLiveDriver').textContent='—';$('adminLiveRoute').textContent='—';$('adminLiveKm').textContent='0,00';$('adminLiveTime').textContent='00:00:00';$('adminLiveCoords').textContent='—';$('adminLiveAccuracy').textContent='—';if(adminMap){clearAdminMapLayers();adminMap.setView([-14.235,-51.925],4)}return}
  badge.textContent='● Rota ativa';badge.classList.add('live-pill');
  const d=byId(db.drivers,a.driverId),r=byId(db.routes,a.routeId);
  $('adminLiveDriver').textContent=d?.name||'—';$('adminLiveRoute').textContent=r?.name||'—';$('adminLiveKm').textContent=ptNum(a.km);$('adminLiveTime').textContent=duration(Date.now()-dt(a.startAt).getTime());$('adminLiveCoords').textContent=coordText(a.currentCoord);$('adminLiveAccuracy').textContent=a.currentCoord?`±${Math.round(a.currentCoord.accuracy||0)} m`:'—';
  if(!adminMap)return;
  const pts=(a.track||[]).map(p=>[p.lat,p.lng]);adminPath.setLatLngs(pts);
  if(a.startCoord){const ll=[a.startCoord.lat,a.startCoord.lng];if(!adminStart)adminStart=L.circleMarker(ll,{radius:7,color:'#15803d',fillColor:'#22c55e',fillOpacity:1,weight:3}).addTo(adminMap).bindTooltip('Início');else adminStart.setLatLng(ll)}
  if(a.currentCoord){const ll=[a.currentCoord.lat,a.currentCoord.lng];if(!adminCurrent)adminCurrent=L.circleMarker(ll,{radius:9,color:'#1d4ed8',fillColor:'#3b82f6',fillOpacity:1,weight:4}).addTo(adminMap).bindTooltip('Veículo KMO');else adminCurrent.setLatLng(ll);adminMap.setView(ll,Math.max(adminMap.getZoom(),15))}
  setTimeout(()=>adminMap.invalidateSize(),30);
}

function renderActiveTrip(){
  const a=db.activeTrip;$('noActiveTrip').classList.toggle('hidden',!!a);$('activeTrip').classList.toggle('hidden',!a);if(!a)return;
  const driver=byId(db.drivers,a.driverId),route=byId(db.routes,a.routeId);$('activeRouteName').textContent=route?.name||'Rota';$('activeDriverName').textContent=`Motorista: ${driver?.name||'—'}${driver?.plate?' • '+driver.plate:''}`;
  updateLiveMetrics();setTimeout(()=>{ensureDriverMap();updateDriverMap(a,true)},80);
}

$('finishTrip').addEventListener('click',()=>{
  if(!db.activeTrip)return;if(!confirm('Encerrar esta rota e salvar o relatório georreferenciado?'))return;
  const a=db.activeTrip,endAt=new Date().toISOString();const trip={...a,endAt,durationMs:dt(endAt)-dt(a.startAt),km:+a.km.toFixed(3),status:'finalizada'};
  delete trip.lastCoord;db.trips.push(trip);db.activeTrip=null;saveDB();stopGps();stopTimer();renderActiveTrip();
  if(driverMap){driverMap.remove();driverMap=null;driverPath=null;driverStart=null;driverCurrent=null;driverFollow=true}
  toast(`Rota encerrada • ${ptNum(trip.km)} km`);if(adminUnlocked)renderAdmin();
});

$('unlockAdmin').addEventListener('click',()=>{
  if($('adminPin').value===String(db.settings.adminPin||'2026')){adminUnlocked=true;$('adminLock').classList.add('hidden');$('adminPanel').classList.remove('hidden');$('adminPin').value='';renderAdmin();setTimeout(()=>{ensureAdminMap();updateAdminLive(db.activeTrip)},80)}else toast('PIN incorreto')
});
$('adminPin').addEventListener('keydown',e=>{if(e.key==='Enter')$('unlockAdmin').click()});
$('lockAdmin').addEventListener('click',()=>{adminUnlocked=false;$('adminPanel').classList.add('hidden');$('adminLock').classList.remove('hidden')});

function mondayRange(){const now=new Date(),day=(now.getDay()+6)%7,m=new Date(now.getFullYear(),now.getMonth(),now.getDate()-day),e=new Date(m);e.setDate(e.getDate()+6);const f=x=>`${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}-${String(x.getDate()).padStart(2,'0')}`;return[f(m),f(e)]}
function reportTrips(){const from=$('reportFrom').value,to=$('reportTo').value;return db.trips.filter(t=>{const d=t.startAt.slice(0,10);return(!from||d>=from)&&(!to||d<=to)}).sort((a,b)=>dt(b.startAt)-dt(a.startAt))}
function renderAdmin(){
  if(!adminUnlocked)return;
  const trips=reportTrips(),km=trips.reduce((s,t)=>s+(t.km||0),0),ms=trips.reduce((s,t)=>s+(t.durationMs||0),0),gps=trips.reduce((s,t)=>s+(t.gpsPoints||t.track?.length||0),0);
  $('weekKm').textContent=ptNum(km);$('weekHours').textContent=hoursLabel(ms);$('weekTrips').textContent=trips.length;$('weekGpsPoints').textContent=gps;
  $('reportRows').innerHTML=trips.length?trips.map(t=>{const d=byId(db.drivers,t.driverId),r=byId(db.routes,t.routeId);return `<tr><td>${dmy(t.startAt)}</td><td>${esc(d?.name||'—')}</td><td>${esc(r?.name||'—')}</td><td>${hm(t.startAt)}</td><td>${t.endAt?hm(t.endAt):'—'}</td><td>${duration(t.durationMs)}</td><td><strong>${ptNum(t.km)}</strong></td><td>${t.gpsPoints||t.track?.length||0}</td></tr>`}).join(''):'<tr><td colspan="8" class="empty">Nenhuma rota no período.</td></tr>';
  $('driversTotal').textContent=db.drivers.length;$('routesTotal').textContent=db.routes.length;
  $('driversList').innerHTML=db.drivers.length?db.drivers.map(d=>{const ts=db.trips.filter(t=>t.driverId===d.id),k=ts.reduce((s,t)=>s+(t.km||0),0);return `<div class="list-item"><div><strong>${esc(d.name)}</strong><small>${esc(d.vehicle||'Veículo não informado')} ${d.plate?'• '+esc(d.plate):''}</small></div><div><strong>${ptNum(k)} km</strong><small>${ts.length} rotas</small></div></div>`}).join(''):'<div class="empty">Nenhum motorista.</div>';
  $('routesList').innerHTML=db.routes.length?db.routes.map(r=>{const ts=db.trips.filter(t=>t.routeId===r.id),k=ts.reduce((s,t)=>s+(t.km||0),0);return `<div class="list-item"><div><strong>${esc(r.name)}</strong><small>${esc([r.origin,r.destination].filter(Boolean).join(' → ')||r.school||r.shift||'')}</small></div><div><strong>${ptNum(k)} km</strong><small>${ts.length} viagens</small></div></div>`}).join(''):'<div class="empty">Nenhuma rota.</div>';
  $('valuePerKm').value=db.settings.valuePerKm??3.5;updateAdminLive(db.activeTrip);
}
$('applyReport').addEventListener('click',renderAdmin);

function csvCell(v){v=String(v??'').replace(/"/g,'""');return `"${v}"`}
$('exportCsv').addEventListener('click',()=>{
  const rows=[['Data','Motorista','Veiculo','Placa','Rota','Origem','Destino','Inicio','Fim','Duracao','KM','Pontos GPS','Valor KM','Total']];
  reportTrips().forEach(t=>{const d=byId(db.drivers,t.driverId),r=byId(db.routes,t.routeId),vk=+db.settings.valuePerKm||0;rows.push([dmy(t.startAt),d?.name||'',d?.vehicle||'',d?.plate||'',r?.name||'',r?.origin||'',r?.destination||'',hm(t.startAt),t.endAt?hm(t.endAt):'',duration(t.durationMs),(t.km||0).toFixed(3),t.gpsPoints||t.track?.length||0,vk.toFixed(2),((t.km||0)*vk).toFixed(2)])});
  download('relatorio-kmo-driver.csv','\ufeff'+rows.map(r=>r.map(csvCell).join(';')).join('\n'),'text/csv;charset=utf-8');
});
function download(name,data,type){const a=document.createElement('a'),blob=new Blob([data],{type});a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},300)}
$('backupJson').addEventListener('click',()=>download(`backup-kmo-driver-${new Date().toISOString().slice(0,10)}.json`,JSON.stringify(db,null,2),'application/json'));
$('importJson').addEventListener('change',e=>{const f=e.target.files?.[0];if(!f)return;const rd=new FileReader();rd.onload=()=>{try{const x=JSON.parse(rd.result);if(!x.drivers||!x.routes||!x.trips)throw 0;db=x;db.settings=db.settings||{adminPin:'2026',valuePerKm:3.5};saveDB();fillSelects();renderActiveTrip();if(adminUnlocked)renderAdmin();toast('Backup importado')}catch{toast('Arquivo de backup inválido')}};rd.readAsText(f);e.target.value=''});
$('saveSettings').addEventListener('click',()=>{db.settings.valuePerKm=+$('valuePerKm').value||0;const pin=$('newPin').value.trim();if(pin)db.settings.adminPin=pin;saveDB();$('newPin').value='';toast('Configurações salvas')});

const [rf,rt]=mondayRange();$('reportFrom').value=rf;$('reportTo').value=rt;
isOnline();fillSelects();renderActiveTrip();
if(db.activeTrip){startGps();startTimer()}
if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));