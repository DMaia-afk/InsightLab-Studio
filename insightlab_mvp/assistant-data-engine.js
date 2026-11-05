/* InsightLab 10.3 — column-aware analytical tool registry (browser-local, no eval / no SQL). */
(()=>{'use strict';
const money=n=>new Intl.NumberFormat(window.InsightLabI18n?.getLocale?.()==='en'?'en-US':'pt-BR',{style:'currency',currency:'BRL'}).format(n);
const number=n=>new Intl.NumberFormat(window.InsightLabI18n?.getLocale?.()==='en'?'en-US':'pt-BR',{maximumFractionDigits:2}).format(n);
const english=()=>window.InsightLabI18n?.getLocale?.()==='en';
const norm=x=>String(x??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const numeric=x=>{if(typeof x==='number')return x;let s=String(x??'').replace(/R\$|\s/g,'');if(s.includes(',')&&s.includes('.'))s=s.lastIndexOf(',')>s.lastIndexOf('.')?s.replace(/\./g,'').replace(',','.'):s.replace(/,/g,'');else if(s.includes(','))s=s.replace(',','.');return Number(s)};
const hasNumber=x=>x!==null&&x!==undefined&&String(x).trim()!==''&&Number.isFinite(numeric(x));
const rows=()=>{try{return Array.isArray(data)?data:[]}catch{return []}};
const catalog=()=>{try{return window.InsightLabSmartImport?.catalog?.()}catch{return null}};
function columns(){
 const items=rows(),colMap=new Map(),mapping=catalog();
 const defs=new Map((mapping?.columns||[]).map(c=>[c.name,c]));
 for(const r of items) for(const [name,value] of Object.entries(r||{})){
   if(!name||name.length>100||colMap.size>=100)continue;
   let meta=colMap.get(name);if(!meta){meta={name,non_empty:0,unique:0,values:new Set(),sample:[],numeric:0,dates:0};colMap.set(name,meta)}
   if(value===null||value===undefined||value==='')continue;
   meta.non_empty++;
   if(meta.values.size<2000)meta.values.add(String(value));
   if(meta.sample.length<20)meta.sample.push(value);
   if(hasNumber(value))meta.numeric++;
   if(/^\d{4}-\d{2}-\d{2}/.test(String(value)))meta.dates++;
 }
 let result=[];
 for(const m of colMap.values()){
   const declared=defs.get(m.name)?.kind;
   const kind=(declared==='money'||declared==='number')?'number':declared==='date'?'date':declared==='text'?'text':declared==='category'?'category':
     m.name==='date'?'date':m.name==='amount'?'number':m.non_empty&&m.dates/m.non_empty>.9?'date':m.non_empty&&m.numeric/m.non_empty>.94?'number':m.values.size<=Math.min(80,Math.max(15,m.non_empty*.45))?'category':'text';
   const isPlaceholder=(m.name==='amount'&&mapping?.hasAmount===false)||(m.name==='date'&&mapping?.hasDate===false)||
    (['store','category','status'].includes(m.name)&&mapping?.columns?.length&&!mapping.columns.some(x=>x.enabled&&x.role===m.name));
   if(!isPlaceholder)result.push({name:m.name,kind,non_empty:m.non_empty,unique:m.values.size});
 }
 return result.slice(0,100);
}
function activeRows(){
 const dr=window.InsightLabDataFilters?.getDateRange?.()||{},search=document.getElementById('dsSearch')?.value.trim()||'',stat=document.getElementById('dsStatus')?.value||'';
 const store=document.getElementById('filterStore')?.value||'',period=document.getElementById('filterPeriod')?.value||'all';
 // Chat and Canvas share the filtering engine. The chat deliberately includes cancelled
 // records unless the user selected a status, preserving previous query semantics.
 const filter={from:dr.from||'',to:dr.to||'',store,status:stat,search,period:'all',excludeCancelled:false};
 let arr=window.InsightLabQueryEngine?.filteredRows?.(filter);
 if(!arr){const needle=search.toLocaleLowerCase('pt-BR');arr=rows().filter(r=>{const date=String(r.date||'').slice(0,10);
   return (!dr.from||date>=dr.from)&&(!dr.to||date<=dr.to)&&(!stat||r.status===stat)&&(!store||r.store===store)&&(!needle||Object.values(r).some(v=>String(v).toLocaleLowerCase('pt-BR').includes(needle)));
 })}
 if(period!=='all'&&arr.some(r=>r.date)){const last=Math.max(...arr.map(r=>Date.parse(r.date)||0)),floor=last-Number(period)*86400000;arr=arr.filter(r=>Date.parse(r.date)>=floor)}
 return arr;
}
function validateQuery(query,cols){
 const names=new Map(cols.map(c=>[c.name,c]));if(!query||typeof query!=='object')return null;
 const operation=['count','sum','avg','min','max','frequency','distinct'].includes(query.operation)?query.operation:'count';
 const field=names.has(query.field)?query.field:'';
 const group_by=names.has(query.group_by)||(['day','month','hour'].includes(query.group_by)&&names.has('date'))?query.group_by:'';
 if(['sum','avg','min','max'].includes(operation)&&(!field||names.get(field).kind!=='number'))return null;
 if(operation==='distinct'&&!field)return null;
 const conditions=(Array.isArray(query.conditions)?query.conditions:[]).filter(c=>names.has(c.field)).slice(0,3).map(c=>({field:c.field,value:String(c.value||'').slice(0,120)}));
 const date_field=names.has(query.date_field)?query.date_field:(names.has('date')?'date':'');
 const from_date=/^\d{4}-\d{2}-\d{2}$/.test(query.from_date||'')?query.from_date:'';
 const to_date=/^\d{4}-\d{2}-\d{2}$/.test(query.to_date||'')?query.to_date:'';
 return {operation,field,group_by,conditions,date_field,from_date,to_date,label:String(query.label||'Análise').slice(0,100),contains:String(query.contains||'').slice(0,100)};
}
function groupKey(r,dim){if(dim==='month')return String(r.date||'').slice(0,7);if(dim==='day')return String(r.date||'').slice(0,10);if(dim==='hour')return String(r.date||'').slice(11,13)||'--';return String(r[dim]??'Não informado')}
function evaluate(query,cols,selectedRows){
 const q=validateQuery(query,cols);if(!q)return null;
 const filtered=selectedRows.filter(r=>q.conditions.every(c=>norm(r[c.field])===norm(c.value))&&(!q.from_date||!!q.date_field&&String(r[q.date_field]||'').slice(0,10)>=q.from_date)&&(!q.to_date||!!q.date_field&&String(r[q.date_field]||'').slice(0,10)<=q.to_date));
 const scores=new Map(),metricValues=[];let occurrences=0,matching=0;
 const needle=norm(q.contains);
 for(const r of filtered){
   let perRowOccurrences=0;
   if(q.operation==='frequency'){
     let found=false;
     const mapped=new Set((catalog()?.columns||[]).filter(c=>c.enabled&&c.role&&c.role!==c.name).map(c=>c.role));
     const names=q.field?[q.field]:cols.filter(c=>['text','category','number'].includes(c.kind)&&!mapped.has(c.name)).map(c=>c.name);
     for(const col of names){let val=norm(r[col]);if(!needle||!val)continue;let at=0;while((at=val.indexOf(needle,at))!==-1){occurrences++;perRowOccurrences++;found=true;at+=needle.length}}
     if(found)matching++;
   }
   const k=q.group_by?groupKey(r,q.group_by):null;
   let score=q.operation==='frequency'?perRowOccurrences:q.operation==='count'?1:q.operation==='sum'||q.operation==='avg'||q.operation==='min'||q.operation==='max'?(hasNumber(r[q.field])?numeric(r[q.field]):null):q.operation==='frequency'?null:1;
   if(score!==null&&['sum','avg','min','max'].includes(q.operation))metricValues.push(score);
   if(k!==null){let obj=scores.get(k);if(!obj){obj={sum:0,count:0,min:Infinity,max:-Infinity,distinct:new Set()};scores.set(k,obj)}
     if(score!==null){obj.sum+=score;obj.count++;obj.min=Math.min(obj.min,score);obj.max=Math.max(obj.max,score)}
     if(q.operation==='distinct')obj.distinct.add(String(r[q.field]??''));
   }
 }
 const calc=values=>{if(!values.length)return null;if(q.operation==='sum')return values.reduce((a,b)=>a+b,0);if(q.operation==='avg')return values.reduce((a,b)=>a+b,0)/values.length;if(q.operation==='min')return Math.min(...values);if(q.operation==='max')return Math.max(...values);return values.length};
 const val=q.operation==='frequency'?occurrences:q.operation==='distinct'?new Set(filtered.map(r=>String(r[q.field]??''))).size:q.operation==='count'?filtered.length:calc(metricValues);
 const groups=[...scores].map(([key,v])=>({label:key,value:q.operation==='frequency'?v.sum:q.operation==='sum'?v.sum:q.operation==='avg'?(v.count?v.sum/v.count:null):q.operation==='min'?v.min:q.operation==='max'?v.max:q.operation==='distinct'?v.distinct.size:v.count}));
 groups.sort((a,b)=>['month','day','hour'].includes(q.group_by)?a.label.localeCompare(b.label):Number(b.value||0)-Number(a.value||0));
 return {label:q.label,operation:q.operation,field:q.field,group_by:q.group_by,filters:q.conditions,records:filtered.length,non_empty_numeric:metricValues.length,value:val,matching_rows:q.operation==='frequency'?matching:undefined,groups:groups.slice(0,12),omitted_groups:Math.max(0,groups.length-12)};
}
function pick(fields,pattern,kind){return fields.find(c=>(!kind||c.kind===kind)&&pattern.test(norm(c.name)))?.name}
function localPlan(question,cols){
 const q=norm(question);const numericFields=cols.filter(c=>c.kind==='number'&&c.non_empty>0);
 const categoryFields=cols.filter(c=>c.kind==='category'&&c.unique>1&&c.unique<=100);
 const synonyms={valor:['receita','faturamento','vendas','financeiro','preco','preços','revenue','sales','amount','price'],cobrado:['faturamento','receita','preco','revenue','price','charged'],duracao:['duração','tempo','minutos','atendimento','duration','time','minutes'],tempo:['duracao','duração','minutos','duration','time'],salario:['salário','pagamento','salary','pay'],despesa:['gastos','custos','expense','spending','cost'],cliente:['clientes','pessoas','customer','clients'],servico:['serviço','serviços','service'],barbeiro:['profissional','funcionario','barber','staff'],amount:['amount','revenue','sales','income','price'],service:['service','services'],duration:['duration','time','minutes'],cost:['cost','spending','expenses'],category:['category','categories'],store:['store','location','branch']};
 function relevance(col){let score=0;const name=norm(col.name),parts=name.split(/[^a-z0-9]+/).filter(x=>x.length>2);if(q.includes(name.replace(/_/g,' ')))score+=8;
   for(const part of parts){if(q.includes(part))score+=4;for(const alt of synonyms[part]||[])if(q.includes(norm(alt)))score+=2;}
   return score;
 }
 const target=cols.filter(c=>relevance(c)>0).sort((a,b)=>relevance(b)-relevance(a));
 const metric=target.find(c=>c.kind==='number')?.name||pick(numericFields,/(saldo|receita|fatur|valor|preco|custo|despesa|lucro|salario|durac|tempo)/)||numericFields[0]?.name||'';
 const grouping=target.find(c=>c.kind==='category')?.name||pick(categoryFields,/(tipo|categoria|servic|produto|setor|departamento|barbeiro|unidade|centro|status)/)||categoryFields[0]?.name||'';
 const explicitCount=/(quantos|quantas|quantidade|numero de|número de|contagem|total de registros|how many|number of|row count|count of|number of records)/.test(q)&&!/(valor|receita|fatur|custo|gasto|media|média|durac|tempo|salario|salário|revenue|sales|cost|average|duration|price|salary)/.test(q);
 const isDash=/(crie|criar|monte|montar|gere|gerar|construa|dashboard|painel|grafico|visualiz|create|build|generate|make a|chart|graph|visualiz)/.test(q);
 const isImprove=/(melhor|otimiz|refin|ajust|reorganiz|improve|optimiz|refin|adjust|reorganiz|enhance)/.test(q)&&/(canvas|dashboard|painel)/.test(q);
 const nlabel=label=>english()?({'Soma de ':'Sum of ','Média de ':'Average of ','Total de registros':'Total records','Registros por ':'Records by ','Quantidade':'Count','Evolução mensal':'Monthly trend','Registros para conferência':'Records for review','Proposta revisada':'Revised proposal','Análise de ':'Analysis of ','Visualizações a partir dos campos do Data Studio':'Visualizations from Data Studio columns'}[label]||label):label;
 const queries=[];
 if(metric&&!explicitCount){queries.push({operation:'sum',field:metric,label:(english()?'Sum of ':'Soma de ')+metric,group_by:'',conditions:[]});if(grouping)queries.push({operation:'sum',field:metric,group_by:grouping,label:metric+' por '+grouping,conditions:[]});}
 queries.push({operation:'count',field:'',label:english()?'Total records':'Total de registros',group_by:'',conditions:[]});
 if(!metric&&grouping)queries.push({operation:'count',group_by:grouping,label:(english()?'Records by ':'Registros por ')+grouping,field:'',conditions:[]});
 const widgets=[{type:'kpi',title:english()?'Total records':'Total de registros',metric:'count',field:'',width:4,dimension:grouping||'month'}];
 if(metric&&!explicitCount){widgets.push({type:'kpi',title:(english()?'Sum of ':'Soma de ')+metric,metric:'sum',field:metric,width:4,dimension:grouping||'month'});widgets.push({type:'kpi',title:(english()?'Average of ':'Média de ')+metric,metric:'avg',field:metric,width:4,dimension:grouping||'month'});}
 if(grouping)widgets.push({type:'bar',title:(metric?(english()?'Sum of ':'Soma de ')+metric:(english()?'Count':'Quantidade'))+(english()?' by ':' por ')+grouping,metric:metric&&!explicitCount?'sum':'count',field:metric&&!explicitCount?metric:'',dimension:grouping,width:6});
 if(cols.some(c=>c.name==='date'&&c.kind==='date'))widgets.push({type:'line',title:english()?'Monthly trend':'Evolução mensal',metric:metric&&!explicitCount?'sum':'count',field:metric&&!explicitCount?metric:'',dimension:'month',width:6});
 widgets.push({type:'table',title:english()?'Records for review':'Registros para conferência',metric:'count',field:'',dimension:grouping,width:12});
 return {intent:isImprove?'improve':isDash?'dashboard':'analyze',focus:question,queries,widgets,dashboard_title:isImprove?(english()?'Revised proposal':'Proposta revisada'):(english()?'Analysis of ':'Análise de ')+(metric||grouping||(english()?'records':'registros')),dashboard_description:english()?'Visualizations from Data Studio columns':'Visualizações a partir dos campos do Data Studio',caveat:(!metric&&q.includes('financeir'))?'Não foram identificadas métricas financeiras numéricas; não é possível calcular receita, despesas ou saldo.':'',_origin:'local'};
}
function displayValue(v,field,operation){if(v===null)return english()?'unavailable (no valid numbers)':'indisponível (sem números válidos)';const c=catalog();const m=c?.columns?.find(x=>x.name===field);return operation!=='count'&&operation!=='distinct'&&operation!=='frequency'&&(m?.kind==='money'||m?.role==='amount'||(field==='amount'&&c?.hasAmount!==false))?money(v):number(v)}
function localNarrative(findings,plan,scanned){
 const count=number(scanned),period=!!(document.getElementById('dsFrom')?.value||document.getElementById('dsTo')?.value);
 if(english()){
  const out=[`I analyzed **${count} records** from the current dataset${period?' with the selected date filters':''}.`];
  for(const f of findings){out.push(`**${f.label}:** ${displayValue(f.value,f.field,f.operation)}${f.operation==='frequency'?' occurrences across '+f.matching_rows+' rows':''}.`);
   if(f.groups.length)out.push('Breakdown by '+f.group_by+':\n'+f.groups.slice(0,5).map(g=>`- ${g.label}: ${displayValue(g.value,f.field,f.operation)}`).join('\n'));}
  if(plan.caveat)out.push('**Note:** '+plan.caveat);
  out.push('Calculations use the actual columns in Data Studio. Check what each metric represents before drawing financial or operational conclusions.');
  return out.join('\n\n');
 }
 const out=[`Analisei **${count} registros** da base atual${period?' com os filtros de período ativos':''}.`];
 for(const f of findings){out.push(`**${f.label}:** ${displayValue(f.value,f.field,f.operation)}${f.operation==='frequency'?' ocorrências em '+f.matching_rows+' registros':''}.`);
  if(f.groups.length)out.push('Destaques por '+f.group_by+':\n'+f.groups.slice(0,5).map(g=>`- ${g.label}: ${displayValue(g.value,f.field,f.operation)}`).join('\n'));}
 if(plan.caveat)out.push('**Atenção:** '+plan.caveat);
 out.push('Os cálculos foram realizados nas colunas reais do Data Studio. Revise o significado das métricas antes de tirar conclusões financeiras ou operacionais.');
 return out.join('\n\n');
}
let lastAnalysis=null;
async function handle(question,history=[]){
 const all=rows(),cols=columns();if(!all.length)return {text:english()?'Data Studio is empty. Import a CSV to explore the records and build a dashboard.':'O Data Studio está vazio. Importe seu CSV para eu consultar os registros e sugerir um dashboard.',mode:english()?'No data':'Sem dados',proposal:null};
 if(!cols.length)return {text:english()?'No valid columns were found. Review the CSV import in Data Studio.':'Não encontrei colunas válidas nesse CSV. Revise a importação no Data Studio.',mode:english()?'No columns':'Sem colunas',proposal:null};
 let plan=null,configured=false,origin='local',reason='';
 const ai=window.InsightLabAI;
 if(ai){try{const res=await fetch(ai.api()+'/api/health',{signal:AbortSignal.timeout(3500)});configured=res.ok&&(await res.json()).mode==='configured'}catch(e){reason=english()?'Backend unavailable.':'O backend não está acessível.'}}
 if(configured&&ai){try{ai.syncAdmin();plan=await ai.call('/api/ai/assistant/plan','POST',{
   question,row_count:all.length,columns:cols,history:history.slice(-4).map(t=>({role:t.role,content:String(t.content||'').slice(0,550)})),dashboard:window.InsightLabBuilder?.getCurrentDashboard?.()||{}
 });origin='ai'}catch(e){reason=(english()?'Could not generate an AI plan (':'Não consegui obter o plano do modelo (')+e.message+(english()?'); using local analysis.':'); usei análise local.')}}
 if(!plan)plan=localPlan(question,cols);
 if(origin==='local'&&lastAnalysis&&lastAnalysis.revision===(window.InsightLabDatasetRevision||0)&&/(?:com base nisso|esses indicadores|essa analise|essa análise|o que voce mostrou|o que você mostrou)/i.test(question)&&/(?:dashboard|painel|grafico|gráfico|canvas|monte|crie)/i.test(question)){
   plan={...plan,queries:lastAnalysis.queries,widgets:lastAnalysis.widgets,dashboard_title:'Dashboard da análise anterior'};
 }
 const selected=activeRows(),findings=(Array.isArray(plan.queries)?plan.queries:[]).slice(0,6).map(q=>evaluate(q,cols,selected)).filter(Boolean);
 if(!findings.length){const fallback=localPlan(question,cols);plan={...fallback,intent:plan.intent||fallback.intent,caveat:(english()?'The proposal did not include valid query fields. ':'O plano proposto não tinha campos consultáveis. ')+String(plan.caveat||'')};findings.push(...fallback.queries.map(q=>evaluate(q,cols,selected)).filter(Boolean))}
 let text=localNarrative(findings,plan,selected.length),mode=english()?'Local queries · no AI tokens':'Consultas locais · sem tokens';
 const sensitive=/(?:cpf|cnpj|nome.?completo|e.?mail|telefone|celular|rg|endereco|endereço|cartao|cartão|conta.?bancar|senha)/i;
 const sensitiveColumns=findings.some(f=>sensitive.test(f.field)||sensitive.test(f.group_by)||f.filters.some(x=>sensitive.test(x.field)));
 if(configured&&origin==='ai'&&findings.length&&!sensitiveColumns){try{const res=await ai.call('/api/ai/assistant/explain','POST',{question,findings,caveat:plan.caveat||''});
   if(res.answer){text=res.answer+(english()?'\n\n*Source: '+number(selected.length)+' Data Studio records, calculated locally.*':'\n\n*Fonte: '+number(selected.length)+' registros do Data Studio, calculados localmente.*');mode=english()?'Connected AI · verified results':'IA conectada · resultados verificados';}
  }catch(e){reason=english()?'AI interpretation failed; showing local calculations.':'A interpretação pelo modelo falhou; exibindo os cálculos locais.'}}
 if(sensitiveColumns&&configured)reason=english()?'Possible personal identifiers were kept in the browser and not sent to the AI.':'Resultados com possíveis identificadores pessoais foram mantidos no navegador; não enviados à IA para interpretação.';
 if(reason)text+='\n\n*'+(english()?'Note: ':'Nota: ')+reason+'*';
 const valid=new Set(cols.map(c=>c.name)),nums=new Set(cols.filter(c=>c.kind==='number').map(c=>c.name));
 const proposed=(Array.isArray(plan.widgets)?plan.widgets:[]).filter(w=>['kpi','bar','line','donut','table','text'].includes(w.type)&&(!w.field||valid.has(w.field))&&(!w.dimension||valid.has(w.dimension)||['day','month','hour'].includes(w.dimension))&&(w.metric==='count'||nums.has(w.field))).slice(0,10);
 const fallbackWidgets=localPlan(question,cols).widgets;
 const widgets=proposed.length?proposed:fallbackWidgets;
 const proposal=widgets.length?{name:plan.dashboard_title||(english()?'Analysis dashboard':'Dashboard de análise'),description:plan.dashboard_description||(english()?'Created by the assistant from the current data.':'Criado pelo assistente a partir dos dados atuais.'),widgets}:null;
 lastAnalysis={queries:plan.queries,widgets,revision:window.InsightLabDatasetRevision||0};
 return {text,mode,proposal,intent:plan.intent,proposalDescription:`${proposal?.name||'Dashboard'} · ${widgets.length} ${english()?'widgets':'componentes'}\n${widgets.map(w=>'• '+w.title+' ('+w.type+')').join('\n')}`,revision:window.InsightLabDatasetRevision||0,schemaColumns:cols.map(c=>c.name),source:origin,findings};
}
window.InsightLabDataEngine={columns,activeRows,validateQuery,evaluate,localPlan,localNarrative};
window.InsightLabAssistantCore={handle};
})();
