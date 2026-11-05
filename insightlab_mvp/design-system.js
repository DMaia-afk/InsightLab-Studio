/* InsightLab design system: theme switcher and Dashboard Story launcher.
   The legacy standalone slide viewer has been retired without altering data logic. */
(()=>{'use strict';
const doc=document.documentElement,KEY='insightlab_theme_v93';
let theme=['dark','light'].includes(localStorage.getItem(KEY))?localStorage.getItem(KEY):'light';
function applyTheme(next){theme=next;doc.setAttribute('data-theme',theme);localStorage.setItem(KEY,theme);const btn=document.getElementById('dsTheme');if(btn){btn.textContent=theme==='dark'?'Tema claro':'Tema escuro';btn.setAttribute('aria-label','Ativar tema '+(theme==='dark'?'claro':'escuro'))}document.querySelector('meta[name="theme-color"]')?.setAttribute('content',theme==='dark'?'#151d24':'#f2f1eb')}
const bar=document.createElement('span');bar.className='ds-top-controls';bar.innerHTML='<button class="btn tiny" id="dsTheme" type="button"></button><button class="btn tiny" id="dsPresent" type="button"><img class="il-icon il-button-icon" src="assets/icons-minimal/presentation.svg" alt="" aria-hidden="true"> Roteiro</button>';
(document.querySelector('.top-actions-group')||document.querySelector('.topright')||document.querySelector('.top')).prepend(bar);
document.getElementById('dsTheme').onclick=()=>applyTheme(theme==='dark'?'light':'dark');
document.getElementById('dsPresent').onclick=()=>{showPage('builder');window.InsightLabPresentStudio?.open?.()};
applyTheme(theme);
})();
