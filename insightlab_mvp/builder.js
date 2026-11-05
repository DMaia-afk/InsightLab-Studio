/* InsightLab No-code Canvas — client-side portfolio MVP */
(()=>{'use strict';
const storeKey='insightlab_dashboards_v2';
const Integrity=window.InsightLabIntegrity;
const Query=window.InsightLabQueryEngine;
if(!Integrity)throw new Error('integrity-v104.js precisa ser carregado antes do Canvas.');
if(!Query)throw new Error('query-engine-v105.js precisa ser carregado antes do Canvas.');
const icons={kpi:'kpi',bar:'bar-chart',line:'line-chart',donut:'donut',table:'table',text:'report',heat:'calendar'};
const iconHTML=name=>`<img class="il-icon il-inline-icon" src="assets/icons-minimal/${name}.svg" alt="" aria-hidden="true">`;

const labels={kpi:'Indicador',bar:'Barras',line:'Linha',donut:'Rosca',table:'Tabela',text:'Texto',heat:'Mapa de calor'};
const fieldLabels={amount:'Valor (R$)',date:'Data',store:'Unidade',category:'Categoria',status:'Status'};
function defsRole(name,catalog){return (catalog?.columns||[]).find(c=>c.name===name)?.role||''}
function fieldMetadata(){
 let catalog=null;try{catalog=window.InsightLabSmartImport?.catalog?.()}catch{}
 const kinds=new Map((catalog?.columns||[]).map(c=>[c.name,c.kind]));
 const list=[];const seen=new Set();
 try{for(const r of data.slice(0,100)){for(const [key,value] of Object.entries(r||{})){
   if(seen.has(key))continue;seen.add(key);
   if(/^(?:__proto__|constructor|prototype)$/.test(key))continue;
   let rawKind=kinds.get(key);
   const kind=rawKind==='money'||rawKind==='number'?'number':rawKind==='date'?'date':key==='date'?'date':key==='amount'?'number':null;
   if((key==='amount'&&catalog?.hasAmount===false)||(key==='date'&&catalog?.hasDate===false)||(catalog?.columns?.length&&['store','category','status'].includes(key)&&!catalog.columns.some(c=>c.enabled&&c.role===key)))continue;
   list.push({name:key,kind:kind||(/^(?:-?\d+(?:[.,]\d+)?)$/.test(String(value).trim())?'number':'category'),money:rawKind==='money'||defsRole(key,catalog)==='amount'||(key==='amount'&&catalog?.hasAmount!==false)});
 }}}catch{}return list.slice(0,120)
}
function numericFields(){return fieldMetadata().filter(c=>c.kind==='number')}
function formatField(w){const meta=fieldMetadata().find(c=>c.name===w.field);return (meta?.money || (w.field==='amount'&&!meta))&&w.metric!=='count'?'currency':'number'}

const demoWidgets=[{type:'kpi',title:'Receita total',metric:'sum',field:'amount',width:4},{type:'kpi',title:'Vendas concluídas',metric:'count',field:'amount',width:4},{type:'kpi',title:'Ticket médio',metric:'avg',field:'amount',width:4},{type:'line',title:'Receita por mês',dimension:'month',metric:'sum',field:'amount',width:12},{type:'bar',title:'Receita por categoria',dimension:'category',metric:'sum',field:'amount',width:6},{type:'donut',title:'Mix por unidade',dimension:'store',metric:'sum',field:'amount',width:6}];
const uid=()=> 'w'+Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const clone=x=>JSON.parse(JSON.stringify(x));
const normalizeWidget=w=>({id:uid(),type:'bar',title:'Novo componente',metric:'sum',field:'amount',dimension:'category',width:6,text:'Insira uma observação ou interpretação para acompanhar os dados.',...w});
let dashboards=[],activeId='',selectedId='',dirty=false, presentation=false,persistTimer=null;
function binding(){return {datasetId:Integrity.getDataset().id,datasetBinding:'confirmed'}}
function seed(){return [{id:uid(),name:'Visão executiva',description:'Indicadores, tendências e composição da receita',...binding(),widgets:demoWidgets.map(normalizeWidget)}]}
try{
 const stored=localStorage.getItem(storeKey);const raw=stored?JSON.parse(stored):null;
 if(raw!==null&&!Array.isArray(raw))throw Error('Formato incorreto do armazenamento local.');
 dashboards=raw?.length?raw.map(d=>Integrity.normalizeDashboard(d,false)):seed();
}catch(err){console.warn('Projetos locais inválidos. O conteúdo original foi preservado para recuperação:',err);try{const old=localStorage.getItem(storeKey);if(old)localStorage.setItem(storeKey+'_backup_104',old)}catch{}dashboards=seed();window.InsightLabIntegrityWarning='Projetos locais inválidos: foi criado um backup na chave insightlab_dashboards_v2_backup_104. Não sobrescreva o armazenamento antes de recuperar seus dados.'}
activeId=dashboards[0].id;
const $=id=>document.getElementById(id);
const escapeHTML=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const current=()=>dashboards.find(d=>d.id===activeId)||dashboards[0];
const widget=()=>current().widgets.find(w=>w.id===selectedId);
const sourceReady=()=>current()?.datasetBinding==='confirmed'&&current()?.datasetId===Integrity.getDataset().id;
const missingMessage=()=>current()?.datasetBinding!=='confirmed'?'Este dashboard precisa confirmar sua fonte de dados.':'A fonte de dados deste dashboard não está ativa. Importe o CSV original ou vincule explicitamente uma base compatível.';
function missingFields(d){const meta=fieldMetadata(),known=new Set(meta.map(x=>x.name));const errors=[];
 for(const w of d.widgets||[]){if(['text','heat','table'].includes(w.type))continue;
  if(w.metric!=='count'&&!known.has(w.field))errors.push(`${w.title}: campo numérico ${w.field}`);
  if(w.type!=='kpi'&&['day','month','hour'].includes(w.dimension)&&(!known.has('date')||!data.some(r=>/^\d{4}-\d{2}/.test(r.date||''))))errors.push(`${w.title}: data principal`);
  if(w.type!=='kpi'&&!['day','month','hour'].includes(w.dimension)&&!known.has(w.dimension))errors.push(`${w.title}: dimensão ${w.dimension}`);
 }return errors;
}
function confirmDatasetBinding(){const d=current(),m=Integrity.getDataset(),issues=missingFields(d);
 if(issues.length){alert('Não é possível vincular esta base sem revisar os campos:\n'+issues.slice(0,10).join('\n')+'\n\nImporte a base compatível ou ajuste os widgets.');return false}
 if(!confirm(`Vincular o dashboard “${d.name}” à base “${m.name}”?\nEsta ação passa a usar os registros atualmente carregados.`))return false;
 d.datasetId=m.id;d.datasetBinding='confirmed';for(const sl of d.slides||[])for(const ref of sl.widgetRefs||[]){ref.datasetId=m.id;ref.datasetRevision=m.revision}
 setDirty();renderCanvas();return true;
}
const money=n=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0}).format(n);
const num=n=>new Intl.NumberFormat('pt-BR',{maximumFractionDigits:1}).format(n);
const safeNum=n=>Number.isFinite(Number(n))?Number(n):0;
function persistBuilder(){if(persistTimer!==null){clearTimeout(persistTimer);persistTimer=null}try{localStorage.setItem(storeKey,JSON.stringify(dashboards));dirty=false;status('Salvo neste navegador');window.dispatchEvent(new CustomEvent('insightlab:dashboards-changed',{detail:{activeId,count:dashboards.length}}))}catch{status('Armazenamento indisponível: exporte o JSON')}}
function status(t){$('builderStatus').textContent=t}
function sound(kind){try{window.playUISound&&window.playUISound(kind)}catch(e){}}
function setDirty({debounce=false}={}){dirty=true;if(debounce){if(persistTimer!==null)clearTimeout(persistTimer);persistTimer=setTimeout(persistBuilder,280);window.dispatchEvent(new CustomEvent('insightlab:dashboards-changed',{detail:{activeId,count:dashboards.length}}))}else persistBuilder();sound('soft')}
window.addEventListener('pagehide',()=>{if(dirty)persistBuilder()});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'&&dirty)persistBuilder()});
function rows(){return Array.isArray(window.data)?window.data:[]}
// Original app uses top-level lexical `data` (not a window property).
function dataset(filters=null){
 if(!sourceReady())return [];
 try{return Query.filteredRows(filters)}catch(err){console.warn('Falha na consulta do dashboard:',err);return []}
}
function format(n,w){return formatField(w)==='currency'?money(n):num(n)}
function grouped(w,filters=null){const group=dims[w.dimension]||(r=>String(r[w.dimension]??'Não informado'));const map=new Map();dataset(filters).forEach(r=>{const key=group(r);if(!map.has(key))map.set(key,[]);map.get(key).push(r)});return [...map].map(([k,a])=>[k,metric(a,w)]).sort((a,b)=>w.dimension==='month'||w.dimension==='day'||w.dimension==='hour'?String(a[0]).localeCompare(String(b[0])):b[1]-a[1]).slice(0,12)}
function draw(w,filters=null){if(!sourceReady())return '<p class="il-binding-warning">'+escapeHTML(missingMessage())+'</p>';const q=Query.query(w,filters),a=q.sample,n=q.total,items=q.groups,max=Math.max(1,...items.map(x=>x[1]));
 if(w.type==='kpi')return `<div class="widget-kpi">${escapeHTML(format(n,w))}</div><div class="builder-muted">${num(q.records)} registros considerados</div>`;
 if(w.type==='text')return `<div class="widget-note">${escapeHTML(w.text||'Clique para editar o texto.')}</div>`;
 if(w.type==='bar')return items.length?items.map(([k,v])=>`<div class="widget-bar"><span class="widget-bar-name" title="${escapeHTML(k)}">${escapeHTML(k)}</span><span class="widget-bar-track"><b style="width:${Math.min(100,100*v/max)}%"></b></span><span class="widget-bar-value">${escapeHTML(format(v,w))}</span></div>`).join(''):'<p>Sem dados.</p>';
 if(w.type==='line'){
  if(!items.length)return '<p>Sem dados.</p>';let pts=items.map((x,i)=>[20+(i/(Math.max(items.length-1,1)))*480,120-(x[1]/max)*100]);return `<svg class="widget-svg" viewBox="0 0 520 160" preserveAspectRatio="none"><line x1="20" y1="120" x2="510" y2="120" stroke="#d0d9d7"/>${[0,1,2].map(i=>`<line x1="20" y1="${20+i*50}" x2="510" y2="${20+i*50}" stroke="#e1e7e4" stroke-dasharray="3 6"/>`).join('')}<polyline points="${pts.map(p=>p.join(',')).join(' ')}" stroke="#345F70" stroke-width="3" fill="none"/>${pts.map((p,i)=>`<circle cx="${p[0]}" cy="${p[1]}" r="4" fill="#345F70"><title>${escapeHTML(items[i][0])}: ${escapeHTML(format(items[i][1],w))}</title></circle>`).join('')}${items.filter((_,i)=>i%Math.max(1,Math.ceil(items.length/5))===0).map(x=>`<text x="${pts[items.indexOf(x)][0]}" y="145" fill="#70838a" text-anchor="middle" font-size="11">${escapeHTML(String(x[0]).slice(-7))}</text>`).join('')}</svg>`}
 if(w.type==='donut'){let colors=['#345F70','#659398','#9DB6B0','#C9AA7B','#788B7C','#C7D5D1'],top=items.slice(0,6),total=top.reduce((s,x)=>s+x[1],0),p=0;let grad=top.map((x,i)=>{let start=p;p+=total?x[1]*100/total:0;return `${colors[i]} ${start}% ${p}%`}).join(',');return `<div class="donut-wrap"><div class="donut" style="background:conic-gradient(${grad||'#dce4e0 0% 100%'})"></div><div class="donut-legend">${top.map((x,i)=>`<div><i class="dot" style="background:${colors[i]}"></i>${escapeHTML(x[0])}: ${escapeHTML(format(x[1],w))}</div>`).join('')}</div></div>`}
 if(w.type==='table'){const cols=fieldMetadata().slice(0,8).map(c=>c.name);return `<div class="builder-table"><table><thead><tr>${cols.map(k=>`<th>${escapeHTML(fieldLabels[k]||k)}</th>`).join('')}</tr></thead><tbody>${a.slice(0,25).map(r=>`<tr>${cols.map(k=>`<td>${escapeHTML(String(r[k]??'').slice(0,100))}</td>`).join('')}</tr>`).join('')}</tbody></table></div><div class="builder-muted">Exibindo até 25 registros dos filtros atuais.</div>`;}
 if(w.type==='heat'){const c=q.heatCounts,mx=Math.max(1,...Object.values(c));return `<div class="heatgrid" style="grid-template-columns:35px repeat(7,minmax(0,1fr))"><span></span>${['D','S','T','Q','Q','S','S'].map(x=>`<span class="heatlabel">${x}</span>`).join('')}${[8,10,12,14,16,18,20].map(h=>`<span class="heatlabel">${h}h</span>${[0,1,2,3,4,5,6].map(d=>`<div class="heatcell" title="${c[d+'-'+h]||0} registros" style="background:rgba(52,95,112,${.13+(c[d+'-'+h]||0)/mx*.82})"></div>`).join('')}`).join('')}</div>`}
 return '<p>Componente desconhecido</p>'
}
let lastPropertiesFingerprint=null;
function widgetMarkup(w){
 return `<article class="widget w${[3,4,6,12].includes(+w.width)?w.width:6} ${w.id===selectedId?'is-selected':''}" draggable="true" data-widget="${escapeHTML(w.id)}"><header class="widget-head"><span class="widget-grip" title="Arraste para reorganizar">⠿</span><span>${iconHTML(icons[w.type]||'kpi')} ${escapeHTML(w.title)}</span><button class="widget-edit" data-pin="${escapeHTML(w.id)}" aria-label="Fixar componente em um slide" title="Fixar no roteiro">${iconHTML('presentation')}</button><button class="widget-edit" data-edit="${escapeHTML(w.id)}" aria-label="Configurar componente">${iconHTML('settings')}</button></header><div class="widget-content">${draw(w)}</div><button class="widget-resize" data-resize="${escapeHTML(w.id)}" title="Clique para aumentar a largura; clique com Shift para reduzir" aria-label="Alternar largura">◢</button></article>`;
}
function renderCanvas(){
 const d=current(),banner=$('ilDataBindingBanner');
 if(banner){banner.hidden=sourceReady()&&!window.InsightLabIntegrityWarning;banner.textContent='';
  if(!sourceReady()||window.InsightLabIntegrityWarning){const t=document.createElement('span');t.textContent=[window.InsightLabIntegrityWarning,!sourceReady()?missingMessage():''].filter(Boolean).join(' ');const b=document.createElement('button');b.className='btn tiny';b.textContent='Vincular base atual';b.addEventListener('click',confirmDatasetBinding);banner.append(t);if(!sourceReady())banner.append(b)}
 }
 $('builderName').value=d.name;$('builderDashboardTitle').textContent=d.name;
 $('builderDashboardDesc').textContent=d.description||'Monte sua visão arrastando componentes.';
 const selector=$('builderDashboardList'),options=dashboards.map(x=>`<option value="${escapeHTML(x.id)}">${escapeHTML(x.name)}</option>`).join('');
 if(selector.innerHTML!==options)selector.innerHTML=options;selector.value=activeId;
 $('builderWidgetCount').textContent=d.widgets.length+' componentes';
 const grid=$('widgetGrid'),existing=[...grid.querySelectorAll(':scope > [data-widget]')];
 const structural=existing.length!==d.widgets.length||existing.some((el,i)=>el.dataset.widget!==d.widgets[i].id);
 const meta=Integrity.getDataset(),filters=Integrity.normalizeFilters(window.InsightLabDataFilters?.getActiveFilters?.()||{});
 const common=JSON.stringify([d.id,d.datasetId,sourceReady(),meta.id,meta.revision,filters]);
 if(structural){
   grid.innerHTML=d.widgets.map(w=>widgetMarkup(w)).join('')||'<div class="builder-empty" style="grid-column:span 12"><h3>Seu canvas está vazio</h3>Adicione um gráfico, KPI ou texto pela biblioteca à esquerda.</div>';
   grid.querySelectorAll(':scope > [data-widget]').forEach((el,i)=>el.dataset.renderKey=JSON.stringify([common,d.widgets[i]]));
   wireWidgets();
 }else{
   d.widgets.forEach((w,i)=>{
     const el=existing[i],fingerprint=JSON.stringify([common,w]);
     el.classList.toggle('is-selected',w.id===selectedId);
     if(el.dataset.renderKey===fingerprint)return;
     el.className=`widget w${[3,4,6,12].includes(+w.width)?w.width:6} ${w.id===selectedId?'is-selected':''}`;
     el.querySelector('.widget-head').children[1].innerHTML=iconHTML(icons[w.type]||'kpi')+' '+escapeHTML(w.title);
     el.querySelector('.widget-content').innerHTML=draw(w);
     el.dataset.renderKey=fingerprint;
   });
 }
 const pkey=JSON.stringify([d.id,selectedId,widget()]);
 if(lastPropertiesFingerprint!==pkey){lastPropertiesFingerprint=pkey;renderProperties()}
}
function renderProperties(){let w=widget(),root=$('builderProps');if(!w){root.innerHTML='<h3>Propriedades</h3><p>Selecione um componente para ajustar título, tipo, dimensão, cálculo e tamanho.</p><p class="builder-muted">O editor usa os dados importados no Data Studio.</p>';return}
const options=(obj,value)=>Object.entries(obj).map(([k,v])=>`<option value="${k}" ${value===k?'selected':''}>${v}</option>`).join('');root.innerHTML=`<h3>${iconHTML('settings')} Configurar componente</h3><label>Título</label><input data-prop="title" value="${escapeHTML(w.title)}" maxlength="90"><label>Tipo</label><select data-prop="type">${options(labels,w.type)}</select>${w.type==='text'?`<label>Conteúdo</label><textarea data-prop="text">${escapeHTML(w.text)}</textarea>`:''}${!['text','table','heat'].includes(w.type)?`<label>Agregação</label><select data-prop="metric">${options({sum:'Soma',count:'Contagem',avg:'Média',min:'Mínimo',max:'Máximo'},w.metric)}</select><label>Campo numérico</label><select data-prop="field">${options(Object.fromEntries(numericFields().map(c=>[c.name,fieldLabels[c.name]||c.name])),w.field)}</select>${!['kpi'].includes(w.type)?`<label>Agrupar por</label><select data-prop="dimension">${options({...Object.fromEntries(fieldMetadata().map(c=>[c.name,fieldLabels[c.name]||c.name])),day:'Dia',month:'Mês',hour:'Hora'},w.dimension)}</select>`:''}`:''}<label>Largura</label><select data-prop="width">${options({'3':'25%','4':'33%','6':'50%','12':'100%'},String(w.width))}</select><hr><button class="btn" id="duplicateWidget" style="width:100%">${iconHTML('duplicate')} Duplicar</button><button class="btn danger" id="removeWidget" style="width:100%">${iconHTML('delete')} Excluir componente</button>`;
root.querySelectorAll('[data-prop]').forEach(el=>el.addEventListener('change',()=>{let key=el.dataset.prop;w[key]=key==='width'?Number(el.value):el.value;w.configRevision=(w.configRevision||1)+1;setDirty();renderCanvas()}));($('duplicateWidget')||{set onclick(fn){}}).onclick=()=>{let idx=current().widgets.indexOf(w),copy=normalizeWidget({...clone(w),id:uid(),title:w.title+' (cópia)'});current().widgets.splice(idx+1,0,copy);selectedId=copy.id;setDirty();renderCanvas()};($('removeWidget')||{set onclick(fn){}}).onclick=()=>{current().widgets=current().widgets.filter(x=>x.id!==w.id);selectedId='';setDirty();renderCanvas()}}
let draggingId='';function wireWidgets(){document.querySelectorAll('[data-widget]').forEach(el=>{el.querySelector('[data-resize]').onclick=e=>{e.stopPropagation();let w=current().widgets.find(x=>x.id===el.dataset.widget),widths=[3,4,6,12],idx=widths.indexOf(+w.width);w.width=widths[(idx+(e.shiftKey?3:1))%4];selectedId=w.id;setDirty();renderCanvas()};el.onclick=e=>{if(e.target.closest('[data-edit],[data-pin]'))return;selectedId=el.dataset.widget;renderCanvas()};el.querySelector('[data-edit]').onclick=e=>{e.stopPropagation();selectedId=el.dataset.widget;renderCanvas()};el.addEventListener('dragstart',e=>{draggingId=el.dataset.widget;e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',draggingId)});el.addEventListener('dragover',e=>{e.preventDefault();el.classList.add('dragover')});el.addEventListener('dragleave',()=>el.classList.remove('dragover'));el.addEventListener('drop',e=>{e.preventDefault();el.classList.remove('dragover');let from=current().widgets.findIndex(x=>x.id===draggingId),to=current().widgets.findIndex(x=>x.id===el.dataset.widget);if(from<0||to<0||from===to)return;let [item]=current().widgets.splice(from,1);current().widgets.splice(to,0,item);setDirty();renderCanvas()})})}
function add(type){let w=normalizeWidget({type,title:labels[type],width:type==='kpi'?4:type==='table'||type==='heat'?12:6,dimension:type==='line'?'month':'category'});current().widgets.push(w);selectedId=w.id;setDirty();renderCanvas()}
function newDash(){let d={id:uid(),name:'Novo dashboard',description:'Uma visão criada no InsightLab Canvas',...binding(),widgets:[]};dashboards.push(d);activeId=d.id;selectedId='';setDirty();renderCanvas()}
function fileDownload(name,txt,type){let url=URL.createObjectURL(new Blob([txt],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
function bindControls(){document.querySelectorAll('[data-add]').forEach(el=>el.onclick=()=>add(el.dataset.add));($('builderDashboardList')||{set onchange(fn){}}).onchange=e=>{activeId=e.target.value;selectedId='';renderCanvas()};($('newDashboard')||{set onclick(fn){}}).onclick=newDash;($('builderName')||{set onchange(fn){}}).onchange=e=>{current().name=e.target.value.trim()||'Dashboard sem nome';setDirty();renderCanvas()};($('renameDashboard')||{set onclick(fn){}}).onclick=()=>{let t=prompt('Nome do dashboard',current().name);if(t?.trim()){current().name=t.trim();setDirty();renderCanvas()}};($('copyDashboard')||{set onclick(fn){}}).onclick=()=>{let copy=clone(current());copy.id=uid();copy.name+=' — cópia';const ids=new Map();copy.widgets=copy.widgets.map(w=>{const id=uid();ids.set(w.id,id);return {...w,id}});copy.slides=(copy.slides||[]).map(sl=>({...sl,id:uid(),sourceDashboardId:copy.id,widgetRefs:(sl.widgetRefs||[]).filter(r=>ids.has(r.widgetId)).map(r=>({...r,widgetId:ids.get(r.widgetId)}))}));dashboards.push(copy);activeId=copy.id;selectedId='';setDirty();renderCanvas()};($('deleteDashboard')||{set onclick(fn){}}).onclick=()=>{if(dashboards.length===1)return alert('Mantenha pelo menos um dashboard.');if(!confirm('Excluir este dashboard?'))return;dashboards=dashboards.filter(x=>x.id!==activeId);activeId=dashboards[0].id;selectedId='';setDirty();renderCanvas()};($('exportDashboard')||{set onclick(fn){}}).onclick=()=>{
 const exportDoc={schemaVersion:2,version:2,exportedAt:new Date().toISOString(),sourceDataset:Integrity.getDataset(),dashboards};
 fileDownload('insightlab_dashboards_v2.json',JSON.stringify(exportDoc,null,2),'application/json');
};
($('importDashboard')||{set onclick(fn){}}).onclick=()=>$('importDashboardFile').click();
($('importDashboardFile')||{set onchange(fn){}}).onchange=async e=>{
 const f=e.target.files[0];if(!f)return;
 try{
  if(f.size>5*1024*1024)throw Error('JSON acima de 5 MB.');
  const validated=Integrity.readImport(await f.text());
  const imported=Integrity.remapImport(validated,uid);
  if(dashboards.length+imported.length>100)throw Error('Limite total de 100 dashboards.');
  // Import does not import the original CSV. Rebinding must be explicitly approved.
  dashboards.push(...imported);activeId=imported[0].id;selectedId='';setDirty();renderCanvas();
  alert('Projeto importado com métricas e dimensões preservadas. Reimporte a fonte CSV e clique em “Vincular base atual” para habilitar os dados.');
 }catch(ex){alert('Importação cancelada, sem alterar seus projetos: '+ex.message)}
 e.target.value='';
};($('builderGoData')||{set onclick(fn){}}).onclick=()=>showPage('data');($('builderResetLayout')||{set onclick(fn){}}).onclick=()=>{if(confirm('Aplicar layout de exemplo neste dashboard?')){current().widgets=demoWidgets.map(normalizeWidget);selectedId='';setDirty();renderCanvas()}}}
// Mount into existing application without changing original dashboard engine.
let nav=document.querySelector('.menu');let button=document.createElement('button');button.className='nav';button.dataset.page='builder';button.innerHTML='<span class="navicon"><img class="il-icon" src="assets/icons-minimal/canvas.svg" alt="" aria-hidden="true"></span><span class="navtext"><strong>Canvas no-code</strong><span>Editor visual</span></span>'; button.setAttribute('aria-label','Canvas no-code');nav.insertBefore(button,nav.children[1]);
let section=document.createElement('section');section.id='builder';section.className='section';section.innerHTML=`<div class="intro"><div><div class="eyebrow">04 / EDITOR DE DASHBOARDS</div><h1>Canvas de dashboards</h1><p>Monte dashboards com cliques, arraste componentes e personalize sua visão — sem programar.</p></div><span class="pill" id="builderStatus">Salvo neste navegador</span></div><div class="builder-toolbar"><select id="builderDashboardList" title="Escolher dashboard"></select><button class="btn primary" id="newDashboard">${iconHTML('dashboard')} Novo dashboard</button><button class="btn" id="copyDashboard">${iconHTML('duplicate')} Duplicar</button><button class="btn" id="renameDashboard">${iconHTML('edit')} Renomear</button><button class="btn" id="deleteDashboard">${iconHTML('delete')} Excluir</button><button class="btn" id="templatesDashboard">${iconHTML('sparkles')} Modelos de layout</button><button class="btn" id="presentDashboard">${iconHTML('presentation')} Apresentar dashboard atual</button><button class="btn" id="exportDashboard">${iconHTML('export')} Exportar JSON</button><button class="btn" id="importDashboard">${iconHTML('upload')} Importar JSON</button><input type="file" id="importDashboardFile" accept=".json,application/json" hidden></div><div class="builder-layout"><aside class="builder-panel" style="inset:auto;width:auto;display:block;position:sticky"><h3>${iconHTML('dashboard')} Biblioteca</h3><div class="widget-palette">${Object.entries(labels).map(([type,t])=>`<button class="palette-item" data-add="${type}"><span>${iconHTML(icons[type])}</span>${t}</button>`).join('')}</div><hr><button class="btn" id="builderGoData" style="width:100%">${iconHTML('csv')} Importar dados CSV</button><button class="btn" id="builderResetLayout" style="width:100%">${iconHTML('dashboard')} Layout de exemplo</button><p class="builder-muted">Clique para adicionar. Arraste os cartões pelo cabeçalho para mudar a ordem.</p></aside><div class="builder-canvas"><div class="canvas-head"><div class="eyebrow">COMPOSIÇÃO ATUAL</div><h2 id="builderDashboardTitle"></h2><p id="builderDashboardDesc"></p><input id="builderName" style="position:absolute;left:-9999px" aria-label="Nome do dashboard"><span class="builder-count" id="builderWidgetCount"></span></div><div id="ilDataBindingBanner" class="notice il-binding-warning" role="alert" hidden></div><div class="widget-grid" id="widgetGrid"></div></div><aside class="builder-panel builder-properties" style="inset:auto;width:auto;display:block;position:sticky" id="builderProps"></aside></div><div class="builder-story" id="builderStory" aria-live="polite"></div><p class="builder-muted" style="margin-top:16px">Os dashboards são persistidos localmente neste navegador. Exporte em JSON para transferir layouts. Para colaboração em tempo real e contas, será necessário um backend.</p>`;
(document.getElementById('builderFooterNote')?.parentNode||document.querySelector('main')).insertBefore(section,document.getElementById('builderFooterNote')||null);
button.onclick=()=>showPage('builder');
const originalShowPage=showPage;showPage=function(page){originalShowPage(page);if(page==='builder')renderCanvas()};
const oldRenderAll=renderAll;renderAll=function(...args){oldRenderAll(...args);if(section.classList.contains('active'))renderCanvas()};
bindControls();
const patterns={
 executive:{name:'Visão executiva • IA',description:'Resumo financeiro e interpretação dos indicadores',widgets:[...demoWidgets,{type:'text',title:'Notas da análise',text:'Use o painel de insights para identificar padrões e levantar hipóteses.',width:12}]},
 operational:{name:'Operações & qualidade',description:'Volume de registros, cancelamentos, sazonalidade e operação',widgets:[{type:'kpi',title:'Volume de pedidos',metric:'count',width:4},{type:'kpi',title:'Valor médio',metric:'avg',width:4},{type:'kpi',title:'Maior transação',metric:'max',width:4},{type:'heat',title:'Picos de atividade',width:12},{type:'bar',title:'Vendas por unidade',dimension:'store',width:6},{type:'table',title:'Amostra auditável',width:6}]},
 performance:{name:'Performance comercial',description:'Composição por categoria e comportamento temporal',widgets:[{type:'kpi',title:'Faturamento',width:4},{type:'kpi',title:'Ticket médio',metric:'avg',width:4},{type:'kpi',title:'Quantidade de vendas',metric:'count',width:4},{type:'donut',title:'Participação por categoria',dimension:'category',width:6},{type:'bar',title:'Unidades líderes',dimension:'store',width:6},{type:'line',title:'Evolução mensal',dimension:'month',width:12}]}
};
let lastStorySignature='';function story(){const meta=Integrity.getDataset();const signature=JSON.stringify([activeId,sourceReady(),meta.id,meta.revision,window.InsightLabDataFilters?.getActiveFilters?.()||{}]);let root=$('builderStory');if(!root||lastStorySignature===signature)return;lastStorySignature=signature;let a=dataset();if(!sourceReady()){root.textContent=missingMessage();return}if(!a.length){root.innerHTML='<p>Importe um CSV para gerar interpretações a partir dos registros.</p>';return}let total=a.reduce((s,r)=>s+safeNum(r.amount),0),by=new Map(),monthly=new Map();a.forEach(r=>{by.set(r.category,(by.get(r.category)||0)+safeNum(r.amount));let month=String(r.date).slice(0,7);monthly.set(month,(monthly.get(month)||0)+safeNum(r.amount))});let top=[...by].sort((a,b)=>b[1]-a[1])[0],months=[...monthly].sort((a,b)=>a[0].localeCompare(b[0])),last=months.at(-1),prior=months.at(-2),pct=prior&&prior[1]>0?((last[1]-prior[1])/prior[1]*100):null,ratio=total>0&&top?top[1]/total*100:0;let notices=[`Nos ${num(a.length)} registros concluídos, a receita é ${money(total)} e o valor médio é ${money(total/a.length)}.`,top?`A categoria ${top[0]} representa ${ratio.toFixed(1)}% da receita; vale investigar a concentração e possíveis riscos de dependência.`:'Sem categorias para comparar.',pct!==null?`No último mês disponível (${last[0]}), a receita ${pct>=0?'aumentou':'diminuiu'} ${Math.abs(pct).toFixed(1)}% frente ao mês anterior. A comparação considera meses existentes, não períodos completos.`:'Importe registros em pelo menos dois meses para comparação de tendência.'];root.innerHTML='<div><span class="eyebrow">EXPLAINABLE ANALYTICS · SEM LLM</span><h3>'+iconHTML('insight')+' O que os dados sugerem?</h3><p>Regras estatísticas transparentes: análises descritivas, não previsões nem causalidade.</p></div>'+notices.map((t,i)=>`<div class="story-point"><b>0${i+1}</b><span>${escapeHTML(t)}</span></div>`).join('')}
($('templatesDashboard')||{set onclick(fn){}}).onclick=()=>{let choice=prompt('Escolha um modelo: 1 = Executivo, 2 = Operações, 3 = Comercial','1');if(!choice)return;let template=patterns[({'1':'executive','2':'operational','3':'performance'})[choice]||'executive'];let d={id:uid(),name:template.name,description:template.description,...binding(),widgets:template.widgets.map(x=>normalizeWidget(clone(x)))};dashboards.push(d);activeId=d.id;selectedId='';setDirty();renderCanvas();story()};
($('presentDashboard')||{set onclick(fn){}}).onclick=()=>window.InsightLabPresentStudio?.open();
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&presentation)$('presentDashboard').click()});
let baseRenderCanvas=renderCanvas;renderCanvas=function(){baseRenderCanvas();story()};
window.InsightLabBuilderRefresh=()=>renderCanvas();
window.addEventListener('insightlab:data-changed',()=>{if(!section.classList.contains('active'))return;renderCanvas()});
window.InsightLabBuilder={
 getCurrentDashboard:()=>clone(current()),
 getDashboardSummaries:()=>dashboards.map(d=>({id:d.id,name:d.name||'Dashboard',slides:(d.slides||[]).length,widgets:(d.widgets||[]).length})),
 getQueryStats:()=>Query.stats(),
 getActiveId:()=>activeId,
 getDashboardById:id=>{const d=dashboards.find(x=>x.id===id);return d?clone(d):null},
 getDataRows:filters=>dataset(filters).map(r=>({...r})),
 getDataBinding:()=>({dashboardId:current()?.id,dashboardDatasetId:current()?.datasetId,dataset:Integrity.getDataset(),ready:sourceReady(),warning:sourceReady()?'':missingMessage()}),
 renderWidget:(widgetId,filters,widgetState)=>{const w=current().widgets.find(x=>x.id===widgetId);return w?draw(widgetState?{...w,...widgetState}:w,filters):null},
 getWidgetAnalysis:(widgetId,filters,widgetState)=>{
  if(!sourceReady())return null;
  const original=current().widgets.find(x=>x.id===widgetId);if(!original)return null;
  const w=widgetState?{...original,...widgetState}:original;
  const q=Query.query(w,filters);
  return {title:w.title,type:w.type,metric:w.metric,dimension:w.dimension,field:w.field,
    records:q.records,total:q.total,groups:q.groups.map(([label,value])=>({label,value})),
    currency:formatField(w)==='currency',comparison:q.comparison};
 },
 updateSlides:(slides)=>{try{if(!Array.isArray(slides)||slides.length>100)throw Error('Máximo de 100 slides.');const ids=new Set(current().widgets.map(w=>w.id));current().slides=slides.map(s=>Integrity.normalizeSlide(s,ids,false));setDirty({debounce:true});return true}catch(err){console.warn('Roteiro inválido:',err);return false}},
 selectDashboard:(id)=>{if(!dashboards.some(d=>d.id===id))return false;activeId=id;selectedId='';showPage('builder');renderCanvas();return true},
 removeDashboardById(id){if(dashboards.length<=1)return false;const found=dashboards.some(d=>d.id===id);if(!found)return false;dashboards=dashboards.filter(d=>d.id!==id);if(activeId===id)activeId=dashboards[0].id;selectedId='';setDirty();renderCanvas();return true},addGeneratedDashboard(plan){
 const allowed=new Set(Object.keys(icons));
 const incoming=Array.isArray(plan.widgets)?plan.widgets.slice(0,12):[];
 const metadata=fieldMetadata(),names=new Set(metadata.map(c=>c.name)),numbers=new Set(numericFields().map(c=>c.name)),derived=new Set(['day','month','hour']);
 const widgets=incoming.filter(w=>allowed.has(w.type)).map(w=>{
   const metricName=['sum','avg','count','min','max'].includes(w.metric)?w.metric:'count';
   const field=names.has(w.field)&& (metricName==='count'||numbers.has(w.field))?w.field:(metricName==='count'?(names.has('amount')?'amount':metadata[0]?.name||'amount'):(numbers.has('amount')?'amount':numericFields()[0]?.name||''));
   const dimension=(names.has(w.dimension)||derived.has(w.dimension))?w.dimension:(names.has('category')?'category':metadata.find(c=>c.kind!=='number')?.name||'month');
   return normalizeWidget({type:w.type,title:String(w.title||labels[w.type]).slice(0,90),metric:field?metricName:'count',field:field||'amount',dimension,width:[3,4,6,12].includes(w.width)?w.width:6,text:String(w.text||'').slice(0,1200)});
 });
 if(!widgets.length)throw Error('A IA não retornou widgets suportados');
 const dashboard={id:uid(),name:String(plan.name||'Dashboard IA').slice(0,100),description:String(plan.description||'').slice(0,230),...binding(),widgets};
 dashboards.push(dashboard);activeId=dashboard.id;selectedId='';setDirty();renderCanvas();showPage('builder');
 // Prepare a linked story automatically; the user may open or edit it later.
 try{window.InsightLabPresentStudio?.ensureForCurrent?.()}catch(err){console.warn('Não foi possível preparar o roteiro automático:',err)}
 window.dispatchEvent(new CustomEvent('insightlab:dashboard-created',{detail:{id:dashboard.id,name:dashboard.name}}));
 return dashboard;
}};
document.getElementById('widgetGrid').addEventListener('click',e=>{const pin=e.target.closest('[data-pin]');if(!pin)return;e.preventDefault();e.stopPropagation();window.InsightLabPresentStudio?.pinWidget(pin.dataset.pin)});
renderCanvas();
})();
