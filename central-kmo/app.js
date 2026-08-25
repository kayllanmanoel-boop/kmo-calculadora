const cards=[...document.querySelectorAll('.app-card')];
const input=document.querySelector('#searchInput');
const filters=document.querySelector('#filters');
const empty=document.querySelector('#emptyState');
let category='Todos';

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
