/* Dashboard projects: slide storylines are always inside their owning dashboard. */
(()=>{'use strict';
const root=document.getElementById('ilRecentProjects');if(!root)return;
root.innerHTML='<div class="smallcap">DASHBOARDS SALVOS</div><div id="ilSavedProjects"></div>';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let signature='';
function update(){let dashboards=[];
 const builder=window.InsightLabBuilder;
 if(typeof builder?.getDashboardSummaries==='function')dashboards=builder.getDashboardSummaries();
 else try{dashboards=JSON.parse(localStorage.getItem('insightlab_dashboards_v2'))||[]}catch{}
 const items=dashboards.slice(0,16).map(d=>({id:d.id,name:d.name||'Dashboard',slides:Array.isArray(d.slides)?d.slides.length:Number(d.slides)||0,widgets:Array.isArray(d.widgets)?d.widgets.length:Number(d.widgets)||0})),next=JSON.stringify(items);
 if(next===signature&&document.getElementById('ilSavedProjects')?.childElementCount)return;signature=next;
 document.getElementById('ilSavedProjects').innerHTML=items.length?items.map(x=>`<div class="il-project"><button class="il-project-open" type="button" data-open="${esc(x.id)}"><span class="il-project-symbol"><img class="il-icon" src="assets/icons-minimal/dashboard.svg" alt="" aria-hidden="true"></span><span class="il-project-meta"><strong data-il-untranslated title="${esc(x.name)}">${esc(x.name)}</strong><small>${x.widgets} widgets · ${x.slides} slides vinculados</small></span></button><button class="il-project-story" type="button" data-story="${esc(x.id)}" title="Abrir roteiro" aria-label="Abrir roteiro de ${esc(x.name)}">▶</button><button class="il-project-delete" type="button" data-delete="${esc(x.id)}" title="Excluir dashboard" aria-label="Excluir dashboard ${esc(x.name)}">×</button></div>`).join(''):'<p class="builder-muted">Nenhum dashboard salvo.</p>';
}
root.addEventListener('click',e=>{const action=e.target.closest('[data-open],[data-story],[data-delete]');if(!action)return;const id=action.dataset.open||action.dataset.story||action.dataset.delete;
 if(action.dataset.delete){if(!confirm('Excluir este dashboard e seu roteiro?'))return;const b=window.InsightLabBuilder;if(!b?.removeDashboardById?.(id)){alert('Mantenha pelo menos um dashboard.');return}update();return}
 if(!window.InsightLabBuilder?.selectDashboard?.(id))return;
 if(action.dataset.story)window.InsightLabPresentStudio?.open();
});
window.addEventListener('storage',e=>{if(e.key==='insightlab_dashboards_v2')update()});
window.addEventListener('insightlab:dashboards-changed',update);
window.addEventListener('insightlab:dashboard-created',update);
update();
})();
