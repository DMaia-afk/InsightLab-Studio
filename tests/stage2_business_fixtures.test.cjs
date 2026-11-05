'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {createEngine}=require('../insightlab_mvp/query-engine-v105.js');
const fixtures=[
 {file:'barbearia.csv',sep:';',field:'valor_cobrado',dimension:'barbeiro'},
 {file:'pizzaria.csv',sep:',',field:'total',dimension:'filial'},
 {file:'brinquedos.csv',sep:';',field:'valor',dimension:'categoria'}
];
function toNumber(x){let s=String(x??'').trim();if(s.includes(',')&&s.includes('.'))s=s.lastIndexOf(',')>s.lastIndexOf('.')?s.replace(/\./g,'').replace(',','.'):s.replace(/,/g,'');else s=s.replace(',','.');return Number(s)||0}
function parse(f){const lines=fs.readFileSync(path.join(__dirname,'../examples',f.file),'utf8').replace(/^\uFEFF/,'').trim().split(/\r?\n/),headers=lines.shift().split(f.sep);return lines.map(l=>{const vals=l.split(f.sep),r=Object.fromEntries(headers.map((h,i)=>[h,vals[i]??'']));if(!r.date&&r.data_atendimento){const [dd,mm,yyyy]=r.data_atendimento.split('/');r.date=`${yyyy}-${mm}-${dd}T12:00`}return r})}
for(const f of fixtures){const rows=parse(f),name=f.file;assert.ok(rows.length>1000,name);let revision=1;
 const engine=createEngine({getRows:()=>rows,getMeta:()=>({id:name,revision}),getActiveFilters:()=>({}),normalizeFilters:x=>x||{},matches:(r)=>r.status!=='CANCELLED'});
 const w={type:'bar',field:f.field,dimension:f.dimension,metric:'sum'};
 const res=engine.query(w),expected=rows.filter(r=>r.status!=='CANCELLED').reduce((n,r)=>n+toNumber(r[f.field]),0);
 assert.ok(Math.abs(res.total-expected)<0.01,`${name}: ${res.total} vs ${expected}`);
 assert.ok(res.groups.length>1,name);assert.ok(res.records>1000,name);
 const before=engine.stats();engine.query(w);assert.equal(engine.stats().aggregations,before.aggregations);
 const old=res.total;rows[0][f.field]=String(toNumber(rows[0][f.field])+100);revision++;
 const after=engine.query(w).total;assert.ok(Math.abs(after-old-100)<0.01,name);
 console.log(`PASS ${name}: ${rows.length} rows, grouped ${res.groups.length}, total ${res.total.toFixed(2)}, revision tracking`);
}
