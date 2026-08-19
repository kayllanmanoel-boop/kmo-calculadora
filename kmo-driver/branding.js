(function(){
  const LOGO='./kmo-logo-app.webp?v=10';

  function ensureHeadBrand(){
    if(!document.querySelector('link[data-kmo-favicon]')){
      const fav=document.createElement('link');
      fav.rel='icon';fav.type='image/webp';fav.href=LOGO;fav.dataset.kmoFavicon='1';document.head.appendChild(fav);
    }
    if(!document.querySelector('link[data-kmo-apple]')){
      const apple=document.createElement('link');
      apple.rel='apple-touch-icon';apple.href=LOGO;apple.dataset.kmoApple='1';document.head.appendChild(apple);
    }
    let meta=document.querySelector('meta[name="application-name"]');
    if(!meta){meta=document.createElement('meta');meta.name='application-name';document.head.appendChild(meta)}
    meta.content='KMO Drive';
  }

  function applyKmoBrand(){
    ensureHeadBrand();

    document.querySelectorAll('.screen-logo,.drive-logo,.lock-logo,.logo').forEach(img=>{
      if(img && img.tagName==='IMG'){
        img.src=LOGO;
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
      mascot.style.backgroundImage=`url('${LOGO}')`;
      mascot.style.backgroundSize='cover';
      mascot.style.backgroundPosition='center';
      mascot.style.backgroundColor='transparent';
      mascot.style.borderRadius='50%';
      mascot.setAttribute('aria-label','KMO Gestão');
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

    const nav=document.querySelector('.premium-tabs');
    if(nav && !nav.querySelector('.kmo-nav-brand')){
      const brand=document.createElement('div');
      brand.className='kmo-nav-brand';
      brand.innerHTML=`<img src="${LOGO}" alt="KMO Gestão"><span><strong>KMO DRIVE</strong><small>KMO GESTÃO</small></span>`;
      nav.insertBefore(brand,nav.firstChild);
    }

    const main=document.querySelector('main');
    if(main && !document.querySelector('.kmo-brand-footer')){
      const footer=document.createElement('footer');
      footer.className='kmo-brand-footer';
      footer.innerHTML=`<img src="${LOGO}" alt="KMO Gestão"><div><strong>KMO DRIVE</strong><span>KMO Gestão • Rotas • Georreferenciamento</span></div>`;
      main.insertAdjacentElement('afterend',footer);
    }

    if(!document.getElementById('kmoBrandStyles')){
      const style=document.createElement('style');style.id='kmoBrandStyles';
      style.textContent=`
        .kmo-nav-brand{position:absolute;left:max(14px,calc((100vw - 1080px)/2));top:50%;transform:translateY(-50%);display:flex;align-items:center;gap:8px;pointer-events:none;z-index:2}
        .kmo-nav-brand img{width:31px;height:31px;border-radius:50%;object-fit:cover;border:2px solid #d8ad5a;box-shadow:0 3px 10px rgba(12,59,134,.18)}
        .kmo-nav-brand span{display:flex;flex-direction:column;line-height:1.05}.kmo-nav-brand strong{font-size:10px;letter-spacing:.7px;color:#0c3b86}.kmo-nav-brand small{font-size:7px;font-weight:800;color:#9a741f;margin-top:2px}
        .kmo-brand-footer{max-width:1080px;margin:18px auto 28px;padding:14px 18px;display:flex;align-items:center;justify-content:center;gap:11px;border-top:1px solid rgba(216,173,90,.55);color:#0c3b86;text-align:left}
        .kmo-brand-footer img{width:46px;height:46px;border-radius:50%;object-fit:cover;border:2px solid #d8ad5a;box-shadow:0 5px 14px rgba(12,59,134,.12)}
        .kmo-brand-footer div{display:flex;flex-direction:column}.kmo-brand-footer strong{font-size:13px;letter-spacing:1px}.kmo-brand-footer span{font-size:9px;color:#6b7280;margin-top:3px}
        @media(max-width:920px){.kmo-nav-brand{display:none}}
        @media(max-width:520px){.kmo-brand-footer{margin:10px 12px 22px;padding:12px}.kmo-brand-footer img{width:40px;height:40px}}
      `;
      document.head.appendChild(style);
    }
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',applyKmoBrand);
  else applyKmoBrand();
  setTimeout(applyKmoBrand,350);
  setTimeout(applyKmoBrand,1100);
})();
