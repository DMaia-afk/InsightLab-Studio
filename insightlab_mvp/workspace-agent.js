/* InsightLab v8 — Adaptive Workspace Agent: preview, apply, undo */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let proposal=null, lastApply=null;
const section=document.createElement('section');section.id='workspaceAgent';section.className='workspace-agent';
section.innerHTML=`<div class="agent-header"><span class="eyebrow">AGENTIC ANALYTICS · PROPOSE → REVIEW → APPLY</span><h2>Seu workspace, criado a partir dos seus dados.</h2><p>Importe um CSV, descreva o que deseja investigar e revise a proposta antes de alterar o Canvas. Nenhuma ação é aplicada automaticamente.</p></div>
<div class="agent-command"><label for="workspaceIntent">O que você quer construir?</label><textarea id="workspaceIntent" rows="3" placeholder="Ex.: crie uma visão de vendas com KPIs, evolução mensal, comparativo por unidade e uma agenda de acompanhamento">Quero investigar desempenho comercial, identificar tendências e criar uma visão executiva editável.</textarea><div class="agent-actions"><button class="btn primary" id="workspacePlan">✦ Planejar meu workspace</button><button class="btn" id="workspaceUndo" disabled>↶ Desfazer última aplicação</button><span id="workspaceStatus" role="status" aria-live="polite">Aguardando solicitação</span></div></div>
<div id="workspacePreview" class="agent-preview" hidden></div>`;
const anchor=$('aiPlanner');
if(anchor)anchor.parentNode.insertBefore(section,anchor);
else $('builder')?.appendChild(section);
const preview=$('workspacePreview'), status=$('workspaceStatus');
function say(msg,err=false){status.textContent=msg;status.style.color=err?'#ffb7bd':'#9fd8c5'}
function draw(){if(!proposal){preview.hidden=true;return}preview.hidden=false;
preview.innerHTML=`<div class="agent-preview-head"><div><span class="eyebrow">PROPOSTA PARA REVISÃO</span><h3>${safe(proposal.name)}</h3><p>${safe(proposal.description)}</p></div><span class="pill">${proposal.widgets.length} componentes</span></div><p>${safe(proposal.explanation)}</p>
<div class="agent-info-grid"><div><strong>Boas-vindas</strong><p>${safe(proposal.welcome)}</p></div><div><strong>Tela inicial sugerida</strong><p>${safe(proposal.start_page)}</p></div><div><strong>Páginas sugeridas</strong><p>${proposal.sections.map(safe).join(' · ')}</p></div></div>
<h4>Visualizações propostas</h4><div class="agent-widgets">${proposal.widgets.map(w=>`<div><span>${safe(w.type)}</span><strong>${safe(w.title)}</strong><small>${safe(w.metric)} · ${safe(w.dimension)} · ${safe(w.width)}/12</small></div>`).join('')}</div>
<div class="agent-lists"><div><h4>Próximos passos</h4><ul>${proposal.next_steps.map(x=>`<li>${safe(x)}</li>`).join('')}</ul></div><div><h4>Limitações a considerar</h4><ul>${proposal.limitations.map(x=>`<li>${safe(x)}</li>`).join('')}</ul></div></div>
<div class="agent-actions"><button class="btn primary" id="workspaceApply">✓ Aplicar proposta</button><button class="btn" id="workspaceDiscard">Descartar</button></div>`;
$('workspaceApply').onclick=apply;$('workspaceDiscard').onclick=()=>{proposal=null;draw();say('Proposta descartada. Nenhum dashboard foi alterado.')};}
async function plan(){const button=$('workspacePlan');button.disabled=true;try{
const ai=window.InsightLabAI;if(!ai)throw Error('Abra o Canvas e configure a conexão de IA primeiro.');
ai.syncAdmin();const instruction=$('workspaceIntent').value.trim();if(instruction.length<5)throw Error('Descreva o objetivo em mais detalhes.');
const profile=ai.profile();if(!profile.row_count)throw Error('Importe um CSV com linhas válidas antes de planejar.');
say('Analisando perfil de '+profile.row_count+' registros…');
proposal=await ai.call('/api/ai/workspace/plan','POST',{instruction,title:'Workspace inteligente',profile});draw();say('Proposta recebida. Revise os componentes e as limitações antes de aplicar.');
}catch(e){say(e.message,true)}finally{button.disabled=false}}
function apply(){if(!proposal)return;const builder=window.InsightLabBuilder,ux=window.InsightLabUX;
if(!builder?.addGeneratedDashboard) return say('Editor de dashboards indisponível.',true);
try{const oldPrefs=ux?.getPreferences?.()||null;const previous=lastApply;
const dashboard=builder.addGeneratedDashboard(proposal);if(ux?.setWorkspacePreferences)ux.setWorkspacePreferences({subtitle:proposal.welcome,start:proposal.start_page});
lastApply={dashboardId:dashboard.id,oldPrefs};$('workspaceUndo').disabled=false;proposal=null;draw();say('Workspace aplicado. Dashboard criado e mensagem inicial atualizada. Você pode desfazer.');
}catch(e){say(e.message,true)}}
function undo(){if(!lastApply)return;const builder=window.InsightLabBuilder,ux=window.InsightLabUX;
if(!builder?.removeDashboardById?.(lastApply.dashboardId))return say('Não foi possível desfazer automaticamente. Verifique se o dashboard ainda existe.',true);
if(lastApply.oldPrefs)ux?.setWorkspacePreferences?.(lastApply.oldPrefs);lastApply=null;$('workspaceUndo').disabled=true;say('Última aplicação desfeita. Os demais dashboards foram preservados.');}
$('workspacePlan').onclick=plan;$('workspaceUndo').onclick=undo;
})();
