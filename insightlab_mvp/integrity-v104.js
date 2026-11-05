/* InsightLab v10.4 — Dataset identity, schema v2, input validation and filter contract.
   Deliberately dependency-free: the local MVP does not implement user authentication. */
(()=>{'use strict';
const KEY='insightlab_dataset_identity_v104', MAX_WIDGETS=80, MAX_SLIDES=100;
const plain=x=>x!==null&&typeof x==='object'&&!Array.isArray(x)&&Object.getPrototypeOf(x)===Object.prototype;
const uid=()=>typeof crypto!=='undefined'&&crypto.randomUUID?crypto.randomUUID():'il-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,12);
const copy=x=>JSON.parse(JSON.stringify(x));
function fail(message){throw new Error(message)}
function safeString(value,max=120){return String(value??'').slice(0,max)}
function safeKey(value,label='Campo'){const v=safeString(value,120);if(!v||['__proto__','prototype','constructor'].includes(v)||/[\u0000-\u001f]/.test(v))fail(`${label} inválido: ${v.slice(0,30)}`);return v}
function safeDate(v){const s=safeString(v,10);if(!s)return '';if(!/^\d{4}-\d{2}-\d{2}$/.test(s)||Number.isNaN(Date.parse(s+'T12:00:00Z'))||new Date(s+'T12:00:00Z').toISOString().slice(0,10)!==s)fail('Data inválida no filtro: '+s);return s}
function boundedNum(v,min,max,fallback){const n=Number(v);return Number.isFinite(n)?Math.min(max,Math.max(min,n)):fallback}
const TYPES=new Set(['kpi','bar','line','donut','table','text','heat']);
const METRICS=new Set(['sum','avg','count','min','max']);
function normalizeFilters(x){if(x==null)return {from:'',to:'',store:'',status:'',search:'',period:'all',excludeCancelled:true};if(!plain(x))fail('Filtros inválidos.');
 const status=Array.isArray(x.status)?x.status.map(s=>safeString(s,80)).slice(0,30):safeString(x.status,80);
 const period=['all','30','90'].includes(x.period)?x.period:'all';
 const f={from:safeDate(x.from||x.dateFrom),to:safeDate(x.to||x.dateTo),store:safeString(x.store,120),status,search:safeString(x.search,250),period,excludeCancelled:x.excludeCancelled!==false};
 if(f.from&&f.to&&f.from>f.to)fail('Data inicial posterior à final.');return f;
}
function normalizeWidget(w){if(!plain(w))fail('Widget inválido no JSON.');if(!TYPES.has(w.type))fail('Tipo de widget não suportado: '+safeString(w.type));
 const metric=w.metric==null?'sum':w.metric;if(!METRICS.has(metric))fail('Agregação não suportada: '+safeString(metric));return {id:safeKey(w.id||uid(),'ID de widget'),type:w.type,title:safeString(w.title||'Widget',90),metric,
 field:safeKey(w.field||'amount','Métrica'),dimension:safeKey(w.dimension||'category','Dimensão'),width:[3,4,6,12].includes(+w.width)?Number(w.width):6,
 text:safeString(w.text,2000),configRevision:boundedNum(w.configRevision,1,999999,1)};
}
function normalizeSlide(sl,wids,strict){if(!plain(sl))fail('Slide inválido no JSON.');const rawRefs=sl.widgetRefs??[];if(!Array.isArray(rawRefs)||rawRefs.length>3)fail('Slide excede o limite de três widgets.');
 const refs=rawRefs.map(r=>{if(!plain(r))fail('Referência inválida de widget.');const wid=safeKey(r.widgetId,'Referência de widget');if(strict&&!wids.has(wid))fail('O slide referencia um widget inexistente: '+wid);
 const binding=r.binding==='snapshot'?'snapshot':'live';let state=null;if(r.widgetState!=null){if(!plain(r.widgetState))fail('Estado do widget inválido.');state={};for(const k of ['type','title','field','metric','dimension'])if(r.widgetState[k]!=null)state[k]=safeString(r.widgetState[k],k==='title'?90:120);if(state.type&&!TYPES.has(state.type))fail('Tipo inválido no estado capturado.');if(state.metric&&!METRICS.has(state.metric))fail('Métrica inválida no estado capturado.');for(const k of ['field','dimension'])if(state[k])safeKey(state[k],k)}
 return {widgetId:wid,datasetId:safeString(r.datasetId||r.datasetKey,120),datasetRevision:boundedNum(r.datasetRevision,0,1e12,0),capturedAt:safeString(r.capturedAt,40),binding,filters:normalizeFilters(r.filters),widgetState:state};});
 const rawOverlays=sl.overlays??[];if(!Array.isArray(rawOverlays)||rawOverlays.length>25)fail('Slide excede o limite de anotações.');
 const overlays=rawOverlays.map(o=>{if(!plain(o))fail('Anotação inválida.');return {id:safeKey(o.id||uid(),'ID de anotação'),type:o.type==='highlight'?'highlight':'note',text:safeString(o.text,240),x:boundedNum(o.x,0,95,8),y:boundedNum(o.y,0,95,8),w:boundedNum(o.w,5,100,30),h:boundedNum(o.h,5,95,14)}});
 const overlayIds=new Set();for(const o of overlays){if(overlayIds.has(o.id))fail('IDs de anotações duplicados.');overlayIds.add(o.id);o.x=Math.min(o.x,100-o.w);o.y=Math.min(o.y,100-o.h)}
 const narrative=plain(sl.narrative)?sl.narrative:{};
 return {id:safeKey(sl.id||uid(),'ID de slide'),title:safeString(sl.title||'Recorte',110),sourceDashboardId:safeString(sl.sourceDashboardId,120),generatedBy:safeString(sl.generatedBy,50),generatedAt:safeString(sl.generatedAt,40),widgetRefs:refs,overlays,narrative:{text:safeString(narrative.text,1800),source:['local','user','model','auto'].includes(narrative.source)?narrative.source:'local'},highlight:sl.highlight!==false};
}
function normalizeDashboard(d,strict=false){if(!plain(d))fail('Dashboard inválido no JSON.');if(!Array.isArray(d.widgets)||d.widgets.length>MAX_WIDGETS)fail('Dashboard excede o limite de 80 widgets.');const widgets=d.widgets.map(normalizeWidget),ids=new Set();for(const w of widgets){if(ids.has(w.id))fail('IDs de widgets duplicados: '+w.id);ids.add(w.id)}
 if(d.slides!==undefined&&(!Array.isArray(d.slides)||d.slides.length>MAX_SLIDES))fail('Dashboard excede o limite de 100 slides.');
 const slides=(d.slides||[]).map(s=>normalizeSlide(s,ids,strict)),sids=new Set();for(const s of slides){if(sids.has(s.id))fail('IDs de slides duplicados: '+s.id);sids.add(s.id)}
 return {id:safeKey(d.id||uid(),'ID de dashboard'),name:safeString(d.name||'Dashboard sem nome',100),description:safeString(d.description,230),datasetId:safeString(d.datasetId,120),datasetBinding:d.datasetBinding==='confirmed'?'confirmed':'needs-review',widgets,slides};
}
function readImport(text){if(typeof text!=='string'||text.length>5*1024*1024)fail('Arquivo JSON maior que 5 MB.');let obj;try{obj=JSON.parse(text)}catch{fail('JSON inválido: verifique a sintaxe do arquivo.')}if(!plain(obj))fail('Raiz do JSON inválida.');
 const ver=obj.schemaVersion??obj.version;if(![1,2].includes(ver))fail('Versão de projeto não suportada: '+safeString(ver));if(!Array.isArray(obj.dashboards)||obj.dashboards.length<1||obj.dashboards.length>100)fail('Quantidade inválida de dashboards.');
 const dashboards=obj.dashboards.map(d=>normalizeDashboard(d,true)),ids=new Set();for(const d of dashboards){if(ids.has(d.id))fail('ID de dashboard duplicado.');ids.add(d.id)}return {schemaVersion:2,dashboards};
}
function remapImport(valid,makeId=uid){return valid.dashboards.map(d=>{const map=new Map();const newWidgets=d.widgets.map(w=>{const id=makeId();map.set(w.id,id);return {...w,id}});const id=makeId();return {...d,id,widgets:newWidgets,datasetBinding:'needs-review',slides:d.slides.map(s=>({...s,id:makeId(),sourceDashboardId:id,widgetRefs:s.widgetRefs.map(r=>({...r,widgetId:map.get(r.widgetId),datasetId:r.datasetId||d.datasetId}))}))}})}
function readMeta(){try{const m=JSON.parse(localStorage.getItem(KEY)||'null');if(plain(m)&&typeof m.id==='string'&&m.id.length>4&&Number.isFinite(m.revision))return m}catch{}return null}
let meta=readMeta();if(!meta){const remembered=localStorage.getItem('insightlab_demo_v1');meta={id:uid(),revision:1,name:remembered?'Base local existente':'Demonstração',source:remembered?'legacy':'demo',columns:[],changedAt:new Date().toISOString()};try{localStorage.setItem(KEY,JSON.stringify(meta))}catch{}}
function save(){meta.changedAt=new Date().toISOString();try{localStorage.setItem(KEY,JSON.stringify(meta))}catch{}}
function registerImport({name,columns}={}){meta={id:uid(),revision:0,name:safeString(name||'CSV importado',160),source:'csv',columns:Array.isArray(columns)?columns.map(x=>safeString(typeof x==='string'?x:x?.name,120)).filter(Boolean).slice(0,150):[],changedAt:new Date().toISOString()};save();return copy(meta)}
function registerReset(){meta={id:uid(),revision:0,name:'Sem dados',source:'empty',columns:[],changedAt:new Date().toISOString()};save();return copy(meta)}
function onPersist(rows){meta.revision=(Number(meta.revision)||0)+1;try{if(Array.isArray(rows)&&rows.length){const names=new Set(meta.columns||[]);for(const r of rows){for(const k of Object.keys(r||{})){if(!['__proto__','prototype','constructor'].includes(k))names.add(k)}if(names.size>=150)break}meta.columns=[...names].slice(0,150)}}catch{}save();return copy(meta)}
const get=()=>copy(meta);
window.InsightLabIntegrity={readImport,remapImport,normalizeDashboard,normalizeFilters,normalizeSlide,normalizeWidget,getDataset:get,registerImport,registerReset,onPersist,makeId:uid};
})();
