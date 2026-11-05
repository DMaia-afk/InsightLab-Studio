/* InsightLab Data Studio Grid v9.5.2 */
(()=>{
'use strict';
const root=document.querySelector('#data .card');
if(!root)return;
root.innerHTML=`
  <div class="ds-grid-heading"><div><h3>Planilha de dados</h3><p>Edite, filtre, ordene e explore todos os registros do CSV.</p></div>
  <span id="dsGridInfo" role="status"></span></div>
  <div class="ds-grid-tools">
    <label>Pesquisar<input id="dsSearch" type="search" placeholder="Buscar em todas as colunas"></label>
    <label>De<input id="dsFrom" type="date"></label>
    <label>Até (inclusive)<input id="dsTo" type="date"></label>
    <label>Status<select id="dsStatus"><option value="">Todos</option><option value="COMPLETED">Concluídos</option><option value="CANCELLED">Cancelados</option></select></label>
    <label>Registros por página<select id="dsPageSize"><option>25</option><option selected>50</option><option>100</option><option>250</option></select></label>
    <button class="btn" id="dsClear" type="button">Limpar filtros</button>
    <button class="btn" id="dsExport" type="button">Exportar filtrados</button>
    <button class="btn primary" id="dsAdd" type="button">+ Nova linha</button>
  </div>
  <p class="ds-grid-help">As datas também filtram a Visão Geral e o Canvas. Edite diretamente nas células; mudanças são salvas automaticamente neste navegador.</p>
  <div class="ds-sheet-scroll"><table class="ds-sheet"><thead><tr>
  <th data-sort="date" tabindex="0">Data ↕</th><th data-sort="store" tabindex="0">Unidade ↕</th>
  <th data-sort="category" tabindex="0">Categoria ↕</th><th data-sort="amount" tabindex="0">Valor ↕</th>
  <th data-sort="status" tabindex="0">Status ↕</th><th>Ações</th></tr></thead><tbody id="dsTbody"></tbody></table></div>
  <div class="ds-grid-footer"><span id="dsPageInfo"></span><div><button class="btn" id="dsPrev">Anterior</button><button class="btn" id="dsNext">Próxima</button></div></div>`;
const $=id=>document.getElementById(id);
const state={page:0,sort:'date',dir:1};
const keys=['dsSearch','dsFrom','dsTo','dsStatus','dsPageSize'];
const standard=['date','store','category','amount','status'];
function extraCols(){const found=new Set();data.forEach(r=>Object.keys(r).forEach(k=>{if(!standard.includes(k))found.add(k)}));return [...found].slice(0,120)}
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
const dates=()=>({from:$('dsFrom').value,to:$('dsTo').value});
function activeFilters(){return {from:$('dsFrom').value,to:$('dsTo').value,store:document.getElementById('filterStore')?.value||'',status:$('dsStatus').value,search:$('dsSearch').value.trim(),period:document.getElementById('filterPeriod')?.value||'all',excludeCancelled:true}}
let lastDate={revision:-1,length:-1,value:0};
function currentLastDate(){const revision=window.InsightLabDatasetRevision||0;if(lastDate.revision!==revision||lastDate.length!==data.length){lastDate={revision,length:data.length,value:0};for(const r of data){const v=Date.parse(r.date)||0;if(v>lastDate.value)lastDate.value=v}}return lastDate.value}
function matches(row,f){const d=String(row.date||'').slice(0,10);if(f.from&&d<f.from||f.to&&d>f.to)return false;
 if(f.store&&String(row.store)!==f.store)return false;
 if(f.status){const statuses=Array.isArray(f.status)?f.status:[f.status];if(!statuses.includes(String(row.status)))return false}
 else if(f.excludeCancelled!==false&&row.status==='CANCELLED')return false;
 if(f.search&&!Object.values(row||{}).some(v=>String(v).toLocaleLowerCase('pt-BR').includes(String(f.search).toLocaleLowerCase('pt-BR'))))return false;
 if(f.period&&f.period!=='all'&&Array.isArray(data)&&data.length&&((Date.parse(row.date)||0)<currentLastDate()-Number(f.period)*86400000))return false
 return true;
}
window.InsightLabDataFilters={inRange(row){const d=String(row.date||'').slice(0,10),{from,to}=dates();return (!from||d>=from)&&(!to||d<=to)},getDateRange:dates,getActiveFilters:activeFilters,matches};
function filtered(){
  const q=$('dsSearch').value.trim().toLocaleLowerCase('pt-BR'),status=$('dsStatus').value;
  const arr=data.map((r,i)=>({r,i})).filter(({r})=>window.InsightLabDataFilters.inRange(r)&&(!status||r.status===status)&&(!q||Object.values(r).some(v=>String(v).toLocaleLowerCase('pt-BR').includes(q))));
  const col=state.sort,dir=state.dir;
  arr.sort((a,b)=>{let x=a.r[col],y=b.r[col];if(col==='amount')return (Number(x)-Number(y))*dir;return String(x??'').localeCompare(String(y??''),'pt-BR',{numeric:true})*dir});
  return arr;
}
function syncDash(){renderAll(false);try{if(document.getElementById('builder')?.classList.contains('active'))window.InsightLabBuilderRefresh?.()}catch(e){}}
function render(){
  const all=filtered(),size=Number($('dsPageSize').value),pages=Math.max(1,Math.ceil(all.length/size));
  state.page=Math.min(state.page,pages-1);
  const portion=all.slice(state.page*size,(state.page+1)*size);
  const extras=extraCols();
  const thead=document.querySelector('.ds-sheet thead tr');
  thead.innerHTML=['date','store','category','amount','status',...extras].map(k=>`<th data-sort="${esc(k)}" tabindex="0">${esc(({date:'Data',store:'Unidade',category:'Categoria',amount:'Valor',status:'Status'})[k]||k)} ↕</th>`).join('')+'<th>Ações</th>';
  thead.querySelectorAll('th[data-sort]').forEach(th=>{const sort=()=>{const k=th.dataset.sort;state.dir=state.sort===k?-state.dir:1;state.sort=k;state.page=0;render()};th.onclick=sort;th.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();sort()}}});
  $('dsTbody').innerHTML=portion.map(({r,i})=>`<tr data-index="${i}">
    <td><input aria-label="Data do registro ${i+1}" data-field="date" type="date" value="${esc(String(r.date||'').slice(0,10))}"></td>
    <td><input aria-label="Unidade" data-field="store" value="${esc(r.store)}"></td>
    <td><input aria-label="Categoria" data-field="category" value="${esc(r.category)}"></td>
    <td><input aria-label="Valor" data-field="amount" type="number" step="0.01" min="0" value="${Number(r.amount)||0}"></td>
    <td><select aria-label="Status" data-field="status"><option value="COMPLETED" ${r.status==='COMPLETED'?'selected':''}>Concluído</option><option value="CANCELLED" ${r.status==='CANCELLED'?'selected':''}>Cancelado</option></select></td>
    ${extras.map(k=>`<td><input aria-label="${esc(k)}" data-field="${esc(k)}" value="${esc(r[k])}"></td>`).join('')}
    <td><button class="btn tiny" data-delete type="button">Excluir</button></td>
  </tr>`).join('')||`<tr><td colspan="${6+extras.length}">Nenhum registro corresponde aos filtros.</td></tr>`;
  $('dsGridInfo').textContent=`${all.length.toLocaleString('pt-BR')} de ${data.length.toLocaleString('pt-BR')} registros`;
  $('dsPageInfo').textContent=`Página ${state.page+1} de ${pages}`;
  $('dsPrev').disabled=state.page===0;$('dsNext').disabled=state.page>=pages-1;
}
function changed(){state.page=0;render();syncDash();window.dispatchEvent(new CustomEvent('insightlab:filters-changed',{detail:{filters:activeFilters()}}))}
keys.forEach(k=>$(k).addEventListener(k==='dsSearch'?'input':'change',changed));
$('dsPrev').onclick=()=>{state.page--;render()};
$('dsNext').onclick=()=>{state.page++;render()};

$('dsTbody').addEventListener('change',e=>{
  const tr=e.target.closest('tr[data-index]');if(!tr||!e.target.dataset.field)return;
  const i=Number(tr.dataset.index),field=e.target.dataset.field;
  const value=e.target.value;
  if(field==='amount'){if(!Number.isFinite(Number(value))||Number(value)<0)return;data[i][field]=Number(value)}
  else if(field==='date'){if(!value)return;data[i][field]=value+'T12:00'}
  else data[i][field]=value;
  persist();render();syncDash();
});
$('dsTbody').addEventListener('click',e=>{if(!e.target.closest('[data-delete]'))return;const tr=e.target.closest('tr[data-index]');if(!tr)return;if(!confirm('Excluir este registro?'))return;data.splice(Number(tr.dataset.index),1);persist();render();syncDash()});
$('dsClear').onclick=()=>{['dsSearch','dsFrom','dsTo','dsStatus'].forEach(k=>$(k).value='');changed()};
$('dsAdd').onclick=()=>{data.unshift({date:new Date().toISOString().slice(0,10)+'T12:00',amount:0,store:'Nova unidade',category:'Nova categoria',status:'COMPLETED'});persist();$('dsSearch').value='';$('dsFrom').value='';$('dsTo').value='';$('dsStatus').value='';state.sort='date';state.dir=-1;state.page=0;render();syncDash()};
$('dsExport').onclick=()=>{
  const rows=filtered().map(x=>x.r),cols=['date','amount','store','category','status',...extraCols()];
  const csv=[cols.join(','),...rows.map(r=>cols.map(k=>'"'+String(r[k]??'').replace(/"/g,'""')+'"').join(','))].join('\r\n');
  const url=URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'}));
  const a=document.createElement('a');a.href=url;a.download='insightlab_filtrado.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
};
renderRows=function(){render()};
const oldSelected=selected;
selected=function(){return oldSelected().filter(r=>matches(r,activeFilters()))};
render();syncDash();
})();
