"""Optional Chromium smoke test. Runs in restricted browsers by inlining static assets
and injecting a memory localStorage shim; never calls live AI providers.
Run: python tests/ui_smoke_stage1.py
"""
import asyncio
import re
from pathlib import Path
from playwright.async_api import async_playwright
ROOT=Path(__file__).resolve().parents[1]/'insightlab_mvp'
SAMPLE=Path(__file__).resolve().parents[1]/'examples'/'barbearia.csv'

def html_inline():
    html=(ROOT/'index.html').read_text(encoding='utf-8')
    def inject_js(m):
        path=ROOT/m.group(1).split('?')[0]
        if not path.is_file():
            raise FileNotFoundError(f'Required frontend JavaScript is missing: {path}')
        return '<script>\n'+path.read_text(encoding='utf-8')+'\n</script>'
    def inject_css(m):
        path=ROOT/m.group(1).split('?')[0]
        return '<style>\n'+path.read_text(encoding='utf-8')+'\n</style>' if path.exists() else m.group(0)
    html=re.sub(r'<script\s+src="([^"]+)"\s*></script>',inject_js,html)
    html=re.sub(r'<link\s+[^>]*href="([^"]+\.css(?:\?[^"]+)?)"[^>]*>',inject_css,html)
    shim="""<script>const __mockStore=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem(k){return __mockStore.get(k)??null},setItem(k,v){__mockStore.set(k,String(v))},removeItem(k){__mockStore.delete(k)},clear(){__mockStore.clear()}}});Object.defineProperty(window,'sessionStorage',{configurable:true,value:window.localStorage});</script>"""
    return html.replace('<head>','<head>'+shim,1)

async def main():
    assert SAMPLE.exists(), f'Missing synthetic fixture: {SAMPLE}'
    async with async_playwright() as p:
        browser=await p.chromium.launch(headless=True, executable_path='/usr/bin/chromium' if Path('/usr/bin/chromium').exists() else None, args=['--no-sandbox','--disable-dev-shm-usage'])
        page=await browser.new_page(viewport={'width':1440,'height':900})
        errors=[]; dialogs=[]
        page.on('pageerror',lambda exc:errors.append(str(exc)))
        async def handle_dialog(d):
            dialogs.append(d.message)
            await d.accept()
        page.on('dialog',handle_dialog)
        await page.set_content(html_inline(),wait_until='domcontentloaded')
        await page.locator('#loginOverlay').wait_for(state='visible', timeout=10000)
        await page.locator('#loginDemo').click()
        await page.locator('#loginOverlay').wait_for(state='hidden', timeout=10000)
        assert (await page.locator('#welcomeName').inner_text()).strip()=='User'
        print('OK: mock login')
        await page.set_input_files('#file',str(SAMPLE))
        await page.locator('#siApply').wait_for(state='visible')
        await page.click('#siApply')
        await page.wait_for_timeout(700)
        imported=await page.evaluate('({rows:data.length,meta:InsightLabIntegrity.getDataset(),catalog:InsightLabSmartImport.catalog()})')
        assert imported['rows']>1000,imported
        assert imported['catalog']['hasAmount'],imported['catalog']
        assert imported['meta']['source']=='csv'
        print('OK: Smart Import, datasetId and source provenance')
        await page.evaluate("window.InsightLabBuilder.selectDashboard(window.InsightLabBuilder.getActiveId())")
        banner=await page.locator('#ilDataBindingBanner').inner_text()
        assert 'fonte' in banner or 'Vincular' in banner,banner
        await page.locator('#ilDataBindingBanner button').click()
        assert (await page.evaluate('InsightLabBuilder.getDataBinding().ready')) is True
        print('OK: explicit rebind for pre-existing dashboard')
        # Create a new dataset-specific AI-style dashboard and automatic story.
        out=await page.evaluate('''() => {
          const plan={name:'Barbearia de teste',widgets:[{type:'kpi',title:'Duração média',metric:'avg',field:'duracao_minutos',dimension:'barbeiro',width:4},{type:'bar',title:'Por barbeiro',metric:'avg',field:'duracao_minutos',dimension:'barbeiro',width:6}]};
          const d=InsightLabBuilder.addGeneratedDashboard(plan);
          return {id:d.id,binding:InsightLabBuilder.getDataBinding(),d:InsightLabBuilder.getCurrentDashboard()};
        }''')
        assert out['binding']['ready']
        assert out['d']['widgets'][0]['field']=='duracao_minutos'
        assert out['d']['widgets'][1]['dimension']=='barbeiro'
        assert len(out['d']['slides'])>=1
        print('OK: generated dashboard, custom fields and automatic story')
        # Set a global status/date/search then create a pinned slide.
        await page.evaluate("showPage('data')")
        await page.locator('#dsSearch').fill('Corte')
        await page.locator('#dsStatus').select_option('COMPLETED')
        await page.locator('#dsFrom').fill('2026-01-01')
        await page.evaluate('InsightLabPresentStudio.pinWidget(InsightLabBuilder.getCurrentDashboard().widgets[0].id)')
        await page.locator('#ilStoryBinding').select_option('snapshot')
        snap=await page.evaluate('''() => {const d=InsightLabBuilder.getCurrentDashboard();const ref=d.slides.at(-1).widgetRefs[0];return {filters:ref.filters,meta:InsightLabIntegrity.getDataset(),ref}}''')
        assert snap['filters']['status']=='COMPLETED',snap
        assert snap['filters']['search']=='Corte',snap
        assert snap['filters']['from']=='2026-01-01',snap
        assert snap['ref']['datasetId']==snap['meta']['id'],snap
        print('OK: captured filters, snapshot source and revision')
        # Changing global filters must not change the pinned slice.
        await page.evaluate("() => {const e=document.getElementById('dsSearch');e.value='Não existe';e.dispatchEvent(new Event('input',{bubbles:true}))}")
        keep=await page.evaluate('InsightLabBuilder.getCurrentDashboard().slides.at(-1).widgetRefs[0].filters.search')
        assert keep=='Corte'
        print('OK: fixed filters independent of global filters')
        # Changing a CSV record must advance revision.
        before=await page.evaluate('InsightLabIntegrity.getDataset().revision')
        await page.evaluate('''() => { data[0].duracao_minutos='99';persist() }''')
        after=await page.evaluate('InsightLabIntegrity.getDataset().revision')
        assert after==before+1,(before,after)
        print('OK: row edits invalidate dataset revision')
        # Import export round-trip, reject malformed input before making changes.
        from_browser=await page.evaluate('''() => JSON.stringify({schemaVersion:2,version:2,dashboards:[InsightLabBuilder.getCurrentDashboard()]})''')
        validated=await page.evaluate('''text => {const x=InsightLabIntegrity.readImport(text);return x.dashboards[0].widgets.map(w=>[w.field,w.dimension])}''',from_browser)
        assert ['duracao_minutos','barbeiro'] in validated
        await page.set_input_files('#importDashboardFile',files={'name':'barbearia.json','mimeType':'application/json','buffer':from_browser.encode()})
        await page.wait_for_timeout(250)
        assert any('métricas e dimensões preservadas' in msg for msg in dialogs),dialogs
        imported_project=await page.evaluate('InsightLabBuilder.getCurrentDashboard()')
        assert imported_project['datasetBinding']=='needs-review',imported_project
        assert imported_project['widgets'][0]['field']=='duracao_minutos'
        count=await page.evaluate('JSON.parse(localStorage.getItem("insightlab_dashboards_v2")).length')
        await page.set_input_files('#importDashboardFile',files={'name':'bad.json','mimeType':'application/json','buffer':b'{broken'})
        await page.wait_for_timeout(200)
        count_after=await page.evaluate('JSON.parse(localStorage.getItem("insightlab_dashboards_v2")).length')
        assert count_after==count
        print('OK: v2 import field preservation and atomic malformed-JSON rejection')
        # Restore the original dashboard then import another business: it must NOT show stale metrics.
        await page.evaluate('InsightLabPresentation.close()')
        await page.evaluate("showPage('data')")
        old_id=await page.evaluate('InsightLabIntegrity.getDataset().id')
        await page.set_input_files('#file',str(ROOT.parent/'examples'/'pizzaria.csv'))
        await page.locator('#siApply').wait_for(state='visible')
        await page.click('#siApply')
        await page.wait_for_timeout(300)
        assert await page.evaluate('InsightLabIntegrity.getDataset().id')!=old_id
        binding=await page.evaluate('InsightLabBuilder.getDataBinding()')
        assert not binding['ready'],binding
        assert await page.evaluate('InsightLabBuilder.getWidgetAnalysis(InsightLabBuilder.getCurrentDashboard().widgets[0].id)') is None
        await page.evaluate("showPage('builder')")
        msg=await page.locator('#ilDataBindingBanner').inner_text()
        assert 'fonte' in msg or 'Vincular' in msg,msg
        await page.locator('#ilDataBindingBanner button').click()
        invalid=await page.evaluate('InsightLabBuilder.getDataBinding()')
        assert not invalid['ready'],invalid
        print('OK: cross-dataset mismatch blocks KPI and refuses incompatible rebind')
        # Reset must create a fresh empty dataset, not restore the synthetic demo.
        await page.evaluate("showPage('data')")
        await page.evaluate("document.getElementById('reset').click()")
        cleared=await page.evaluate('({rows:data.length,source:InsightLabIntegrity.getDataset().source})')
        assert cleared['rows']==0 and cleared['source']=='empty',cleared
        print('OK: reset clears rows and identifies a new empty dataset')
        # Logout must work whether session controls are inside Preferences or
        # directly available in the header (different frontend revisions).
        preferences = page.locator('#ilPreferences')
        if await preferences.count() and await preferences.is_visible():
            summary = preferences.locator('summary')
            await summary.click(timeout=10000)
        else:
            print('INFO: Preferences menu unavailable; checking direct logout')

        logout = page.locator('#logoutBtn')
        try:
            await logout.wait_for(state='visible', timeout=10000)
            await logout.click(timeout=10000)
        except Exception as exc:
            raise AssertionError(
                'Logout button is not accessible. Check whether '
                'product-ui-v10.js loaded and inspect the browser errors: '
                f'{errors}'
            ) from exc

        await page.locator('#loginOverlay').wait_for(state='visible', timeout=10000)
        assert await page.locator('body').evaluate(
            "(el) => el.classList.contains('login-locked')"
        ), 'Logout did not restore login-locked state'
        print('OK: logout returns to the login screen')
        assert not errors,errors
        print('PASS: browser console has no uncaught JavaScript errors')
        await browser.close()

if __name__=='__main__':
    asyncio.run(main())
