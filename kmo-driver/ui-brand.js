(function(){
  function applyKmoLabels(){
    const launchTitle=document.querySelector('.launch-head strong');
    if(launchTitle) launchTitle.textContent='INICIAR A ROTA';
    const pageTitle=document.querySelector('title');
    if(pageTitle) pageTitle.textContent='KMO Drive — Gestão de Rotas';
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',applyKmoLabels);
  else applyKmoLabels();
})();
