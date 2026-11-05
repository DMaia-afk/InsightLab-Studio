(()=>{'use strict';
const folder='assets/icons-minimal/';
const asset=(name,sizeClass='')=>{const el=document.createElement('img');el.src=folder+name+'.svg';el.className=('il-icon '+sizeClass).trim();el.alt='';el.setAttribute('aria-hidden','true');el.loading='lazy';return el};
function replace(el,name,cls=''){if(!el)return;const current=el.querySelector('img.il-icon');if(current&&current.getAttribute('src')===folder+name+'.svg'){el.dataset.ilIcon=name;return}el.replaceChildren(asset(name,cls));el.dataset.ilIcon=name}
function ensureLeadingIcon(btn,name,cls='il-button-icon'){if(!btn)return;const existing=btn.querySelector('img.il-icon');if(existing){if(!existing.classList.contains(cls))existing.classList.add(cls);return}btn.prepend(asset(name,cls))}
const navMap={overview:'home',data:'database',builder:'canvas',ai:'intelligence',calendar:'calendar'};
function apply(){
 document.querySelectorAll('.nav[data-page]').forEach(btn=>{const name=navMap[btn.dataset.page];if(!name)return;let box=btn.querySelector('.navicon');if(!box){box=document.createElement('span');box.className='navicon';btn.insertBefore(box,btn.firstChild)}replace(box,name)});
 const brandMark=document.querySelector('.brand .mark'); if(brandMark) replace(brandMark,'insightlab-logo');
 [['welcomeImport','upload'],['welcomeAI','magic'],['welcomeCustomize','customize']].forEach(([id,name])=>{const iconWrap=document.querySelector('#'+id+' .act-icon'); if(iconWrap) replace(iconWrap,name)});
 const square=document.querySelector('.hud-square'); if(square) replace(square,'dashboard');
 const buttons=[['goUpload','upload'],['downloadCsv','export'],['addEvent','calendar'],['newDashboard','canvas'],['hudCanvas','canvas'],['hudBuilder','canvas'],['hudGenerate','magic'],['aiDiscover','search'],['aiTest','review'],['aiSave','review'],['plannerGenerate','magic'],['exportDashboard','export'],['importDashboard','upload'],['ask','search']];
 buttons.forEach(([id,name])=>{let b=document.getElementById(id);if(!b)return;ensureLeadingIcon(b,name)});
 const palette={kpi:'kpi',bar:'bar-chart',line:'line-chart',donut:'donut',table:'table',text:'report',heat:'calendar'};
 document.querySelectorAll('.palette-item[data-add]').forEach(el=>{let ic=palette[el.dataset.add];if(!ic)return;const span=el.querySelector('span');if(span)replace(span,ic)});
 const recents=document.querySelectorAll('.hud-recent .recent');recents.forEach(b=>{const existing=b.querySelector('img.il-icon');if(existing)return;const name=(b.dataset.page==='data'?'csv':navMap[b.dataset.page])||'dashboard';b.prepend(asset(name,'il-recent-icon'))});
}
apply();
const observer=new MutationObserver(changes=>{if(changes.some(c=>c.addedNodes.length)){observer.disconnect();apply();observer.observe(document.body,{childList:true,subtree:true})}});
observer.observe(document.body,{childList:true,subtree:true});
})();
