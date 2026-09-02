const grid=document.querySelector('#appGrid');
const filters=document.querySelector('#filters');

// Novos aplicativos KMO
filters.querySelector('button[data-category="Gestão"]')?.insertAdjacentHTML('beforebegin','<button data-category="Alimentação">Alimentação</button>');

grid.insertAdjacentHTML('afterbegin',`
  <a class="app-card featured" data-category="Gestão" data-name="calculadora desconto percentual soma valores financeiro" href="/apps/desconto/">
    <div class="card-top"><span class="app-icon" style="background:#fff4d9">🧮</span><span class="status available"><i></i>Disponível</span></div>
    <span class="category">Gestão</span><h3>Calculadora de Desconto</h3><p>Aplique percentuais de desconto, confira o valor abatido e some outros valores ao resultado final.</p>
    <span class="action">Acessar aplicativo <b>→</b></span>
  </a>

  <a class="app-card featured" data-category="Alimentação" data-name="quantitativo refeições coffee break almoço pessoas compras buffet alimentação" href="/apps/quantitativo-refeicoes/">
    <div class="card-top"><span class="app-icon" style="background:#e8f7ee">🥗</span><span class="status available"><i></i>Disponível</span></div>
    <span class="category">Alimentação</span><h3>Quantitativo de Refeições</h3><p>Informe o público, selecione itens de coffee break ou almoço e gere automaticamente a quantidade para compra.</p>
    <span class="action">Acessar aplicativo <b>→</b></span>
  </a>
`);

const cards=[...document.querySelectorAll('.app-card')];
const input=document.querySelector('#searchInput');
const empty=document.querySelector('#emptyState');
let category='Todos';

const totalApps=document.querySelector('#totalApps');
const liveApps=document.querySelector('#liveApps');
if(totalApps)totalApps.textContent=cards.length;
if(liveApps)liveApps.textContent=cards.filter(card=>card.matches('a[href]')).length;

function normalize(value){return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()}
function applyFilters(){
  const term=normalize(input.value.trim());
  let visible=0;
  cards.forEach(card=>{
    const matchesCategory=category==='Todos'||card.dataset.category===category;
    const text=normalize(`${card.dataset.name||''} ${card.textContent}`);
    const matchesTerm=!term||text.includes(term);
    const show=matchesCategory&&matchesTerm;
    card.hidden=!show;
    if(show)visible++;
  });
  empty.hidden=visible!==0;
}

input.addEventListener('input',applyFilters);
filters.addEventListener('click',event=>{
  const button=event.target.closest('button[data-category]');
  if(!button)return;
  category=button.dataset.category;
  filters.querySelectorAll('button').forEach(item=>item.classList.toggle('active',item===button));
  applyFilters();
});
