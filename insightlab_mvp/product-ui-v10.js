/* InsightLab 10 — only presentation/interaction refinement. Existing application
   routes, persistent identifiers, API requests and calculations remain unchanged. */
(()=>{'use strict';
  const $=id=>document.getElementById(id);
  const group=document.querySelector('.top-actions-group');
  if(group){
    const details=document.createElement('details');details.className='il-preferences';details.id='ilPreferences';
    const summary=document.createElement('summary');summary.setAttribute('aria-label','Abrir preferências do workspace');
    summary.innerHTML='<img class="il-icon il-button-icon" src="assets/icons-minimal/settings.svg" alt="" aria-hidden="true">Preferências';
    const menu=document.createElement('div');menu.className='il-pref-menu';
    const label=document.createElement('span');label.className='il-pref-label';label.textContent='APARÊNCIA E SESSÃO';menu.append(label);
    ['dsTheme','soundToggle','motionToggle'].forEach(id=>{const el=$(id);if(el){el.classList.add('il-pref-item');menu.append(el)}});
    const divider=document.createElement('div');divider.className='il-pref-separator';menu.append(divider);
    const local=document.createElement('button');local.type='button';local.className='btn il-pref-item';
    local.textContent='Leituras analíticas locais';local.title='Abrir análises descritivas sem modelo externo';
    local.addEventListener('click',()=>{details.open=false;document.querySelector('.nav[data-page="ai"]')?.click()});
    menu.append(local);
    const divider2=document.createElement('div');divider2.className='il-pref-separator';menu.append(divider2);
    ['reset','logoutBtn'].forEach(id=>{const el=$(id);if(el){el.classList.add('il-pref-item');menu.append(el)}});
    details.append(summary,menu);
    // Presentation and import are primary task actions; session settings are secondary.
    const upload=$('goUpload');if(upload)group.insertBefore(details,upload);else group.append(details);
    const present=$('dsPresent');if(present&&upload)group.insertBefore(present,upload);
    const old=$('dsTheme')?.parentElement;if(old?.classList.contains('ds-top-controls')&&!old.children.length)old.remove();
    document.addEventListener('click',e=>{if(details.open&&!details.contains(e.target))details.open=false});
    details.addEventListener('keydown',e=>{if(e.key==='Escape'){details.open=false;summary.focus()}});
    menu.addEventListener('click',e=>{if(e.target.closest('button')&&e.target.id!=='dsTheme')details.open=false});
  }
  // Preserve legacy local analysis screen via Preferences, avoid duplicate main navigation.
  const legacy=document.querySelector('.sidebar .nav[data-page="ai"]');
  if(legacy){legacy.style.display='none';legacy.setAttribute('aria-hidden','true');legacy.tabIndex=-1}
  const nav=document.querySelector('.sidebar .menu');
  if(nav){
    const current=()=>nav.querySelectorAll('.nav').forEach(b=>{
      if(b.classList.contains('active'))b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');
    });
    current();
    new MutationObserver(changes=>{if(changes.some(c=>c.attributeName==='class'))current()})
      .observe(nav,{subtree:true,attributes:true,attributeFilter:['class']});
  }
  // The contextual analyser's retained UI creates a dashboard; the floating assistant handles chat.
  const status=$('hudIAStatus');if(status)status.setAttribute('role','status');
  const search=$('hudSearch');if(search)search.setAttribute('title','Digite dados, agenda ou Canvas e pressione Enter');
  // No additional decoration, network calls, storage, or business features are introduced here.
})();
