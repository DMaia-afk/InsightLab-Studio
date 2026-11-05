(()=>{'use strict';
const $=id=>document.getElementById(id);
const en=()=>window.InsightLabI18n?.getLocale?.()==='en';
const navigate=page=>{if(typeof window.showPage==='function')window.showPage(page);else document.querySelector(`.nav[data-page="${page}"]`)?.click()};
function createWithAI(prompt){window.InsightLabChat?.ask?.(prompt||(en()?'Create a dashboard using my data.':'Crie um dashboard a partir dos meus dados.'))}
$('hudCanvas')?.addEventListener('click',()=>navigate('builder'));
$('hudBuilder')?.addEventListener('click',()=>navigate('builder'));
$('hudGenerate')?.addEventListener('click',()=>createWithAI($('hudPrompt')?.value.trim()||(en()?'Create a workspace using my data.':'Crie um workspace com base nos meus dados.')));
document.querySelectorAll('.suggestion[data-prompt]').forEach(b=>b.addEventListener('click',()=>{let prompt=b.dataset.prompt; if(en()){const labels={'Crie um dashboard executivo com os principais indicadores e tendência mensal.':'Create an executive dashboard with key metrics and a monthly trend.','Compare o faturamento por categoria e identifique oportunidades.':'Compare revenue by category and identify opportunities.','Monte um workspace de análise comercial adaptado ao meu CSV.':'Build a sales analysis workspace tailored to my CSV.'};prompt=labels[prompt]||prompt;}$('hudPrompt').value=prompt;createWithAI(prompt)}));
document.querySelectorAll('.recent[data-page]').forEach(b=>b.addEventListener('click',()=>navigate(b.dataset.page)));
$('hudSearch')?.addEventListener('keydown',e=>{if(e.key!=='Enter')return;let q=e.currentTarget.value.toLowerCase();if(/csv|dado|tabela/.test(q))navigate('data');else if(/agenda|evento/.test(q))navigate('calendar');else if(/ia|intelig|agent/.test(q))window.InsightLabChat?.open?.();else navigate('builder')});
const status=$('hudIAStatus');const url=(localStorage.getItem('insightlab_api_url')||'http://127.0.0.1:8000').replace(/\/$/,'');
if(status)fetch(url+'/api/health',{signal:AbortSignal.timeout(5000)}).then(r=>r.ok?r.json():Promise.reject()).then(j=>{status.textContent=j.mode==='configured'?'● IA ativa':'● Modo demo'}).catch(()=>{status.textContent='● API offline';status.style.color='#F9D354'});
})();
