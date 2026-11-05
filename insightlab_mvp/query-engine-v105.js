/* InsightLab 10.5 — shared, bounded analytical query engine.
 * No framework, database, remote API or user-facing business rules are introduced.
 * Canvas and Dashboard Story share the SAME aggregates by dataset revision and filter state.
 */
(function(scope){'use strict';
  const MAX_RESULTS=96, MAX_FILTER_SETS=2, MAX_CACHED_ROWS=150000;
  const isObject=x=>x&&typeof x==='object'&&!Array.isArray(x);
  const canonical=x=>Array.isArray(x)?x.map(canonical):isObject(x)?Object.fromEntries(Object.keys(x).sort().map(k=>[k,canonical(x[k])])):x;
  const key=x=>JSON.stringify(canonical(x));
  const number=x=>{
    if(typeof x==='number')return Number.isFinite(x)?x:null;
    if(x===undefined||x===null||String(x).trim()==='')return null;
    let s=String(x).trim().replace(/\s/g,'');
    if(s.includes(',')&&s.includes('.'))s=s.lastIndexOf(',')>s.lastIndexOf('.')?s.replace(/\./g,'').replace(',','.'):s.replace(/,/g,'');
    else if(s.includes(','))s=s.replace(',','.');
    const n=Number(s);return Number.isFinite(n)?n:null;
  };
  const dimKey=(row,dimension)=>{
    if(dimension==='month')return String(row.date||'').slice(0,7);
    if(dimension==='day')return String(row.date||'').slice(0,10);
    if(dimension==='hour')return String(row.date||'').slice(11,13)||'--';
    return String(row[dimension]??'Não informado');
  };
  function accumulator(){return {count:0,numericCount:0,sum:0,min:Infinity,max:-Infinity}}
  function add(a,value){a.count++;if(value===null)return;a.numericCount++;a.sum+=value;if(value<a.min)a.min=value;if(value>a.max)a.max=value}
  function finish(a,operation){if(operation==='count')return a.count;if(!a.numericCount)return 0;
    if(operation==='avg')return a.sum/a.numericCount;
    if(operation==='min')return a.min;
    if(operation==='max')return a.max;
    return a.sum;
  }
  function createEngine({getRows,getMeta,getActiveFilters,normalizeFilters,matches}){
    const results=new Map(),filterSets=new Map();
    let stamp='',statistics={scans:0,aggregations:0,cacheHits:0,filterHits:0,invalidations:0};
    function identity(){const m=getMeta()||{};return String(m.id??'local')+'@'+String(m.revision??0)}
    function sync(){const now=identity();if(now!==stamp){stamp=now;results.clear();filterSets.clear();statistics.invalidations++}}
    function normalized(filters){return normalizeFilters?normalizeFilters(filters??getActiveFilters?.()??{}):filters??getActiveFilters?.()??{}}
    function cachePut(map,k,value,max){if(map.has(k))map.delete(k);map.set(k,value);while(map.size>max)map.delete(map.keys().next().value)}
    function filtered(filters){sync();const f=normalized(filters),fk=key(f),cached=filterSets.get(fk);
      if(cached){statistics.filterHits++;filterSets.delete(fk);filterSets.set(fk,cached);return {filters:f,rows:cached.rows,filterKey:fk}}
      const rows=getRows()||[];statistics.scans++;
      const subset=rows.filter(r=>matches(r,f));
      // Bound reference retention; aggregation cache remains useful even on very large CSVs.
      if(subset.length<=MAX_CACHED_ROWS)cachePut(filterSets,fk,{rows:subset},MAX_FILTER_SETS);
      return {filters:f,rows:subset,filterKey:fk};
    }
    function query(widget,filters){
      const w=widget||{};sync();const normalizedFilters=normalized(filters),fk=key(normalizedFilters);
      const op=['sum','avg','count','min','max'].includes(w.metric)?w.metric:'sum';
      const field=String(w.field||'amount'),dimension=String(w.dimension||'category');
      const needsHeat=w.type==='heat';const k=key([fk,field,op,dimension,needsHeat]);
      const stored=results.get(k);
      if(stored){statistics.cacheHits++;results.delete(k);results.set(k,stored);return stored}
      const cohort=filtered(normalizedFilters);
      statistics.aggregations++;
      const overall=accumulator(),groupMap=new Map(),monthMap=new Map(),heatMap=new Map();
      for(const row of cohort.rows){
        const value=op==='count'?null:number(row[field]);add(overall,value);
        const group=dimKey(row,dimension);
        let ga=groupMap.get(group);if(!ga){ga=accumulator();groupMap.set(group,ga)}add(ga,value);
        const month=dimKey(row,'month');if(month.length===7&&month[4]==='-'){let ma=monthMap.get(month);if(!ma){ma=accumulator();monthMap.set(month,ma)}add(ma,value)}
        if(needsHeat){const dt=new Date(row.date);if(!Number.isNaN(dt.getTime())){const h=dt.getDay()+'-'+dt.getHours();heatMap.set(h,(heatMap.get(h)||0)+1)}}
      }
      const groupItems=[...groupMap].map(([label,a])=>[label,finish(a,op)]).sort((a,b)=>['month','day','hour'].includes(dimension)?String(a[0]).localeCompare(String(b[0])):b[1]-a[1]);
      const monthItems=[...monthMap].sort((a,b)=>a[0].localeCompare(b[0]));
      const previous=monthItems.at(-2),last=monthItems.at(-1);
      const comparison=last&&previous?{currentPeriod:last[0],previousPeriod:previous[0],current:finish(last[1],op),previous:finish(previous[1],op),partialPeriods:true}:null;
      const out={records:cohort.rows.length,total:finish(overall,op),groups:groupItems.slice(0,12),omittedGroups:Math.max(0,groupItems.length-12),comparison,sample:cohort.rows.slice(0,25),heatCounts:Object.fromEntries(heatMap),nonEmptyNumeric:overall.numericCount};
      cachePut(results,k,out,MAX_RESULTS);return out;
    }
    function invalidate(){results.clear();filterSets.clear();stamp=identity();statistics.invalidations++}
    return {query,filteredRows:filters=>filtered(filters).rows,invalidate,stats:()=>({...statistics,results:results.size,filterSets:filterSets.size,revision:stamp})};
  }
  const factory={createEngine};
  if(typeof module!=='undefined'&&module.exports)module.exports=factory;
  scope.InsightLabQueryEngineFactory=factory;
  if(typeof document!=='undefined'){
    // Data Studio and Integrity are loaded first; defer reading data until a query arrives.
    scope.InsightLabQueryEngine=createEngine({
      getRows:()=>typeof data!=='undefined'&&Array.isArray(data)?data:[],
      getMeta:()=>scope.InsightLabIntegrity?.getDataset?.(),
      getActiveFilters:()=>scope.InsightLabDataFilters?.getActiveFilters?.()||{},
      normalizeFilters:f=>scope.InsightLabIntegrity?.normalizeFilters?.(f)||f,
      matches:(r,f)=>scope.InsightLabDataFilters?.matches?.(r,f)??true
    });
    scope.addEventListener('insightlab:data-changed',()=>scope.InsightLabQueryEngine?.invalidate());
  }
})(typeof window!=='undefined'?window:globalThis);
