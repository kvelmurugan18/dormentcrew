const assert = require('node:assert/strict');
const {join} = require('node:path');
const {pathToFileURL} = require('node:url');
const {chromium} = require(process.argv[2] || 'playwright');
const url = process.env.ECHOES_URL || pathToFileURL(join(__dirname,'../prototype.html')).href;

(async () => {
  const browser = await chromium.launch({executablePath:process.argv[3],headless:true});
  try {
    for (const [mode, viewport] of [['3d',{width:1440,height:900}],['text',{width:390,height:844}]]) {
      const page = await browser.newPage({viewport,reducedMotion:mode==='text'?'reduce':'no-preference'});
      const failures=[], external=[];
      page.on('pageerror', error=>failures.push(error.message));
      page.on('request', req=>{if (/^https?:/.test(req.url())&&!req.url().startsWith(url)) external.push(req.url());});
      const click = action=>page.locator('[data-action="'+action+'"]').click();
      const heading = text=>page.getByRole('heading',{name:text,exact:true}).waitFor();
      const choose = (id,value)=>page.locator('#'+id).selectOption(value);
      const follow = name=>page.getByRole('link',{name}).click();
      const notice = pattern=>page.locator('#feedback').filter({hasText:pattern}).waitFor();
      const fit = async()=>assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
      await page.goto(url);
      await heading('ECHOES'); await fit();
      if (process.env.ECHOES_SCREENSHOTS) await page.screenshot({path:join(process.env.ECHOES_SCREENSHOTS,mode+'-home.png')});
      if (mode==='text') {
        await follow('Settings'); await choose('mode-setting','text'); await click('motion'); await follow('ECHOES');
      }
      await click('quiz-pre');
      for (const [i,choice] of [0,1,2,1,0].entries()) await page.locator('input[name="q'+i+'"][value="'+choice+'"]').check();
      await page.getByRole('button',{name:'Save score'}).click();
      await click('start'); await heading('The missing beat');
      await click('packet-0'); await notice(/origin node/);
      await click('packet-1'); await click('launch-0');
      await heading('Walk the silent site'); await fit();
      if (mode==='3d') {
        const canvas=page.locator('#moon-scene');
        await canvas.focus();
        for(let i=0;i<9;i++) await page.keyboard.press('a');
        for(let i=0;i<9;i++) await page.keyboard.press('w');
        await page.keyboard.press('e'); await heading('Surveyor 3'); await canvas.focus();
        for(let i=0;i<10;i++) await page.keyboard.press('w');
        assert.match(await page.locator('#moon-status').innerText(),/Protected site/);
        await click('mode-map'); assert.equal(await page.locator('svg.map').count(),1);
        await click('mode-3d');
      } else {
        assert.equal(await page.locator('#moon-scene').count(),0);
        await click('site-surveyor');
      }
      await click('echo-replay'); await click('echo-diagram');
      if(process.env.ECHOES_SCREENSHOTS) await page.screenshot({path:join(process.env.ECHOES_SCREENSHOTS,mode+'-moon.png')});
      await click('artifact-0'); await click('site-apollo'); await click('artifact-1');
      await click('site-alsep'); await click('artifact-2'); await follow('Open relay workbench');
      await click('detour-0'); await notice(/protected ground/);
      await click('detour-1'); await click('optics'); await notice(/0°/);
      await click('clean'); await click('left'); await click('left'); await click('optics');
      assert.equal(await page.getByRole('link',{name:'Receive Mars log'}).count(),0);
      await choose('classification','retired'); await choose('sender','ALSEP');
      await click('fix-archive'); await notice(/AURORA-L02/);
      await choose('sender','AURORA-L02'); await click('fix-archive'); await follow('Receive Mars log');
      await fit();
      await click('landmark-0'); await click('opp-1');
      await choose('goal','restore'); await choose('module','MOTE');
      await click('route-direct'); await click('mars-send'); await notice(/impassable/);
      await click('route-shelf');
      if(process.env.ECHOES_SCREENSHOTS) await page.screenshot({path:join(process.env.ECHOES_SCREENSHOTS,mode+'-mars.png')});
      await click('mars-send'); await notice(/Dust changed/);
      await click('mars-send'); await notice(/battery cap/);
      await click('route-rim'); await click('mars-send'); await notice(/Downlink received/);
      await follow('Open evidence board'); await fit();
      await page.getByRole('button',{name:'Validate evidence'}).click(); await notice(/Match each clue/);
      for(const [i,value] of ['scoop','archive','closure'].entries()) await choose('link'+i,value);
      await page.locator('[value=both]').check();
      await page.getByRole('button',{name:'Validate evidence'}).click();
      await heading('The archive never died'); await page.reload(); await heading('The archive never died');
      await click('quiz-post');
      for (const [i,choice] of [0,1,2,1,0].entries()) await page.locator('input[name="q'+i+'"][value="'+choice+'"]').check();
      await page.getByRole('button',{name:'Save score'}).click();
      assert.match(await page.locator('main').innerText(),/Post-mission 5\/5/);
      assert.deepEqual(failures,[]);assert.deepEqual(external,[]);
      console.log(mode+' playthrough passed at '+viewport.width+'×'+viewport.height);
      await page.close();
    }
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});


