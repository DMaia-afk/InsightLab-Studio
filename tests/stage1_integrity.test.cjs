'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const script=fs.readFileSync(path.join(__dirname,'../insightlab_mvp/integrity-v104.js'),'utf8');
const memory=new Map();
const ctx={
 window:{},
 localStorage:{getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,v)},
 crypto:{randomUUID:()=>`generated-${++ctx.i}`},
 Date,
 i:0
};
vm.createContext(ctx);vm.runInContext(script,ctx);
const I=ctx.window.InsightLabIntegrity;
function exported(field='duracao_minutos', dimension='barbeiro'){
 return JSON.stringify({schemaVersion:2,dashboards:[{id:'d1',name:'Barbearia',datasetId:'csv-123',datasetBinding:'confirmed',widgets:[{id:'w1',type:'bar',title:'Duração média',metric:'avg',field,dimension,width:6}],slides:[{id:'s1',title:'Duração por barbeiro',widgetRefs:[{widgetId:'w1',datasetId:'csv-123',datasetRevision:10,binding:'snapshot',filters:{from:'2026-01-01',to:'2026-10-31',status:'COMPLETED',search:'corte',store:'Norte'},widgetState:{field,metric:'avg',dimension}}],overlays:[],narrative:{text:'Teste',source:'user'}}]}]});
}
// 1. Preserve dynamic CSV fields and slides through validation/remapping.
const incoming=I.readImport(exported());
const imported=I.remapImport(incoming,()=>`remapped-${++ctx.i}`)[0];
assert.equal(imported.widgets[0].field,'duracao_minutos');
assert.equal(imported.widgets[0].dimension,'barbeiro');
assert.equal(imported.widgets[0].metric,'avg');
assert.equal(imported.slides[0].widgetRefs[0].widgetId,imported.widgets[0].id);
assert.equal(imported.slides[0].widgetRefs[0].filters.search,'corte');
assert.equal(imported.slides[0].widgetRefs[0].filters.status,'COMPLETED');
assert.equal(imported.slides[0].widgetRefs[0].filters.to,'2026-10-31');
assert.equal(imported.datasetBinding,'needs-review');
// 2. Reject duplicates.
const duplicate=JSON.parse(exported());duplicate.dashboards[0].widgets.push({...duplicate.dashboards[0].widgets[0]});
assert.throws(()=>I.readImport(JSON.stringify(duplicate)),/duplicados/);
// 3. Reject absent referenced widget and unsupported types.
const broken=JSON.parse(exported());broken.dashboards[0].slides[0].widgetRefs[0].widgetId='missing';
assert.throws(()=>I.readImport(JSON.stringify(broken)),/inexistente/);
const unsafe=JSON.parse(exported());unsafe.dashboards[0].widgets[0].type='iframe';
assert.throws(()=>I.readImport(JSON.stringify(unsafe)),/não suportado/);
assert.throws(()=>I.readImport('{oops'),/inválido/);
// 4. Reject invalid dates and avoid CSS value injection.
const bad=JSON.parse(exported());bad.dashboards[0].slides[0].widgetRefs[0].filters.from='2026-10-31';bad.dashboards[0].slides[0].widgetRefs[0].filters.to='2026-01-01';
assert.throws(()=>I.readImport(JSON.stringify(bad)),/posterior/);
const overlay=JSON.parse(exported());overlay.dashboards[0].slides[0].overlays=[{id:'note1',type:'note',text:'Legível',x:'0;display:none',y:200,w:999,h:-5}];
const clean=I.readImport(JSON.stringify(overlay));
assert.equal(clean.dashboards[0].slides[0].overlays[0].x,0); // clamped inside slide when width=100%
assert.equal(clean.dashboards[0].slides[0].overlays[0].y,95);
assert.equal(clean.dashboards[0].slides[0].overlays[0].w,100);
assert.equal(clean.dashboards[0].slides[0].overlays[0].h,5);
// 5. Distinct dataset ID, monotonically increasing revision for edits.
const originalId=I.getDataset().id;I.registerImport({name:'Barbearia.csv',columns:['data','barbeiro','duracao_minutos']});
const before=I.getDataset();assert.notEqual(before.id,originalId);assert.equal(before.revision,0);
I.onPersist([{data:'2026-10-01',barbeiro:'João',duracao_minutos:40}]);
assert.equal(I.getDataset().revision,1);assert.equal(I.getDataset().id,before.id);
I.registerReset();assert.notEqual(I.getDataset().id,before.id);
console.log('OK — Stage 1: 13 asserções/grupos, identidade, schema, referências, filtros e segurança.');
