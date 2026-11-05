"""Stage 2 regression: shared query cache, incremental Canvas render and event-driven projects.
Requires optional Playwright and Chromium; no real model, network or credentials.
"""
import asyncio
from pathlib import Path
from playwright.async_api import async_playwright
from ui_smoke_stage1 import html_inline
BASE=Path(__file__).resolve().parents[1]
async def main():
    async with async_playwright() as p:
        browser=await p.chromium.launch(headless=True, executable_path='/usr/bin/chromium' if Path('/usr/bin/chromium').exists() else None, args=['--no-sandbox','--disable-dev-shm-usage'])
        page=await browser.new_page(viewport={'width':1440,'height':900})
        errors=[]
        page.on('pageerror',lambda error:errors.append(str(error)))
        page.on('dialog',lambda dialog:asyncio.create_task(dialog.accept()))
        await page.set_content(html_inline(),wait_until='domcontentloaded')
        await page.click('#loginDemo')
        await page.set_input_files('#file',str(BASE/'examples'/'barbearia.csv'))
        await page.locator('#siApply').wait_for(state='visible')
        await page.click('#siApply')
        await page.wait_for_timeout(150)
        before=await page.evaluate('''() => {
          const plan={name:'Bench dashboard',widgets:[
            {type:'kpi',title:'Ticket',field:'valor_cobrado',metric:'sum',dimension:'barbeiro',width:4},
            {type:'bar',title:'Receita por profissional',field:'valor_cobrado',metric:'sum',dimension:'barbeiro',width:6},
            {type:'line',title:'Mesma agregação',field:'valor_cobrado',metric:'sum',dimension:'barbeiro',width:6}]};
          const d=InsightLabBuilder.addGeneratedDashboard(plan);
          const stats=InsightLabBuilder.getQueryStats();
          document.querySelector('#widgetGrid [data-widget]').dataset.keep='preserve-dom';
          return {id:d.id,stats,widgets:d.widgets.length,slides:d.slides.length};
        }''')
        assert before['widgets']==3 and before['slides']>=1,before
        assert before['stats']['aggregations']>=1,before
        # Change selected widget only: existing nodes and query computations must remain.
        await page.locator('#widgetGrid [data-edit]').nth(1).click()
        after=await page.evaluate('''() => ({keep:document.querySelector('#widgetGrid [data-widget]').dataset.keep,stats:InsightLabBuilder.getQueryStats(),selected:document.querySelectorAll('#widgetGrid .is-selected').length})''')
        assert after['keep']=='preserve-dom',after
        assert after['stats']['aggregations']==before['stats']['aggregations'],(before,after)
        assert after['selected']==1
        print('PASS: selection keeps widget DOM and reuses query results')
        # RenderWidget and Story analysis must reuse same aggregate, not loop through CSV twice.
        shared=await page.evaluate('''() => {
          const widgets=InsightLabBuilder.getCurrentDashboard().widgets;
          const old=InsightLabBuilder.getQueryStats();
          const html=InsightLabBuilder.renderWidget(widgets[1].id);
          const analysis=InsightLabBuilder.getWidgetAnalysis(widgets[1].id);
          const next=InsightLabBuilder.getQueryStats();
          return {html:html.length,records:analysis.records,old,next};
        }''')
        assert shared['records']>1000 and shared['html']>10
        assert shared['next']['aggregations']==shared['old']['aggregations'],shared
        print('PASS: canvas & story share aggregates')
        # Rename should immediately update 'Recent Projects' without a polling timer.
        await page.evaluate("""() => {const field=document.getElementById('builderName');field.value='Renamed Stage Two';field.dispatchEvent(new Event('change',{bubbles:true}))}""")
        name=await page.locator('#ilSavedProjects').inner_text()
        assert 'Renamed Stage Two' in name,name
        print('PASS: projects updated via events')
        # Dataset revision invalidates aggregate results; updates keep dashboard source linked.
        last=await page.evaluate('''() => {
          const w=InsightLabBuilder.getCurrentDashboard().widgets[0];
          const before=InsightLabBuilder.getWidgetAnalysis(w.id).total;
          data[0].valor_cobrado='9999';persist();
          const after=InsightLabBuilder.getWidgetAnalysis(w.id).total;
          return {before,after,stats:InsightLabBuilder.getQueryStats()};
        }''')
        assert last['before']!=last['after'],last
        print('PASS: data revision invalidates cache and updates metric')
        # Navigate generated story, with no extra instance trees mounted.
        await page.evaluate('InsightLabPresentStudio.open()')
        assert await page.locator('#ilPresentEditor').is_visible()
        count=await page.locator('#ilStoryStage .il-story-widget').count()
        assert count>=1
        await page.click('#ilStoryPlay')
        assert await page.locator('#ilStoryViewer').is_visible()
        await page.click('#ilStoryExit')
        await page.click('#ilStoryClose')
        assert not errors,errors
        print('PASS: Dashboard Story, Canvas and browser console without uncaught errors')
        await browser.close()
if __name__=='__main__':
    asyncio.run(main())
