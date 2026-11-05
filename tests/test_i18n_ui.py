from playwright.sync_api import sync_playwright
from pathlib import Path
import re, json
root=Path(__file__).resolve().parents[1]/'insightlab_mvp'
html=(root/'index.html').read_text(encoding='utf8')
html=re.sub(r'<script\s+src="([^"]+)"[^>]*></script>',lambda m:'<script>'+ (root/m.group(1).split('?')[0]).read_text(encoding='utf8').replace('</script>', '<\\/script>')+'</script>',html)
html=re.sub(r'<link\s+rel="stylesheet"\s+href="([^"]+)"\s*/>',lambda m:'<style>'+ (root/m.group(1).split('?')[0]).read_text(encoding='utf8')+'</style>',html)
with sync_playwright() as p:
 import shutil
 b=p.chromium.launch(executable_path=shutil.which('chromium') or shutil.which('chromium-browser'),headless=True,args=['--no-sandbox'])
 page=b.new_page(viewport={'width':1400,'height':900})
 page.evaluate("(()=>{const x=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>x.has(k)?x.get(k):null,setItem:(k,v)=>x.set(k,String(v)),removeItem:k=>x.delete(k),clear:()=>x.clear()}})})()")
 errs=[];page.on('pageerror',lambda e:errs.append(str(e)))
 page.set_content(html,wait_until='load');page.wait_for_timeout(350)
 assert page.locator('.il-language-switch').count()==3
 page.locator('.il-language-switch.login select').select_option('en');page.wait_for_timeout(60)
 assert page.get_attribute('html','lang')=='en'
 assert page.title()=='InsightLab Studio — Dashboard, Data & AI'
 assert page.locator('#loginSubmit').inner_text()=='Enter workspace'
 page.locator('#loginDemo').click();page.wait_for_timeout(150)
 assert page.locator('.il-locale-sidebar').count()==0
 assert page.locator('.il-language-switch.header select').input_value()=='en'
 page.locator('.il-language-switch.header select').select_option('pt-BR');page.wait_for_timeout(60)
 assert page.get_attribute('html','lang')=='pt-BR'
 page.locator('.il-language-switch.header select').select_option('en');page.wait_for_timeout(60)
 assert page.get_attribute('html','lang')=='en'
 assert page.locator('.il-language-switch.header select').input_value()=='en'

 assert page.locator('.il-language-switch.header select').input_value()=='en'
 page.locator('.nav[data-page=data]').click();page.wait_for_timeout(100)
 assert page.locator('#dsClear').inner_text()=='Clear filters'
 assert page.locator('#dsSearch').get_attribute('placeholder')=='Search across all columns'
 assert page.locator('#dsTbody [data-delete]').first.inner_text()=='Delete'
 # Actual barbershop CSV
 csv=Path(__file__).resolve().parents[1]/'examples/barbearia.csv'
 page.locator('input#file').set_input_files(str(csv));page.wait_for_timeout(250)
 assert page.locator('.smart-import-layer').is_visible(), 'smart import modal failed'
 print('SMART IMPORT HEADER',page.locator('.smart-import-dialog h2').inner_text())
 print('SMART IMPORT TABLE HEAD',page.locator('.smart-import-table thead').inner_text())
 print('SMART IMPORT BUTTON',page.locator('#siApply').inner_text())
 assert page.evaluate("getComputedStyle(document.querySelector('.smart-import-layer')).position")=='fixed'
 page.locator('#siApply').click();page.wait_for_timeout(350)
 print('FILE INFO',page.locator('#filemsg').inner_text())
 assert not page.locator('.smart-import-layer').is_visible()
 assert page.locator('#dsTbody [data-delete]').first.inner_text()=='Delete'
 assert page.evaluate('data.length') > 1000
 # Chat local English analytical answer and proposal
 page.evaluate('window.InsightLabChat.open()')
 page.locator('#ilChatQuestion').fill('How many records are there in this dataset?')
 page.locator('#ilChatSend').click();page.wait_for_timeout(1300)
 chat=page.locator('#ilChatMessages').inner_text()
 print('CHAT ANSWER',chat[:850].replace('\n',' '))
 print('CHAT MODE',page.locator('#ilChatMode').inner_text())
 assert 'I analyzed' in chat or 'I searched' in chat, 'local answer not in English'
 # Dashboard create via English intent
 page.locator('#ilChatQuestion').fill('Create a dashboard showing revenue by barber and monthly trends.')
 page.locator('#ilChatSend').click();page.wait_for_timeout(1300)
 print('CHAT PROPOSALS',page.locator('.il-chat-action').count())
 assert page.locator('.il-chat-action').count()>0
 page.locator('.il-chat-action button').first.click();page.wait_for_timeout(300)
 print('DASHBOARD',page.evaluate('window.InsightLabBuilder?.getCurrentDashboard?.()?.name'))
 # Settings and calendar
 page.evaluate('window.InsightLabSettings?.open?.()');page.wait_for_timeout(150)
 print('SETTINGS',page.locator('.il-settings-dialog h2').inner_text())
 assert 'settings' in page.locator('.il-settings-dialog h2').inner_text().lower()
 # PT switch and persisted locale
 page.locator('.il-language-switch.header select').select_option('pt-BR');page.wait_for_timeout(200)
 assert page.get_attribute('html','lang')=='pt-BR'
 assert page.locator('#dsClear').inner_text()=='Limpar filtros'
 # Stored user value must remain unmodified
 assert page.evaluate('data.length')>1000
 print('LANGUAGE SAVED',page.evaluate("localStorage.getItem('insightlab_locale_v111')"))
 print('SCRIPT ERRORS',errs)
 assert not errs, 'browser errors'
 b.close()
