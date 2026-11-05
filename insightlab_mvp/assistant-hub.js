/* InsightLab v9.7 — assistant settings hub */
(()=>{'use strict';
const nav=document.querySelector('.menu');
const settings=document.createElement('button');settings.className='nav';settings.type='button';settings.innerHTML='<span class="navicon"><img class="il-icon" src="assets/icons-minimal/settings.svg" alt="" aria-hidden="true"></span><span class="navtext"><strong>Configurações</strong><span>Modelo e integrações</span></span>';
nav?.append(settings);
const overlay=document.createElement('div');overlay.className='il-settings-overlay';overlay.hidden=true;overlay.innerHTML='<div class="il-settings-backdrop"></div><section class="il-settings-dialog" role="dialog" aria-modal="true" aria-label="Configurações de IA"><header><h2>Configurações do InsightLab</h2><button class="btn" id="ilSettingsClose">Fechar ×</button></header><p>Configure o modelo de linguagem e as credenciais. A conexão fica no servidor local; não use este ambiente demonstrativo em produção sem autenticação adequada.</p><div id="ilSettingsMount"></div><div class="il-external"><h3>Integrações externas (futuro)</h3><p>E-mail, calendário externo e sistemas de clientes exigem provedores conectados, permissões e aprovação explícita antes de qualquer envio. Nenhuma integração externa está ativa nesta versão.</p></div></section>';
document.body.append(overlay);
const panel=document.getElementById('aiSettings');if(panel)document.getElementById('ilSettingsMount').append(panel);
const open=()=>{overlay.hidden=false;document.getElementById('ilSettingsClose').focus()};
const close=()=>{overlay.hidden=true;settings.focus()};
settings.onclick=open;document.getElementById('ilSettingsClose').onclick=close;overlay.querySelector('.il-settings-backdrop').onclick=close;
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!overlay.hidden)close()});
window.InsightLabSettings={open,close};
})();