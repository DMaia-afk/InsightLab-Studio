'use strict';
const assert=require('node:assert/strict');
const {createEngine}=require('../insightlab_mvp/query-engine-v105.js');
const original=[
 {date:'2026-09-01T10:00',barbeiro:'A',servico:'Corte',valor_cobrado:'45,00',duracao_minutos:'30',status:'COMPLETED'},
 {date:'2026-09-02T11:00',barbeiro:'A',servico:'Barba',valor_cobrado:'25,00',duracao_minutos:'20',status:'COMPLETED'},
 {date:'2026-10-01T10:00',barbeiro:'B',servico:'Corte',valor_cobrado:'60,00',duracao_minutos:'40',status:'COMPLETED'},
 {date:'2026-10-02T10:00',barbeiro:'A',servico:'Corte',valor_cobrado:'0',duracao_minutos:'',status:'CANCELLED'}
];
let rows=[...original],revision=1,datasetId='barber';
let currentFilters={from:'',to:'',status:'COMPLETED',search:'',excludeCancelled:true};
const normalize=f=>({...{from:'',to:'',store:'',status:'',search:'',period:'all',excludeCancelled:true},...f});
const matches=(r,f)=>{
 const dt=String(r.date).slice(0,10);
 return (!f.from||dt>=f.from)&&(!f.to||dt<=f.to)&&(!f.status||r.status===f.status)
    &&(!f.search||Object.values(r).some(x=>String(x).toLowerCase().includes(f.search.toLowerCase())));
};
const engine=createEngine({getRows:()=>rows,getMeta:()=>({id:datasetId,revision}),getActiveFilters:()=>currentFilters,normalizeFilters:normalize,matches});
const spec={type:'bar',field:'duracao_minutos',metric:'avg',dimension:'barbeiro'};
let first=engine.query(spec);assert.equal(first.records,3);assert.equal(first.total,30);
assert.deepEqual(first.groups.map(x=>[x[0],x[1]]),[['B',40],['A',25]]);
assert.equal(first.comparison.previous,25);assert.equal(first.comparison.current,40);
const stats=engine.stats();const same=engine.query({...spec,type:'line'});
assert.strictEqual(first,same,'Canvas e slides devem compartilhar o mesmo resultado agregado');
assert.equal(engine.stats().aggregations,stats.aggregations);
assert.equal(engine.stats().scans,stats.scans);
assert.equal(engine.stats().cacheHits,stats.cacheHits+1);
const sum=engine.query({...spec,metric:'sum',field:'valor_cobrado'});
assert.equal(sum.total,130);assert.equal(engine.stats().scans,1,'mesmo filtro deve reutilizar conjunto filtrado');
const pinned=engine.query(spec,{from:'2026-09-01',to:'2026-09-30',status:'COMPLETED'});
assert.equal(pinned.total,25);assert.equal(pinned.records,2);
const noRows=engine.query(spec,{from:'2027-01-01',to:'2027-01-31',status:'COMPLETED'});
assert.equal(noRows.total,0);assert.equal(noRows.records,0);
const cachedPinned=engine.query(spec,{from:'2026-09-01',to:'2026-09-30',status:'COMPLETED'});
assert.strictEqual(cachedPinned,pinned,'cache de recorte fixado');
rows.push({date:'2026-09-10T09:00',barbeiro:'B',servico:'Corte',valor_cobrado:'90',duracao_minutos:50,status:'COMPLETED'});revision++;
const updated=engine.query(spec,{from:'2026-09-01',to:'2026-09-30',status:'COMPLETED'});
assert.equal(updated.records,3);assert.equal(updated.total,(30+20+50)/3);
assert.notStrictEqual(updated,pinned,'nova revisão invalida o cache antigo');
const afterRevision=engine.stats();assert.ok(afterRevision.invalidations>=2);
datasetId='pizzeria';revision=0;
const rebind=engine.query(spec);assert.notStrictEqual(rebind,first);
assert.equal(rebind.records,4); // independent filter state is preserved; latest uses currentFilters
// Large repeated calls retain a bounded number of aggregates.
for(let i=0;i<140;i++)engine.query({field:'valor_cobrado',metric:'sum',dimension:'dim'+i});
assert.ok(engine.stats().results<=96,engine.stats());
assert.ok(engine.stats().filterSets<=3,engine.stats());
console.log('PASS stage2: sums/averages, custom fields, shared cache, filter isolation, revision invalidation and limits');
