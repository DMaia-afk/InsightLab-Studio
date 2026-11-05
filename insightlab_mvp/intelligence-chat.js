/* InsightLab v9.7 — Assistant hub, approval-gated actions */
(()=>{'use strict';
const icon='assets/icons-minimal/comment.svg';
const english=()=>window.InsightLabI18n?.getLocale?.()==='en';
const ui=(pt,en)=>english()?en:pt;
const launch=document.createElement('button');launch.className='il-chat-launch';launch.type='button';launch.setAttribute('aria-label','Abrir Assistente IA');launch.setAttribute('aria-expanded','false');launch.innerHTML='<img src="'+icon+'" alt="">';
const panel=document.createElement('section');panel.className='il-chat-window';panel.id='ilChatPanel';panel.hidden=true;panel.setAttribute('role','dialog');panel.setAttribute('aria-label','Assistente IA do InsightLab');
panel.innerHTML=`<header class="il-chat-head"><div><strong>Assistente IA</strong><small>Consulte dados, crie dashboards e organize tarefas</small></div><button id="ilChatClose" aria-label="Fechar conversa">×</button></header><div class="il-chat-messages" id="ilChatMessages" role="log" aria-live="polite"></div><footer class="il-chat-foot"><div class="il-chat-mode" id="ilChatMode">Dados processados no navegador; a IA recebe metadados e resultados agregados quando conectada.</div><form class="il-chat-compose" id="ilChatForm"><textarea id="ilChatQuestion" rows="2" maxlength="1600" placeholder="Pergunte, crie dashboards ou agende uma tarefa..." aria-label="Mensagem para o assistente" required></textarea><button id="ilChatSend" type="submit">Enviar</button></form><div class="il-chat-controls"><button type="button" id="ilChatConnect">Configurações de IA</button><button type="button" id="ilChatClear">Limpar conversa</button></div></footer>`;
document.body.append(launch,panel);
const $=id=>document.getElementById(id),history=[];let busy=false, pending=null;
function renderMarkdown(text){
 const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 return String(text||'').split(/\n\s*\n/).map(par=>{
   const lines=par.split('\n');let list=false;
   const out=lines.map(line=>{
     const item=/^\s*[-*]\s+/.test(line);if(item)list=true;
     let a=escape(line.replace(/^\s*[-*]\s+/,''));
     a=a.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/`([^`]+)`/g,'<code>$1</code>').replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g,'<em>$1</em>');
     return item?'<li>'+a+'</li>':a;
   });return list?'<ul>'+out.join('')+'</ul>':'<p>'+out.join('<br>')+'</p>';
 }).join('');
}
function updateBubble(el,text){el.innerHTML=renderMarkdown(text)}
function add(role,text,error=false){const el=document.createElement('div');el.className='il-chat-bubble '+role+(error?' error':'');updateBubble(el,text);$('ilChatMessages').append(el);$('ilChatMessages').scrollTop=$('ilChatMessages').scrollHeight;return el}

function localAnswer(question){
 let rows=[];try{rows=Array.isArray(data)?data:[]}catch{}
 try{const dateFilter=window.InsightLabDataFilters?.inRange;if(dateFilter)rows=rows.filter(dateFilter)}catch{}
 const valid=rows.filter(r=>r.status!=='CANCELLED');const rev=valid.reduce((s,r)=>s+(Number(r.amount)||0),0);const amount=rows.length;const fm=n=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(n);const q=question.toLocaleLowerCase('pt-BR');
 if(/dashboard|gráfico|workspace|crie|monte/.test(q))return 'Posso ajudar a interpretar sua base. Para criar ou modificar um dashboard editável, abra Canvas → Agente Workspace, descreva o objetivo e revise a proposta antes de aplicar.';
 if(/total|receita|faturamento|valor vendido/.test(q))return `Nos registros válidos do período selecionado, a soma de amount é ${fm(rev)}, em ${valid.length} registros. Apenas a coluna normalizada de valor é utilizada.`;
 if(/ticket|média|media/.test(q))return `A média de amount por registro válido é ${fm(valid.length?rev/valid.length:0)} (${valid.length} registros). Isso só representa ticket médio quando cada registro equivale a uma venda.`;
 if(/quant|quantos|linhas|registros|pedido/.test(q))return `O conjunto considerado possui ${amount} registros, dos quais ${valid.length} não estão marcados como CANCELLED.`;
 if(/categoria|líder|lider|unidade|loja/.test(q)){const key=/unidade|loja/.test(q)?'store':'category';const sums={};valid.forEach(r=>{const k=r[key]||'Não informado';sums[k]=(sums[k]||0)+(Number(r.amount)||0)});const leaders=Object.entries(sums).sort((a,b)=>b[1]-a[1]).slice(0,3);return leaders.length?'Maiores somas por '+(key==='store'?'unidade':'categoria')+':\n'+leaders.map(([k,v])=>`${k}: ${fm(v)}`).join('\n'):'Não há categorias suficientes para calcular esse ranking.'}
 return 'No modo local respondo sobre receitas, ticket médio, quantidade de registros e rankings por categoria/unidade. Para perguntas abertas, conecte Gemini ou outro provedor no Canvas (token administrativo necessário). Os dados enviados ao modelo são apenas o perfil estatístico.';
}

function textFrequency(question){
 const q=question.trim();
 const m=q.match(/(?:quantas?\s+vezes|frequ[eê]ncia|ocorr[eê]ncias?|cont[eê]m|aparece|apareceu|encontrar|buscar|procurar|pesquisar)[^?\n]{0,110}?(?:palavra|termo|express[aã]o|texto)?\s*[“"'`]?([\p{L}\p{N}_-]{2,60})[”"'`]?\s*(?:aparece|ocorre|existe|nos\s+dados|no\s+csv|\?|$)/iu);
 let term=m?.[1];
 if(!term&&english()){const em=q.match(/(?:how many times (?:does|did|is)?\s*(?:the )?(?:word|term)?\s*|(?:frequency|occurrences|count) of (?:the )?(?:word|term)?\s*|(?:find|search for) (?:the )?(?:word|term)?\s*)["'“”`]?([\p{L}\p{N}_-]{2,60})/iu);if(em)term=em[1]}
 if(!term){const n=q.match(/(?:palavra|termo|express[aã]o)\s+[“"'`]?([\p{L}\p{N}_-]{2,60})[”"'`]?/iu);if(n&&/(quant|frequ|aparec|ocorr|buscar|procurar|cont[eê]m)/i.test(q))term=n[1]}
 if(!term)return null;
 let records=[];try{records=Array.isArray(data)?data:[]}catch{}
 try{const inRange=window.InsightLabDataFilters?.inRange;if(inRange)records=records.filter(inRange)}catch{}
 if(!records.length)return ui('Não há registros ativos para consultar. Importe um CSV no Data Studio.','There are no active records. Import a CSV in Data Studio.');
 const mapping=window.InsightLabSmartImport?.getMapping?.()||null;
 const cols=[...new Set(records.flatMap(r=>Object.keys(r||{})))].filter(c=>!['amount','date','store','category','status'].includes(c)||!records.some(r=>Object.keys(r).some(k=>k!==c&&String(r[k]??'')===String(r[c]??''))));
 const needle=term.toLocaleLowerCase('pt-BR');let occurrences=0,matchingRows=0;const counts={};
 for(const r of records){let rowFound=false;for(const col of cols){const val=r[col];if(typeof val!=='string'&&typeof val!=='number')continue;const value=String(val).toLocaleLowerCase('pt-BR');let at=0,count=0;while((at=value.indexOf(needle,at))>=0){count++;at+=needle.length}if(count){rowFound=true;occurrences+=count;counts[col]=(counts[col]||0)+count}}if(rowFound)matchingRows++}
 const breakdown=Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,12).map(([col,n])=>`- **${col}:** ${n}`).join('\n');
 if(english())return `I searched **“${term}”** in **${records.length} records**, across **${cols.length} columns** of the current CSV (case insensitive).\n\n- **Text occurrences:** ${occurrences}\n- **Rows containing the text:** ${matchingRows}\n\n${breakdown?'**By column:**\n'+breakdown+'\n\n':''}Occurrences are counted as substrings within each cell, so repeated matches in the same cell are counted separately.`;
 return `Pesquisei **“${term}”** em **${records.length} registros**, percorrendo **${cols.length} colunas** do CSV atual (sem diferenciar maiúsculas/minúsculas).\n\n- **Ocorrências do texto:** ${occurrences}\n- **Linhas que contêm o texto:** ${matchingRows}\n\n${breakdown?'**Por coluna:**\n'+breakdown+'\n\n':''}A contagem considera o texto como trecho de uma célula; se houver duas ocorrências na mesma célula, ambas contam. Para comparar palavras completas, podemos habilitar essa opção no futuro.`;
}
function dateISO(s){const m=s.match(/\b(20\d{2})-(\d{2})-(\d{2})\b/);if(m)return m[0];const br=s.match(/\b(\d{2})\/(\d{2})\/(20\d{2})\b/);return br?`${br[3]}-${br[2]}-${br[1]}`:null}
function route(q){
 if(/(agenda|agendar|compromisso|reunião|reuniao|lembrete|evento|schedule|calendar|appointment|meeting|remind|event)/i.test(q))return 'event';
 if(/(melhor|otimiz|ajust|altere|mude|troque|modifi|refin|reorganize|improve|optimiz|adjust|change|refin|reorganiz|enhance)/i.test(q)&&/(canvas|dashboard|gráfico|grafico|visualiz|chart)/i.test(q))return 'improve';
 if(/(crie|criar|monte|montar|gere|gerar|constru|novo dashboard|nova visão|novo painel|workspace|create|build|generate|make|new dashboard)/i.test(q)&&/(dashboard|painel|gráfico|grafico|canvas|workspace|visão|visao|chart|graph|report)/i.test(q))return 'dashboard';
 return 'question';
}
function actionCard(kind,description,accept){const holder=document.createElement('div');holder.className='il-chat-action';const title=document.createElement('b');title.textContent=kind;const detail=document.createElement('p');detail.textContent=description;const yes=document.createElement('button');yes.textContent=ui('Confirmar e aplicar','Confirm and apply');yes.className='btn primary';const no=document.createElement('button');no.textContent=ui('Cancelar','Cancel');no.className='btn';holder.append(title,detail,yes,no);$('ilChatMessages').append(holder);$('ilChatMessages').scrollTop=$('ilChatMessages').scrollHeight;yes.onclick=async()=>{yes.disabled=true;no.disabled=true;try{await accept();title.textContent=ui('Ação concluída','Action completed');}catch(e){add('assistant','Não foi possível concluir: '+e.message,true);yes.disabled=false;no.disabled=false}};no.onclick=()=>{holder.remove();add('assistant',ui('Ação cancelada; nada foi alterado.','Action cancelled; nothing changed.'))};return holder}
function open(){panel.hidden=false;launch.setAttribute('aria-expanded','true');$('ilChatQuestion').focus()}
function close(){panel.hidden=true;launch.setAttribute('aria-expanded','false');launch.focus()}
launch.onclick=()=>panel.hidden?open():close();$('ilChatClose').onclick=close;
$('ilChatConnect').onclick=()=>{close();window.InsightLabSettings?.open?.()};
$('ilChatClear').onclick=()=>{history.splice(0);$('ilChatMessages').replaceChildren();add('assistant',ui('Conversa reiniciada. Posso consultar dados, criar dashboards, sugerir melhorias e registrar compromissos após sua confirmação.','Conversation cleared. I can explore data, build dashboards, suggest improvements and schedule events with your approval.'))};
function doEvent(q){
 const when=dateISO(q);const caption=when?'Data identificada: '+when:'Será necessário escolher uma data';
 actionCard('Novo compromisso',caption+' • Você poderá editar o título e a data antes de salvar.',async()=>{
  const value=await window.InsightLabUX?.eventDialog?.();if(!value){add('assistant','Cadastro cancelado; agenda não modificada.');return}
  if(!Array.isArray(events))throw Error('Agenda indisponível');events.push(value);localStorage.setItem(KEY+'_events',JSON.stringify(events));try{renderCalendar()}catch{}add('assistant',`Compromisso registrado: **${value.title}**, em **${value.date}**.`);
 });
}
async function doDashboard(q,improve=false){const ai=window.InsightLabAI;if(!ai)throw Error('Central de IA indisponível.');
 const profile=ai.profile();if(!profile.row_count)throw Error('Importe um CSV antes de pedir um dashboard.');
 if(improve)add('assistant','Vou propor um **novo dashboard revisado** com base no seu pedido. O dashboard atual não será sobrescrito.');
 if(!window.InsightLabBuilder?.addGeneratedDashboard)throw Error('Canvas não está pronto.');
 const result=await ai.call('/api/ai/workspace/plan','POST',{instruction:q,title:improve?'Proposta de melhoria do Canvas':'Novo workspace',profile});
 if(!Array.isArray(result.widgets)||!result.widgets.length)throw Error('O agente não retornou componentes válidos.');
 const description=[result.description,`Componentes: ${result.widgets.map(w=>w.title).join(', ')}`,(result.limitations||[]).length?'Limitações: '+result.limitations.join(' | '):''].filter(Boolean).join('\n');
 actionCard(improve?'Proposta de melhoria':'Novo dashboard',description,async()=>{
   window.InsightLabBuilder.addGeneratedDashboard(result);close();add('assistant','Dashboard criado no Canvas. Você pode reorganizar os componentes e editar as propriedades.');
 });
}
async function answer(q){const textResult=textFrequency(q);
 if(textResult!==null){$('ilChatMode').textContent='Busca textual local • sem tokens de IA';return textResult;}
 if(route(q)==='event'){doEvent(q);return 'Preparei o registro na agenda. Confirme a ação para abrir o formulário.'}
 if(window.InsightLabAssistantCore){const outcome=await window.InsightLabAssistantCore.handle(q,history);$('ilChatMode').textContent=outcome.mode;return outcome;}
if(textResult!==null){$('ilChatMode').textContent='Busca real no CSV • sem tokens de IA';return textResult;}const kind=route(q);if(kind==='event'){doEvent(q);return 'Preparei o registro na agenda. Confira a ação e confirme para abrir o formulário.'}
 if(kind==='dashboard'||kind==='improve'){
  const ai=window.InsightLabAI;
  if(!ai)return 'A conexão com o agente ainda não está disponível.';
  try{await doDashboard(q,kind==='improve');return 'Recebi a proposta do agente. Revise o resumo e confirme antes de criar.'}catch(e){return 'Não consegui obter uma proposta: '+e.message+'\nConfigure o modelo e o token em Configurações.'}
 }
 let mode='local',ai=window.InsightLabAI;
 try{if(ai){const r=await fetch(ai.api()+'/api/health',{signal:AbortSignal.timeout(4000)});if(r.ok&&(await r.json()).mode==='configured')mode='ai'}}catch{}
 if(mode==='ai'){try{ai.syncAdmin();const out=await ai.call('/api/ai/chat','POST',{question:q,profile:ai.profile(),history:history.slice(-8)});$('ilChatMode').textContent='Modelo de IA conectado • perfil estatístico';return out.answer}catch(e){return 'Falha ao consultar modelo: '+e.message+'\n\nResposta local: '+localAnswer(q)}}
 $('ilChatMode').textContent='Modo local • análise descritiva';return localAnswer(q)
}
const welcome=add('assistant',ui('Olá, User! Sou o Assistente IA. Posso **consultar os dados**, **propor dashboards**, **sugerir melhorias no Canvas** e **registrar compromissos na agenda**. As alterações exigem sua confirmação.','Hello, User! I am your AI assistant. I can **explore data**, **propose dashboards**, **suggest Canvas improvements** and **schedule events** with your approval.'));
welcome.dataset.ilWelcome='true';
window.addEventListener('insightlab:locale-changed',()=>{if(welcome.isConnected&&$('ilChatMessages').querySelectorAll('.il-chat-bubble').length===1)updateBubble(welcome,ui('Olá, User! Sou o Assistente IA. Posso **consultar os dados**, **propor dashboards**, **sugerir melhorias no Canvas** e **registrar compromissos na agenda**. As alterações exigem sua confirmação.','Hello, User! I am your AI assistant. I can **explore data**, **propose dashboards**, **suggest Canvas improvements** and **schedule events** with your approval.'))});
$('ilChatForm').onsubmit=async e=>{e.preventDefault();if(busy)return;const q=$('ilChatQuestion').value.trim();if(!q)return;$('ilChatQuestion').value='';add('user',q);busy=true;$('ilChatSend').disabled=true;const bubble=add('assistant',ui('Analisando sua solicitação...','Analyzing your request...'));try{const result=await answer(q);const response=typeof result==='string'?result:String(result.text||ui('Sem resultados.','No results.'));updateBubble(bubble,response);
  if(result&&typeof result==='object'&&result.proposal){
    const count=result.proposal.widgets.length;
    actionCard(result.intent==='dashboard'?ui('Criar dashboard no Canvas','Create dashboard in Canvas'):result.intent==='improve'?ui('Criar versão aprimorada do Canvas','Create improved Canvas version'):ui('Montar dashboard com esta análise','Build a dashboard from this analysis'),
      result.proposalDescription+ui('\nA criação será confirmada antes de salvar; o projeto atual será preservado.','\nReview and confirm before saving; the current project will be preserved.'),async()=>{
        if(result.revision!==(window.InsightLabDatasetRevision||0))throw Error(ui('Os dados mudaram desde a análise. Envie novamente a pergunta para atualizar a proposta.','The data changed since the analysis. Ask again to refresh the proposal.'));
        const schema=new Set(window.InsightLabDataEngine?.columns?.().map(c=>c.name)||[]);
        const required=result.proposal.widgets.flatMap(w=>[w.field,w.dimension]).filter(v=>v&&!['month','day','hour'].includes(v));
        if(required.some(v=>!schema.has(v)))throw Error(ui('As colunas do dataset foram alteradas. Atualize a proposta.','Dataset columns changed. Refresh the proposal.'));
        const created=window.InsightLabBuilder?.addGeneratedDashboard?.(result.proposal);
        if(!created)throw Error(ui('Canvas indisponível.','Canvas is unavailable.'));
        close();add('assistant',english()?'Dashboard **'+created.name+'** created on Canvas with **'+count+' widgets** linked to the current data. Open Dashboard Story from the dashboard.':'Dashboard **'+created.name+'** criado no Canvas com **'+count+' componentes** vinculados aos dados atuais. O roteiro de apresentação pode ser aberto pelo próprio dashboard.');
      });
  }
  history.push({role:'user',content:q},{role:'assistant',content:response});if(history.length>12)history.splice(0,history.length-12)}catch(e){bubble.textContent=ui('Erro: ','Error: ')+e.message;bubble.classList.add('error')}finally{busy=false;$('ilChatSend').disabled=false;$('ilChatQuestion').focus()}};
window.InsightLabChat={open,close,clear:()=>$('ilChatClear').click(),ask:(q)=>{open();$('ilChatQuestion').value=String(q||'').slice(0,1600);$('ilChatQuestion').focus();$('ilChatForm').requestSubmit()}};
})();
