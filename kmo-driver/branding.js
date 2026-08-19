(function(){
  function applyKmoBrand(){
    const logo='./kmo-logo-app.webp?v=9';
    document.querySelectorAll('.screen-logo,.drive-logo,.lock-logo,.logo').forEach(img=>{
      if(img && img.tagName==='IMG'){
        img.src=logo;
        img.alt='KMO Gestão';
        img.style.objectFit='cover';
        img.style.objectPosition='center';
        img.style.borderRadius='50%';
        img.style.background='transparent';
      }
    });
    const mascot=document.querySelector('.mascot-badge');
    if(mascot){
      mascot.textContent='';
      mascot.style.backgroundImage=`url('${logo}')`;
      mascot.style.backgroundSize='cover';
      mascot.style.backgroundPosition='center';
      mascot.style.backgroundColor='transparent';
      mascot.style.borderRadius='50%';
    }
    document.querySelectorAll('.device-screen').forEach(screen=>{
      const img=screen.querySelector('.screen-logo');
      if(img){
        img.style.display='block';
        img.style.opacity='1';
        img.style.visibility='visible';
        img.style.boxShadow='0 7px 18px rgba(0,0,0,.18)';
        img.style.border='3px solid #d8ad5a';
      }
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',applyKmoBrand);
  else applyKmoBrand();
  setTimeout(applyKmoBrand,400);
  setTimeout(applyKmoBrand,1200);
})();
