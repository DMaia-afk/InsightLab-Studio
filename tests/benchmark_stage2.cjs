/* Deterministic-ish local comparison of shared aggregates vs independent repeated scans.
   Uses synthetic datasets at three scales and reports environment-specific times.
   Run: node tests/benchmark_stage2.cjs
*/
'use strict';
const {performance}=require('node:perf_hooks');
const {createEngine}=require('../insightlab_mvp/query-engine-v105.js');
function records(n){const names=['A','B','C','D','E','F'],rows=[];
 for(let i=0;i<n;i++)rows.push({date:`2026-${String(1+(i%10)).padStart(2,'0')}-01T10:00`,barbeiro:names[i%6],valor_cobrado:30+i%90,duracao_minutos:20+i%35,status:i%17?'COMPLETED':'CANCELLED'});return rows}
function independent(rows,spec){const map=new Map();for(const row of rows){if(row.status!=='COMPLETED')continue;const k=row[spec.dimension],v=Number(row[spec.field]);const a=map.get(k)||{sum:0,count:0};a.sum+=v;a.count++;map.set(k,a)}return [...map].map(([k,a])=>[k,spec.metric==='avg'?a.sum/a.count:a.sum])}
const configs=[{metric:'sum',field:'valor_cobrado',dimension:'barbeiro'},{metric:'avg',field:'duracao_minutos',dimension:'barbeiro'},{metric:'sum',field:'valor_cobrado',dimension:'month'}];
for(const n of [1000,10000,100000]){
 const rows=records(n),specs=Array.from({length:36},(_,i)=>configs[i%configs.length]);let revision=1;
 const engine=createEngine({getRows:()=>rows,getMeta:()=>({id:'benchmark',revision}),getActiveFilters:()=>({excludeCancelled:true}),normalizeFilters:f=>f||{excludeCancelled:true},matches:(r,f)=>f.excludeCancelled!==false?r.status!=='CANCELLED':true});
 const t0=performance.now();specs.forEach(s=>independent(rows,s));const naive=performance.now()-t0;
 const t1=performance.now();specs.forEach(s=>engine.query(s));const shared=performance.now()-t1;
 const st=engine.stats();console.log(`${n.toLocaleString('en-US').padStart(7)} rows | repeated scans ${naive.toFixed(1).padStart(7)} ms | shared engine ${shared.toFixed(1).padStart(7)} ms | aggregates ${st.aggregations}, cache hits ${st.cacheHits}, filtered scans ${st.scans}`);
}
