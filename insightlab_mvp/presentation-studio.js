/* InsightLab v10.1 | Dashboard Story
   Slides are views of existing widget IDs, never persisted HTML snapshots.
   No database or external model is required for the local narrative engine. */
(()=>{'use strict';
const en=()=>window.InsightLabI18n?.getLocale?.()==='en';
const ui=(pt,eng)=>en()?eng:pt;
const $=id=>document.getElementById(id), E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=()=>('s'+Date.now().toString(36)+Math.random().toString(36).slice(2,9));
const B=()=>window.InsightLabBuilder;
let index=0, selected='', playing=false, playIndex=0, dragging=null, restoreFocus=null, currentId='';
const cache=new Map();let revision=0;const MAX_VIEW_CACHE=28;
function active(){return B()?.getCurrentDashboard?.()}
function slides(){return active()?.slides||[]}
function persist(items){B()?.updateSlides(items)}
function range(){return window.InsightLabIntegrity.normalizeFilters(window.InsightLabDataFilters?.getActiveFilters?.()||{})}
function widgetRef(widgetId){const w=active()?.widgets?.find(x=>x.id===widgetId),d=B()?.getDataBinding?.();return {widgetId,datasetId:d?.dataset?.id||'',datasetRevision:d?.dataset?.revision||0,capturedAt:new Date().toISOString(),filters:range(),widgetState:w?{type:w.type,field:w.field,metric:w.metric,dimension:w.dimension,title:w.title}:null,binding:'live'}}
function newSlide(widgetId){return {id:uid(),title:'Novo recorte',widgetRefs:widgetId?[widgetRef(widgetId)]:[],overlays:[],narrative:{text:'',source:'local'},highlight:true}}
function normalize(s){return {...s,widgetRefs:Array.isArray(s.widgetRefs)?s.widgetRefs:[],overlays:Array.isArray(s.overlays)?s.overlays:[],narrative:s.narrative||{text:'',source:'local'}}}
// Every storyline belongs to the dashboard selected in the Canvas, including those created by AI.
// The builder owns persistence and the source of truth; we never clone widget markup into slides.
function slideGroups(widgets){
 const groups=[];
 for(let i=0;i<widgets.length;){
  const w=widgets[i];
  if(w.type==='kpi'){
   const group=[];
   while(i<widgets.length&&widgets[i].type==='kpi'&&group.length<3)group.push(widgets[i++]);
   groups.push(group);continue;
  }
  if(['bar','line','donut'].includes(w.type)&&Number(w.width||6)<=6&&i+1<widgets.length){
   const next=widgets[i+1];
   if(['bar','line','donut'].includes(next.type)&&Number(next.width||6)<=6){groups.push([w,next]);i+=2;continue}
  }
  groups.push([w]);i++;
 }
 return groups;
}
function generatedTitle(group){
 if(group.length===1)return String(group[0].title||'Análise').slice(0,110);
 if(group.every(w=>w.type==='kpi'))return 'Visão dos indicadores';
 return group.map(w=>w.title||'Análise').join(' · ').slice(0,110);
}
function isEmptyStarter(slide){return slide?.title==='Novo recorte'&&(slide.widgetRefs||[]).length===1&&!slide.generatedBy&&!(slide.overlays||[]).length&&!slide.narrative?.text}
function generateFromActive(options={}){
 const d=active();if(!d)return {ok:false,reason:'Nenhum dashboard selecionado.'};
 if(!Array.isArray(d.widgets)||!d.widgets.length)return {ok:false,reason:'Adicione widgets ao dashboard antes de gerar o roteiro.'};
 const old=Array.isArray(d.slides)?d.slides:[];
 if(old.length&&!options.replace&&!old.every(isEmptyStarter))return {ok:false,reason:'Roteiro existente preservado.'};
 if(old.length&&options.replace&&options.confirm!==false&&!confirm('Substituir o roteiro existente pelos widgets do dashboard atual? Anotações e narrativas editadas serão perdidas.'))return {ok:false,reason:'Operação cancelada.'};
 const generatedAt=new Date().toISOString();
 const items=slideGroups(d.widgets).slice(0,100).map(group=>({
  id:uid(),title:generatedTitle(group),sourceDashboardId:d.id,generatedBy:'canvas-auto',generatedAt,
  widgetRefs:group.map(w=>widgetRef(w.id)),overlays:[],
  narrative:{text:'',source:'auto'},highlight:true
 }));
 if(!items.length)return {ok:false,reason:'Nenhum widget disponível.'};
 persist(items);cache.clear();revision++;index=0;playIndex=0;selected='';currentId=d.id;
 if(!editor.hidden)draw();
 return {ok:true,count:items.length,widgetCount:d.widgets.length,dashboardName:d.name};
}
function ensureSlides(){
 const d=active();if(!d)return null;
 if(!Array.isArray(d.slides)||!d.slides.length||d.slides.every(isEmptyStarter))generateFromActive();
 return active();
}
function ensureForCurrent(){
 const d=active();if(!d?.widgets?.length)return {ok:false};
 if(Array.isArray(d.slides)&&d.slides.length)return {ok:false,reason:'Roteiro existente preservado.'};
 return generateFromActive();
}
function effective(ref){return ref.binding==='snapshot'?window.InsightLabIntegrity.normalizeFilters(ref.filters):range()}
function analyze(ref){const binding=B()?.getDataBinding?.();if(!binding?.ready||ref.datasetId&&ref.datasetId!==binding.dataset.id)return null;return B()?.getWidgetAnalysis?.(ref.widgetId,effective(ref),ref.binding==='snapshot'?ref.widgetState:null)||null}
function summary(a){
 if(!a)return ui('O widget não está disponível ou o dataset original não está vinculado. Verifique a fonte no Canvas.','The widget is unavailable or the original dataset is not linked. Check the source in Canvas.');
 if(!a.records)return ui('Não há registros válidos para o recorte selecionado. Ajuste o período antes de apresentar.','No valid records match the selected filters. Adjust the date range before presenting.');
 const loc=en()?'en-US':'pt-BR';
 const number=n=>new Intl.NumberFormat(loc,{maximumFractionDigits:2}).format(n);
 const currency=n=>new Intl.NumberFormat(loc,{style:'currency',currency:'BRL',maximumFractionDigits:2}).format(n);
 const fmt=n=>a.currency?currency(n):number(n);
 if(en()){
  if(a.type==='kpi'){
   let text=`**${a.title}:** ${fmt(a.total)}, based on ${number(a.records)} valid records (aggregation: ${a.metric}).`;
   const c=a.comparison;
   if(c&&c.previous!==0){const change=(c.current-c.previous)/Math.abs(c.previous)*100;text+=` In ${c.currentPeriod}, this metric ${change>=0?'increased':'decreased'} by ${Math.abs(change).toFixed(1)}% compared with ${c.previousPeriod}. Months may be incomplete.`}
   return text;
  }
  if(a.type==='text')return `Canvas text widget: ${a.title}.`;
  if(!a.groups.length)return `**${a.title}:** ${number(a.records)} records in the active range.`;
  const sorted=[...a.groups].sort((x,y)=>y.value-x.value),peak=sorted[0],trough=sorted.at(-1);
  let sentence=`**${a.title}:** highest value **${fmt(peak.value)}** in **${peak.label}**`;
  if(sorted.length>1)sentence+=`; lowest value **${fmt(trough.value)}** in **${trough.label}**`;
  sentence+=`. Based on ${number(a.records)} records. `;
  if(a.dimension==='month'&&a.groups.length>=2){const vals=[...a.groups].sort((x,y)=>String(x.label).localeCompare(String(y.label))),old=vals.at(-2),last=vals.at(-1);sentence+=old.value!==0?`The latest period (${last.label}) changed by ${((last.value-old.value)/Math.abs(old.value)*100).toFixed(1)}% compared with ${old.label}.`:`No percentage change can be calculated from ${old.label}, because its value is zero.`}
  else sentence+='This is a descriptive analysis, not a forecast.';
  return sentence;
 }
 if(a.type==='kpi'){let text=`**${a.title}:** ${fmt(a.total)}, considerando ${number(a.records)} registros válidos (agregação: ${a.metric}).`;const c=a.comparison;if(c&&c.previous!==0){const change=(c.current-c.previous)/Math.abs(c.previous)*100;text+=` Em ${c.currentPeriod}, o indicador ${change>=0?'cresceu':'recuou'} ${Math.abs(change).toFixed(1).replace('.',',')}% frente a ${c.previousPeriod}. Meses com registros podem estar incompletos.`}return text}
 if(a.type==='text')return `Componente de texto do Canvas: ${a.title}.`;
 if(!a.groups.length)return `**${a.title}:** ${number(a.records)} registros no recorte ativo.`;
 const sorted=[...a.groups].sort((x,y)=>y.value-x.value),peak=sorted[0],trough=sorted.at(-1);
 let sentence=`**${a.title}:** o maior valor é **${fmt(peak.value)}** em **${peak.label}**`;
 if(sorted.length>1)sentence+=`; o menor é **${fmt(trough.value)}** em **${trough.label}**`;
 sentence+=`. Base: ${number(a.records)} registros. `;
 if(a.dimension==='month'&&a.groups.length>=2){const vals=[...a.groups].sort((x,y)=>String(x.label).localeCompare(String(y.label)));const old=vals.at(-2),last=vals.at(-1);sentence+=old.value!==0?`O último período (${last.label}) apresentou ${((last.value-old.value)/Math.abs(old.value)*100).toFixed(1).replace('.',',')}% em relação a ${old.label}.`:`Não é possível calcular a variação percentual em relação a ${old.label} porque a base anterior é zero.`}
 else sentence+='Trata-se de uma análise descritiva, não de uma previsão.';
 return sentence;
}
function marked(s){return E(s).replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/\n/g,'<br>')}
const editor=document.createElement('section');editor.id='ilPresentEditor';editor.className='il-story-editor';editor.hidden=true;editor.setAttribute('role','dialog');editor.setAttribute('aria-modal','true');editor.setAttribute('aria-label','Roteiro do dashboard');
editor.innerHTML=`<header class="il-story-head"><div><strong>Roteiro do dashboard</strong><small id="ilStoryDashboard"></small></div><div class="il-story-tools"><button class="btn" id="ilStoryGrid">Voltar ao dashboard</button><button class="btn" id="ilStoryAutoGenerate" title="Criar sequência a partir de todos os widgets do dashboard selecionado">Gerar slides do dashboard atual</button><button class="btn" id="ilStoryAddSlide">Adicionar slide</button><button class="btn primary" id="ilStoryPlay">Presenter Mode</button><button class="btn" id="ilStoryClose">Fechar</button></div></header>
<div class="il-story-layout"><aside class="il-story-source"><h3>Widgets do dashboard ativo</h3><p>A sequência inicial é criada automaticamente. Você pode fixar mais widgets e editar cada slide.</p><div id="ilStorySources"></div><h3>Sequência</h3><div id="ilStoryQueue" aria-label="Ordem dos slides"></div><button class="btn" id="ilStoryAppend">+ Novo slide vazio</button></aside>
<section class="il-story-work" role="region" aria-label="Pré-visualização do slide"><div class="il-story-stage" id="ilStoryStage" aria-label="Slide selecionado"></div><div class="il-story-stage-foot"><span id="ilStoryStatus"></span><button class="btn tiny" id="ilStoryRefresh">Atualizar dados</button></div></section>
<aside class="il-story-settings"><h3>Composição</h3><label>Título do slide<input id="ilStoryTitle" maxlength="110"></label><label>Widget principal<select id="ilStoryWidget"></select></label><label>Vínculo com os filtros<select id="ilStoryBinding"><option value="live">Dinâmico: usa os filtros atuais</option><option value="snapshot">Recorte fixado: filtros e agrupamento</option></select></label><div class="il-story-dates"><label>De<input id="ilStoryFrom" type="date"></label><label>Até<input id="ilStoryTo" type="date"></label></div><button class="btn" id="ilStoryCapture">Capturar filtros atuais</button><label>Texto / interpretação<textarea id="ilStoryNarrative" rows="5" maxlength="1800"></textarea></label><button class="btn" id="ilStoryLocal">Gerar resumo dos dados</button><button class="btn" id="ilStoryAI">Refinar texto com IA conectada</button><div id="ilStoryAIStatus" role="status"></div><div class="il-story-overlays"><h3>Anotações e destaques</h3><button class="btn" id="ilStoryNote">+ Caixa de texto</button><button class="btn" id="ilStoryHighlight">+ Destaque</button><button class="btn" id="ilStorySuggest">Sugerir pico / queda</button><div id="ilStoryOverlayProps"></div></div><div class="il-story-meta"><button class="btn danger" id="ilStoryDelete">Remover slide</button></div></aside></div>`;
document.body.append(editor);
const viewer=document.createElement('section');viewer.className='il-story-viewer';viewer.id='ilStoryViewer';viewer.hidden=true;viewer.setAttribute('role','dialog');viewer.setAttribute('aria-modal','true');viewer.setAttribute('aria-label','Apresentação do dashboard');viewer.innerHTML=`<header class="il-story-viewbar"><span id="ilStoryPage"></span><div><button class="btn" id="ilStoryBack">Anterior</button><button class="btn" id="ilStoryNext">Próximo</button><button class="btn" id="ilStoryExit">Voltar ao roteiro</button></div></header><div class="il-story-viewbody"><div id="ilStoryViewStage" class="il-story-stage"></div></div><p class="il-story-viewhint">Use ← → para avançar. Esc para voltar.</p>`;document.body.append(viewer);
const currentSlide=()=>normalize(slides()[index]||newSlide());
function updateSlide(patch){let s=slides();if(!s.length)return;s[index]={...normalize(s[index]),...patch};persist(s);draw()}
function addSlide(widgetId){const s=slides();s.push(newSlide(widgetId));index=s.length-1;selected='';persist(s);open();}
function pinWidget(widgetId){const d=active();if(!d?.widgets?.some(w=>w.id===widgetId))return;addSlide(widgetId)}
function addToSlide(widgetId){const s=currentSlide();if(s.widgetRefs.some(w=>w.widgetId===widgetId))return;const refs=s.widgetRefs.concat(widgetRef(widgetId)).slice(0,3);updateSlide({widgetRefs:refs})}
function toRender(ref){const d=active(),w=d?.widgets?.find(w=>w.id===ref.widgetId);const binding=B()?.getDataBinding?.();if(!w||!binding?.ready||(ref.datasetId&&ref.datasetId!==binding.dataset.id))return null;const filters=effective(ref),key=JSON.stringify([d.id,binding.dataset.id,binding.dataset.revision,w,filters,ref.binding==='snapshot'?ref.widgetState:null,revision]);if(cache.has(key)){const hit=cache.get(key);cache.delete(key);cache.set(key,hit);return hit}const res={title:w.title,type:w.type,html:B().renderWidget(ref.widgetId,filters,ref.binding==='snapshot'?ref.widgetState:null),analysis:analyze(ref)};if(cache.has(key))cache.delete(key);cache.set(key,res);while(cache.size>MAX_VIEW_CACHE)cache.delete(cache.keys().next().value);return res}
function createWidget(ref,withHighlight){const a=toRender(ref),wrap=document.createElement('section');wrap.className='il-story-widget';if(!a){wrap.innerHTML='<p class="il-story-missing">Widget indisponível ou fonte de dados incompatível. Importe a base original e confirme o vínculo no Canvas.</p>';return wrap}
 const label=document.createElement('h3');label.textContent=a.title;const content=document.createElement('div');content.className='il-story-widget-body';content.innerHTML=a.html||'<p>Sem dados.</p>';
 // Renderer is the same data-driven Canvas renderer; no HTML snapshot is stored.
 content.querySelectorAll('button,input,select,textarea,script,iframe').forEach(x=>x.remove());
 if(withHighlight&&a.type==='line'&&a.analysis?.groups?.length){const groups=a.analysis.groups,high=groups.reduce((best,x,i)=>x.value>groups[best].value?i:best,0);const circles=content.querySelectorAll('svg circle');const circle=circles[high];if(circle){circle.setAttribute('stroke','#d39b31');circle.setAttribute('stroke-width','4');circle.setAttribute('r','6');circle.setAttribute('aria-label','Pico da série')}}
 wrap.append(label,content);return wrap}
function slideCanvas(slide,target,interactive){target.replaceChildren();target.dataset.slide=slide.id;
 const head=document.createElement('div');head.className='il-story-canvas-heading';head.textContent=slide.title||'Análise';target.append(head);
 const grid=document.createElement('div');grid.className='il-story-visuals';grid.dataset.count=slide.widgetRefs.length;slide.widgetRefs.forEach(ref=>grid.append(createWidget(ref,slide.highlight!==false)));if(!slide.widgetRefs.length)grid.innerHTML='<div class="il-story-missing">Fixe um widget para começar a narrativa.</div>';target.append(grid);
 const narrative=document.createElement('div');narrative.className='il-story-narrative';const analyses=slide.widgetRefs.map(ref=>toRender(ref)?.analysis).filter(Boolean);const dynamicText=analyses.length<2?summary(analyses[0]||null):analyses.map(a=>{const n=new Intl.NumberFormat(en()?'en-US':'pt-BR',{maximumFractionDigits:2}).format(a.total);return `**${a.title}:** ${a.currency?'R$ ':''}${n}`}).join(' · ');narrative.innerHTML=marked(slide.narrative?.text||dynamicText);target.append(narrative);
 (slide.overlays||[]).forEach(o=>{const el=document.createElement('div');el.className='il-story-overlay '+(o.type==='highlight'?'is-highlight':'is-note')+(selected===o.id&&interactive?' is-selected':'');el.dataset.overlay=o.id;el.style.cssText=`left:${o.x}%;top:${o.y}%;width:${o.w}%;height:${o.h}%`;const text=document.createElement('span');text.textContent=o.text||'Nota';el.append(text);if(interactive){el.tabIndex=0;el.setAttribute('role','button');el.setAttribute('aria-label','Selecionar anotação: '+o.text);el.title='Arraste para posicionar';el.addEventListener('click',()=>{selected=o.id;draw()});}target.append(el)});
}
function draw(){const d=active();if(!d)return;const s=slides(),slide=normalize(s[index]||newSlide());
 if(!s.length){
  currentId=d.id;$('ilStoryDashboard').textContent=d.name;
  $('ilStorySources').innerHTML='<p>Este dashboard ainda não possui widgets.</p>';
  $('ilStoryQueue').innerHTML='<p>Adicione widgets no Canvas e clique em “Gerar slides do dashboard atual”.</p>';
  $('ilStoryStage').innerHTML='<div class="il-story-missing">Sem widgets para apresentar. Volte ao Canvas e inclua os componentes que deseja analisar.</div>';
  $('ilStoryStatus').textContent='Nenhum slide vinculado';
  return;
 }
 currentId=d.id;
 $('ilStoryDashboard').textContent=d.name; $('ilStorySources').innerHTML=(d.widgets||[]).map(w=>`<button class="il-story-sourcebtn" data-pin="${E(w.id)}" title="Adicionar slide com este widget">+ ${E(w.title)}</button>`).join('')||'<p>Nenhum widget no Canvas.</p>';
 $('ilStoryQueue').innerHTML=s.map((x,i)=>`<div class="il-story-qrow"><button class="il-story-qbtn ${i===index?'active':''}" data-slide="${i}" aria-current="${i===index?'step':'false'}"><small>${i+1} / ${(x.widgetRefs||[]).length} widget(s)</small>${E(x.title||'Sem título')}</button><button class="il-story-move" data-move="${i}" data-dir="-1" aria-label="Mover para cima" ${i===0?'disabled':''}>↑</button><button class="il-story-move" data-move="${i}" data-dir="1" aria-label="Mover para baixo" ${i===s.length-1?'disabled':''}>↓</button></div>`).join('');
 $('ilStoryTitle').value=slide.title||'';
 $('ilStoryWidget').innerHTML='<option value="">Sem widget</option>'+(d.widgets||[]).map(w=>`<option value="${E(w.id)}">${E(w.title)}</option>`).join('');$('ilStoryWidget').value=slide.widgetRefs[0]?.widgetId||'';
 $('ilStoryBinding').value=slide.widgetRefs[0]?.binding||'live';$('ilStoryFrom').value=slide.widgetRefs[0]?.filters?.from||'';$('ilStoryTo').value=slide.widgetRefs[0]?.filters?.to||'';
 $('ilStoryNarrative').value=slide.narrative?.text||'';
 const isPinned=slide.widgetRefs[0]?.binding==='snapshot';$('ilStoryFrom').disabled=!isPinned;$('ilStoryTo').disabled=!isPinned;
 $('ilStoryStatus').textContent=`${s.length} slide(s) · ${slide.widgetRefs.length} widget(s) · ${isPinned?'Recorte fixado':'Dados atuais'}`;
 const found=slide.overlays.find(o=>o.id===selected);
 $('ilStoryOverlayProps').innerHTML=found?`<label>Texto da anotação<textarea id="ilStoryOverlayText" rows="3" maxlength="240">${E(found.text)}</textarea></label><button class="btn" id="ilStoryOverlayRemove">Excluir anotação</button>`:'<p>Selecione uma anotação no slide para editar o texto ou arrastá-la.</p>';
 if(found){$('ilStoryOverlayText').onchange=e=>{found.text=e.target.value;updateSlide({overlays:slide.overlays})};$('ilStoryOverlayRemove').onclick=()=>{selected='';updateSlide({overlays:slide.overlays.filter(x=>x.id!==found.id)})}}
 slideCanvas(slide,$('ilStoryStage'),true);
}
function open(id){
 if(id&&!B()?.selectDashboard?.(id))return;
 const dashboard=active();if(!dashboard)return;
 const changed=currentId!==dashboard.id;
 if(changed){index=0;selected='';cache.clear();revision++}
 ensureSlides();index=Math.min(index,Math.max(0,slides().length-1));
 restoreFocus=document.activeElement;editor.hidden=false;viewer.hidden=true;playing=false;
 document.body.classList.add('il-story-open');draw();$('ilStoryClose').focus();
}
function close(){editor.hidden=true;viewer.hidden=true;playing=false;document.body.classList.remove('il-story-open');restoreFocus?.focus?.()}
function play(){if(!slides().length)return;playIndex=index;playing=true;viewer.hidden=false;showSlide();$('ilStoryExit').focus();viewer.requestFullscreen?.().catch(()=>{})}
async function exitPlay(){playing=false;viewer.hidden=true;if(document.fullscreenElement===viewer)try{await document.exitFullscreen()}catch{};$('ilStoryPlay').focus()}
function showSlide(){const arr=slides();playIndex=Math.max(0,Math.min(playIndex,arr.length-1));const slide=normalize(arr[playIndex]);$('ilStoryPage').textContent=`${active()?.name||'Dashboard'} · ${playIndex+1}/${arr.length}`;slideCanvas(slide,$('ilStoryViewStage'),false);$('ilStoryBack').disabled=playIndex===0;$('ilStoryNext').disabled=playIndex>=arr.length-1}
$('ilStoryAutoGenerate').onclick=()=>{
 const result=generateFromActive({replace:true});
 if(!result.ok&&result.reason){$('ilStoryAIStatus').textContent=result.reason;return}
 $('ilStoryAIStatus').textContent=`${result.count} slides criados automaticamente a partir de ${result.widgetCount} widgets de “${result.dashboardName}”.`;
};
$('ilStoryClose').onclick=close;$('ilStoryGrid').onclick=close;$('ilStoryPlay').onclick=play;$('ilStoryExit').onclick=exitPlay;
$('ilStoryBack').onclick=()=>{playIndex--;showSlide()};$('ilStoryNext').onclick=()=>{playIndex++;showSlide()};
$('ilStoryAddSlide').onclick=()=>addSlide();$('ilStoryAppend').onclick=()=>addSlide();
$('ilStorySources').onclick=e=>{const b=e.target.closest('[data-pin]');if(b)pinWidget(b.dataset.pin)};
$('ilStoryQueue').onclick=e=>{const move=e.target.closest('[data-move]');if(move){const arr=slides(),from=+move.dataset.move,to=from+(+move.dataset.dir);if(to<0||to>=arr.length)return;[arr[from],arr[to]]=[arr[to],arr[from]];index=to;persist(arr);draw();return}const btn=e.target.closest('[data-slide]');if(btn){index=+btn.dataset.slide;selected='';draw()}};
$('ilStoryTitle').onchange=e=>updateSlide({title:e.target.value.trim().slice(0,110)||'Sem título'});
$('ilStoryWidget').onchange=e=>{const s=currentSlide(),refs=e.target.value?[widgetRef(e.target.value),...s.widgetRefs.filter(x=>x.widgetId!==e.target.value).slice(1)]:[];updateSlide({widgetRefs:refs})};
$('ilStoryBinding').onchange=e=>{const s=currentSlide(),ref=s.widgetRefs[0];if(!ref)return;ref.binding=e.target.value;ref.filters=range();ref.widgetState=widgetRef(ref.widgetId).widgetState;updateSlide({widgetRefs:s.widgetRefs})};
for(const [id,key] of [['ilStoryFrom','from'],['ilStoryTo','to']])$(id).onchange=e=>{const s=currentSlide(),ref=s.widgetRefs[0];if(!ref)return;ref.filters={...ref.filters,[key]:e.target.value};updateSlide({widgetRefs:s.widgetRefs})};
$('ilStoryCapture').onclick=()=>{const s=currentSlide(),ref=s.widgetRefs[0];if(!ref)return;ref.filters=range();ref.widgetState=widgetRef(ref.widgetId).widgetState;ref.capturedAt=new Date().toISOString();ref.binding='snapshot';updateSlide({widgetRefs:s.widgetRefs})};
$('ilStoryNarrative').onchange=e=>updateSlide({narrative:{text:e.target.value.slice(0,1800),source:'user'}});
$('ilStoryLocal').onclick=()=>{const s=currentSlide(),ref=s.widgetRefs[0];updateSlide({narrative:{text:summary(ref?analyze(ref):null),source:'local'}})};
$('ilStoryAI').onclick=async()=>{const btn=$('ilStoryAI'),status=$('ilStoryAIStatus'),ref=currentSlide().widgetRefs[0],a=ref?analyze(ref):null;if(!a){status.textContent='Selecione um widget antes de solicitar um resumo.';return}const api=window.InsightLabAI;if(!api){status.textContent='Agente indisponível. Use o resumo local.';return}btn.disabled=true;status.textContent='Solicitando redação ao modelo configurado...';try{api.syncAdmin?.();const facts={label:a.title,operation:a.metric,field:a.field,group_by:a.dimension,records:a.records,value:a.total,groups:a.groups.slice(0,10),comparison:a.comparison||null};const out=await api.call('/api/ai/assistant/explain','POST',{question:ui('Redija duas frases executivas sobre este widget com base exclusivamente nas evidências calculadas. Evite causalidade e períodos incompletos.','Write two executive sentences about this widget using only the calculated evidence. Avoid causality and comparisons across incomplete periods.'),findings:[facts],caveat:ui('Análise do widget selecionado.','Analysis of the selected widget.')});updateSlide({narrative:{text:String(out.answer||'').slice(0,1800),source:'model'}});status.textContent='Texto gerado. Revise-o antes de apresentar.'}catch(err){status.textContent='Não foi possível usar a IA: '+err.message+' Use “Gerar resumo dos dados” para continuar.'}finally{btn.disabled=false}};
function overlay(type){const s=currentSlide();const o={id:uid(),type,text:type==='highlight'?ui('Destaque','Highlight'):ui('Escreva uma observação','Write a note'),x:type==='highlight'?52:8,y:type==='highlight'?35:74,w:type==='highlight'?30:42,h:type==='highlight'?13:14};s.overlays.push(o);selected=o.id;updateSlide({overlays:s.overlays})}
$('ilStoryNote').onclick=()=>overlay('note');$('ilStoryHighlight').onclick=()=>overlay('highlight');
$('ilStorySuggest').onclick=()=>{const s=currentSlide(),a=s.widgetRefs[0]?analyze(s.widgetRefs[0]):null;if(!a?.groups?.length){$('ilStoryAIStatus').textContent='Escolha um gráfico com grupos de dados para sugerir um destaque.';return}const ordered=[...a.groups].sort((x,y)=>y.value-x.value),top=ordered[0],low=ordered.at(-1),fmt=n=>new Intl.NumberFormat('pt-BR',{maximumFractionDigits:2}).format(n);const o={id:uid(),type:'highlight',text:(en()?`Peak: ${top.label} (${fmt(top.value)})${low!==top?' · Lowest: '+low.label+' ('+fmt(low.value)+')':''}`:`Pico: ${top.label} (${fmt(top.value)})${low!==top?' · Menor: '+low.label+' ('+fmt(low.value)+')':''}`),x:50,y:29,w:43,h:14};s.overlays.push(o);selected=o.id;updateSlide({overlays:s.overlays})};
$('ilStoryDelete').onclick=()=>{if(!confirm('Remover este slide do roteiro?'))return;const arr=slides();arr.splice(index,1);if(!arr.length)arr.push(newSlide());index=Math.min(index,arr.length-1);selected='';persist(arr);draw()};
$('ilStoryRefresh').onclick=()=>{revision++;cache.clear();draw()};
const stage=$('ilStoryStage');stage.addEventListener('pointerdown',e=>{const t=e.target.closest('[data-overlay]');if(!t)return;const s=currentSlide(),o=s.overlays.find(x=>x.id===t.dataset.overlay);if(!o)return;selected=o.id;const rect=stage.getBoundingClientRect();dragging={id:o.id,startX:e.clientX,startY:e.clientY,x:o.x,y:o.y,rect};stage.setPointerCapture(e.pointerId)});
stage.addEventListener('pointermove',e=>{if(!dragging)return;const s=currentSlide(),o=s.overlays.find(x=>x.id===dragging.id);if(!o)return;o.x=Math.max(0,Math.min(100-o.w,dragging.x+(e.clientX-dragging.startX)/dragging.rect.width*100));o.y=Math.max(0,Math.min(100-o.h,dragging.y+(e.clientY-dragging.startY)/dragging.rect.height*100));const el=stage.querySelector(`[data-overlay="${o.id}"]`);if(el){el.style.left=o.x+'%';el.style.top=o.y+'%'}});
stage.addEventListener('pointerup',()=>{if(!dragging)return;dragging=null;const s=currentSlide();updateSlide({overlays:s.overlays})});stage.addEventListener('pointercancel',()=>dragging=null);
document.addEventListener('keydown',e=>{if(!editor.hidden&&e.key==='Escape'&&!playing){close();return}if(!playing)return;if(e.key==='Escape'){e.preventDefault();exitPlay()}else if(e.key==='ArrowRight'||e.key==='PageDown'){e.preventDefault();playIndex++;showSlide()}else if(e.key==='ArrowLeft'||e.key==='PageUp'){e.preventDefault();playIndex--;showSlide()}});
const top=$('dsPresent');if(top){top.textContent='Roteiro';top.onclick=()=>{showPage('builder');open()}};
// The legacy viewer remains in DOM solely for compatibility with old scripts; it is never shown.
window.InsightLabPresentation={open,close};
window.InsightLabPresentStudio={open,create:()=>open(),pinWidget,generateFromActive,ensureForCurrent,list:()=>[],remove:()=>false,save:()=>{}};
window.addEventListener('insightlab:locale-changed',()=>{revision++;cache.clear();if(!editor.hidden)draw();if(!viewer.hidden)showSlide()});
window.addEventListener('insightlab:data-changed',()=>{revision++;cache.clear();if(!editor.hidden)draw();if(!viewer.hidden)showSlide()});
window.addEventListener('insightlab:filters-changed',()=>{if(!editor.hidden)draw();if(!viewer.hidden)showSlide()});
})();
