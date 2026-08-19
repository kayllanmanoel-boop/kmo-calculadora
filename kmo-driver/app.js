const DBKEY='kmo_driver_db_v2';
const emptyDB=()=>({drivers:[],routes:[],students:[],trips:[],activeTrip:null,settings:{adminPin:'2026',valuePerKm:3.50}});
let db=loadDB(),gpsWatch=null,timer=null,adminUnlocked=false;
const $=id=>document.getElementById(id);
const qsa=s=>[...document.querySelectorAll(s)];
function loadDB(){try{const x=JSON.parse(localStorage.getItem(DBKEY));return x&&x.settings?x:emptyDB()}catch{return emptyDB()}}
function saveDB(){localStorage.setItem(DBKEY,JSON.stringify(db))}
function uid(prefix='id'){return prefix+'_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,8)}
function toast(msg){const el=$('toast');el.textContent=msg;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),2200)}
function esc(s=''){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function ptNum(n,d=2){return Number(n||0).toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d})}
function dt(v){return new Date(v)}
function dmy(v){return dt(v).toLocaleDateString('pt-BR')}
function hm(v){return dt(v).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}
function duration(ms){ms=Math.max(0,ms||0);const h=Math.floor(ms/3600000),m=Math.floor(ms%3600000/60000),s=Math.floor(ms%60000/1000);return [h,m,s].map(x=>String(x).padStart(2,'0')).join(':')}
function hoursLabel(ms){const h=Math.floor(ms/3600000),m=Math.floor(ms%3600000/60000);return `${h}h${String(m).padStart(2,'0')}`}
function byId(arr,id){return arr.find(x=>x.id===id)}
function hav(a,b){const R=6371,toR=x=>x*Math.PI/180,dLat=toR(b.lat-a.lat),dLon=toR(b.lng-a.lng),la1=toR(a.lat),la2=toR(b.lat);const h=Math.sin(dLat/2)**2+Math.cos(la1)*Math.cos(la2)*Math.sin(dLon/2)**2;return 2*R*Math.asin(Math.sqrt(h))}
function isOnline(){const on=navigator.onLine;$('onlineBadge').textContent=on?'● Online':'● Offline';$('onlineBadge').classList.toggle('offline',!on)}
window.addEventListener('online',isOnline);window.addEventListener('offline',isOnline);

qsa('.tab').forEach(b=>b.addEventListener('click',()=>{qsa('.tab').forEach(x=>x.classList.remove('active'));qsa('.page').forEach(x=>x.classList.remove('active'));b.classList.add('active');$(b.dataset.tab).classList.add('active');if(b.dataset.tab==='admin'&&adminUnlocked)renderAdmin()}));

function fillSelects(){
 const d=$('tripDriver'),r=$('tripRoute'),sr=$('stdRoute');
 const curD=d.value,curR=r.value,curSR=sr.value;
 d.innerHTML='<option value="">Selecione...</option>'+db.drivers.map(x=>`<option value="${x.id}">${esc(x.name)} — ${esc(x.plate||x.vehicle||'sem veículo')}</option>`).join('');
 r.innerHTML='<option value="">Selecione...</option>'+db.routes.map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join('');
 sr.innerHTML='<option value="">Selecione...</option>'+db.routes.map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join('');
 if([...d.options].some(o=>o.value===curD))d.value=curD;if([...r.options].some(o=>o.value===curR))r.value=curR;if([...sr.options].some(o=>o.value===curSR))sr.value=curSR;
}

$('driverForm').addEventListener('submit',e=>{e.preventDefault();const name=$('drvName').value.trim();if(!name)return;db.drivers.push({id:uid('drv'),name,phone:$('drvPhone').value.trim(),cnh:$('drvCnh').value.trim(),vehicle:$('drvVehicle').value.trim(),plate:$('drvPlate').value.trim().toUpperCase(),capacity:+$('drvCapacity').value||0,createdAt:new Date().toISOString()});saveDB();e.target.reset();$('drvCapacity').value=5;fillSelects();toast('Motorista cadastrado')});
$('routeForm').addEventListener('submit',e=>{e.preventDefault();const name=$('routeName').value.trim();if(!name)return;db.routes.push({id:uid('route'),name,school:$('routeSchool').value.trim(),shift:$('routeShift').value,expectedKm:+$('routeExpectedKm').value||0,description:$('routeDescription').value.trim(),createdAt:new Date().toISOString()});saveDB();e.target.reset();fillSelects();toast('Rota cadastrada')});
$('studentForm').addEventListener('submit',e=>{e.preventDefault();const name=$('stdName').value.trim(),routeId=$('stdRoute').value,stop=$('stdStop').value.trim();if(!name||!routeId||!stop){toast('Preencha aluno, rota e local');return}db.students.push({id:uid('std'),name,routeId,stop,lat:$('stdLat').value?+$('stdLat').value:null,lng:$('stdLng').value?+$('stdLng').value:null,createdAt:new Date().toISOString()});saveDB();e.target.reset();fillSelects();toast('Aluno/ponto cadastrado')});
$('useCurrentLocation').addEventListener('click',()=>{if(!navigator.geolocation){toast('GPS não disponível');return}toast('Obtendo localização...');navigator.geolocation.getCurrentPosition(p=>{$('stdLat').value=p.coords.latitude.toFixed(6);$('stdLng').value=p.coords.longitude.toFixed(6);toast('Localização preenchida')},()=>toast('Não foi possível obter o GPS'),{enableHighAccuracy:true,timeout:12000,maximumAge:0})});

function startTrip(){const driverId=$('tripDriver').value,routeId=$('tripRoute').value;if(!driverId||!routeId){toast('Selecione motorista e rota');return}if(!navigator.geolocation){toast('Este aparelho não oferece GPS');return}const students=db.students.filter(s=>s.routeId===routeId);db.activeTrip={id:uid('trip'),driverId,routeId,startAt:new Date().toISOString(),km:0,lastCoord:null,lastGpsAt:null,currentCoord:null,gpsPoints:0,deliveries:[],studentIds:students.map(s=>s.id)};saveDB();renderActiveTrip();startGps();startTimer();toast('Rota ativada')}
$('startTrip').addEventListener('click',startTrip);

function startGps(){if(!db.activeTrip||gpsWatch!==null)return;$('gpsStatus').textContent='Conectando ao GPS...';gpsWatch=navigator.geolocation.watchPosition(onGps,onGpsError,{enableHighAccuracy:true,maximumAge:1000,timeout:15000})}
function stopGps(){if(gpsWatch!==null&&navigator.geolocation){navigator.geolocation.clearWatch(gpsWatch);gpsWatch=null}}
function onGps(p){if(!db.activeTrip)return;const c={lat:p.coords.latitude,lng:p.coords.longitude,accuracy:p.coords.accuracy||999,at:Date.now()};db.activeTrip.currentCoord=c;$('gpsStatus').textContent=c.accuracy<=40?'GPS excelente':c.accuracy<=80?'GPS ativo':'GPS baixa precisão';$('liveCoords').textContent=`${c.lat.toFixed(6)}, ${c.lng.toFixed(6)}`;$('liveAccuracy').textContent=`Precisão ±${Math.round(c.accuracy)} m`;
 if(c.accuracy<=100){const last=db.activeTrip.lastCoord;if(last){const dist=hav(last,c),elapsed=Math.max(1,(c.at-last.at)/3600000),speed=dist/elapsed;const reasonable=dist<=1.5&&speed<=180;if(dist>=0.005&&reasonable)db.activeTrip.km+=dist}db.activeTrip.lastCoord=c;db.activeTrip.lastGpsAt=new Date().toISOString();db.activeTrip.gpsPoints=(db.activeTrip.gpsPoints||0)+1;saveDB();$('liveKm').textContent=ptNum(db.activeTrip.km)} }
function onGpsError(err){if(!db.activeTrip)return;const map={1:'Permissão de GPS negada',2:'GPS indisponível',3:'GPS demorando'};$('gpsStatus').textContent=map[err.code]||'Erro no GPS';$('liveAccuracy').textContent='Verifique a localização do celular'}
function startTimer(){clearInterval(timer);const tick=()=>{if(db.activeTrip)$('liveTime').textContent=duration(Date.now()-dt(db.activeTrip.startAt).getTime())};tick();timer=setInterval(tick,1000)}
function stopTimer(){clearInterval(timer);timer=null}

function renderActiveTrip(){const a=db.activeTrip;$('noActiveTrip').classList.toggle('hidden',!!a);$('activeTrip').classList.toggle('hidden',!a);if(!a)return;const driver=byId(db.drivers,a.driverId),route=byId(db.routes,a.routeId);$('activeRouteName').textContent=route?.name||'Rota';$('activeDriverName').textContent=`Motorista: ${driver?.name||'—'}${driver?.plate?' • '+driver.plate:''}`;$('liveKm').textContent=ptNum(a.km);const students=a.studentIds.map(id=>byId(db.students,id)).filter(Boolean);$('studentsCount').textContent=`${students.length} pontos`;$('liveDeliveries').textContent=`${a.deliveries.length}/${students.length}`;
 $('studentStops').innerHTML=students.length?students.map((s,i)=>{const del=a.deliveries.find(d=>d.studentId===s.id),hasGeo=Number.isFinite(s.lat)&&Number.isFinite(s.lng);return `<div class="stop ${del?'done':''}"><div class="stop-num">${del?'✓':i+1}</div><div class="stop-main"><strong>${esc(s.name)}</strong><small>${esc(s.stop)}${del?` • entregue ${hm(del.at)}`:''}</small></div><div class="stop-actions">${hasGeo?`<button class="btn ghost" onclick="navigateTo('${s.id}')">🧭 Navegar</button>`:''}${del?'<span class="pill">Entregue</span>':`<button class="btn primary" onclick="deliverStudent('${s.id}')">✓ Marcar entrega</button>`}</div></div>`}).join(''):'<div class="empty">Nenhum aluno cadastrado nesta rota.</div>';
 if(a.currentCoord){$('liveCoords').textContent=`${a.currentCoord.lat.toFixed(6)}, ${a.currentCoord.lng.toFixed(6)}`;$('liveAccuracy').textContent=`Precisão ±${Math.round(a.currentCoord.accuracy)} m`}}
window.navigateTo=id=>{const s=byId(db.students,id);if(!s||!Number.isFinite(s.lat)||!Number.isFinite(s.lng))return;window.open(`https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lng}`,'_blank')};
window.deliverStudent=id=>{if(!db.activeTrip)return;const s=byId(db.students,id);if(!s)return;if(db.activeTrip.deliveries.some(d=>d.studentId===id))return;const c=db.activeTrip.currentCoord;db.activeTrip.deliveries.push({studentId:id,at:new Date().toISOString(),lat:c?.lat??null,lng:c?.lng??null,accuracy:c?.accuracy??null});saveDB();renderActiveTrip();toast(`${s.name}: entrega registrada`)};

$('finishTrip').addEventListener('click',()=>{if(!db.activeTrip)return;if(!confirm('Encerrar esta rota e salvar o relatório?'))return;const a=db.activeTrip,endAt=new Date().toISOString();const trip={...a,endAt,durationMs:dt(endAt)-dt(a.startAt),km:+a.km.toFixed(3),status:'finalizada'};delete trip.currentCoord;delete trip.lastCoord;db.trips.push(trip);db.activeTrip=null;saveDB();stopGps();stopTimer();renderActiveTrip();toast(`Rota encerrada • ${ptNum(trip.km)} km`);if(adminUnlocked)renderAdmin()});

$('unlockAdmin').addEventListener('click',()=>{if($('adminPin').value===String(db.settings.adminPin||'2026')){adminUnlocked=true;$('adminLock').classList.add('hidden');$('adminPanel').classList.remove('hidden');$('adminPin').value='';renderAdmin()}else toast('PIN incorreto')});
$('adminPin').addEventListener('keydown',e=>{if(e.key==='Enter')$('unlockAdmin').click()});
$('lockAdmin').addEventListener('click',()=>{adminUnlocked=false;$('adminPanel').classList.add('hidden');$('adminLock').classList.remove('hidden')});

function mondayRange(){const now=new Date(),day=(now.getDay()+6)%7,m=new Date(now.getFullYear(),now.getMonth(),now.getDate()-day),s=new Date(m),e=new Date(m);e.setDate(e.getDate()+6);const f=x=>`${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}-${String(x.getDate()).padStart(2,'0')}`;return[f(s),f(e)]}
function reportTrips(){const from=$('reportFrom').value,to=$('reportTo').value;return db.trips.filter(t=>{const d=t.startAt.slice(0,10);return(!from||d>=from)&&(!to||d<=to)}).sort((a,b)=>dt(b.startAt)-dt(a.startAt))}
function renderAdmin(){if(!adminUnlocked)return;const trips=reportTrips(),km=trips.reduce((s,t)=>s+(t.km||0),0),ms=trips.reduce((s,t)=>s+(t.durationMs||0),0),del=trips.reduce((s,t)=>s+(t.deliveries?.length||0),0);$('weekKm').textContent=ptNum(km);$('weekHours').textContent=hoursLabel(ms);$('weekTrips').textContent=trips.length;$('weekDelivered').textContent=del;$('reportRows').innerHTML=trips.length?trips.map(t=>{const d=byId(db.drivers,t.driverId),r=byId(db.routes,t.routeId);return `<tr><td>${dmy(t.startAt)}</td><td>${esc(d?.name||'—')}</td><td>${esc(r?.name||'—')}</td><td>${hm(t.startAt)}</td><td>${t.endAt?hm(t.endAt):'—'}</td><td>${duration(t.durationMs)}</td><td><strong>${ptNum(t.km)}</strong></td><td>${t.deliveries?.length||0}</td></tr>`}).join(''):'<tr><td colspan="8" class="empty">Nenhuma rota no período.</td></tr>';
 $('driversTotal').textContent=db.drivers.length;$('routesTotal').textContent=db.routes.length;$('driversList').innerHTML=db.drivers.length?db.drivers.map(d=>{const ts=db.trips.filter(t=>t.driverId===d.id),k=ts.reduce((s,t)=>s+(t.km||0),0);return `<div class="list-item"><div><strong>${esc(d.name)}</strong><small>${esc(d.vehicle||'Veículo não informado')} ${d.plate?'• '+esc(d.plate):''}</small></div><div><strong>${ptNum(k)} km</strong><small>${ts.length} rotas</small></div></div>`}).join(''):'<div class="empty">Nenhum motorista.</div>';
 $('routesList').innerHTML=db.routes.length?db.routes.map(r=>{const ts=db.trips.filter(t=>t.routeId===r.id),k=ts.reduce((s,t)=>s+(t.km||0),0),n=db.students.filter(s=>s.routeId===r.id).length;return `<div class="list-item"><div><strong>${esc(r.name)}</strong><small>${esc(r.school||r.shift||'')}</small></div><div><strong>${ptNum(k)} km</strong><small>${n} alunos • ${ts.length} viagens</small></div></div>`}).join(''):'<div class="empty">Nenhuma rota.</div>';
 $('valuePerKm').value=db.settings.valuePerKm??3.5}
$('applyReport').addEventListener('click',renderAdmin);

function csvCell(v){v=String(v??'').replace(/"/g,'""');return `"${v}"`}
$('exportCsv').addEventListener('click',()=>{const rows=[['Data','Motorista','Veiculo','Placa','Rota','Escola','Inicio','Fim','Duracao','KM','Entregas','Valor KM','Total']];reportTrips().forEach(t=>{const d=byId(db.drivers,t.driverId),r=byId(db.routes,t.routeId),vk=+db.settings.valuePerKm||0;rows.push([dmy(t.startAt),d?.name||'',d?.vehicle||'',d?.plate||'',r?.name||'',r?.school||'',hm(t.startAt),t.endAt?hm(t.endAt):'',duration(t.durationMs),Number(t.km||0).toFixed(3).replace('.',','),t.deliveries?.length||0,vk.toFixed(2).replace('.',','),(vk*(t.km||0)).toFixed(2).replace('.',',')])});download('\ufeff'+rows.map(r=>r.map(csvCell).join(';')).join('\n'),`kmo-relatorio-${$('reportFrom').value||'inicio'}-${$('reportTo').value||'fim'}.csv`,'text/csv;charset=utf-8')});
$('backupJson').addEventListener('click',()=>download(JSON.stringify(db,null,2),`kmo-driver-backup-${new Date().toISOString().slice(0,10)}.json`,'application/json'));
function download(data,name,type){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([data],{type}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
$('importJson').addEventListener('change',async e=>{const f=e.target.files[0];if(!f)return;try{const x=JSON.parse(await f.text());if(!x.drivers||!x.routes||!x.trips||!x.settings)throw 0;if(!confirm('Importar este backup e substituir os dados deste aparelho?'))return;db=x;saveDB();fillSelects();renderActiveTrip();renderAdmin();toast('Backup importado')}catch{toast('Arquivo de backup inválido')}finally{e.target.value=''}});
$('saveSettings').addEventListener('click',()=>{db.settings.valuePerKm=+$('valuePerKm').value||0;const p=$('newPin').value.trim();if(p){if(p.length<4){toast('Use PIN com pelo menos 4 números');return}db.settings.adminPin=p;$('newPin').value=''}saveDB();toast('Configurações salvas')});

function init(){isOnline();fillSelects();const[m,e]=mondayRange();$('reportFrom').value=m;$('reportTo').value=e;renderActiveTrip();if(db.activeTrip){startGps();startTimer()}if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{})}
init();