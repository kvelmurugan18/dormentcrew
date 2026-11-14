const assert = require('node:assert/strict');
const {chromium} = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const {join} = require('node:path');

const base = process.env.ECHOES_URL || 'http://127.0.0.1:8766/';
const screenshots = process.env.ECHOES_PREVIEWS;
const screenshot = (page,name) => screenshots ? page.screenshot({path:join(screenshots,name+'.png'),animations:'disabled'}) : Promise.resolve();
async function run() {
  const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,args:['--enable-unsafe-swiftshader']});
  try {
    const page=await browser.newPage({viewport:{width:1440,height:900}});
    const problems=[];
    page.on('pageerror',error=>problems.push(error.message));
    page.on('response',response=>{
      if(response.status()>=400 && !response.url().endsWith('favicon.ico')) problems.push(response.status()+' '+response.url());
    });
    await page.goto(base);
    await screenshot(page,'final-title');
    const begin=page.getByRole('button',{name:'Begin mission'});
    const skip=page.getByRole('button',{name:/Skip scene/});
    const navigate=page.getByRole('button',{name:'Navigate',exact:true});
    const inspect=page.getByRole('button',{name:/Inspect/});
    await begin.click();
    const playing=()=>page.waitForFunction(()=>filmPlaying && film.currentTime>.25 && !film.paused && film.videoWidth>0);
    await playing();
    await page.getByRole('button',{name:'Pause',exact:true}).click();
    assert.equal(await page.evaluate(()=>film.paused),true);
    await page.getByRole('button',{name:'Resume',exact:true}).click();
    await playing();
    await page.getByRole('button',{name:'Archive',exact:true}).click();
    assert.equal(await page.evaluate(()=>film.paused),true);
    await page.getByRole('button',{name:'Close',exact:true}).click();
    await playing();
    const captions=page.getByRole('button',{name:'CC',exact:true});
    await captions.click();
    assert.equal(await captions.getAttribute('aria-pressed'),'false');
    await captions.click();
    await screenshot(page,'final-briefing');
    await skip.click();
    await page.waitForFunction(()=>mode==='field'&&field.kind==='moon');
    if(base.startsWith('http')) {
      await page.waitForFunction(()=>field.actor.children.some(child=>child.isGroup&&child.children.some(mesh=>mesh.geometry?.attributes.position.count>1000)));
    }
    await screenshot(page,'final-moon');
    const explore=async(labels)=>{
      for(const label of labels) {
        await page.locator('#target').getByText(label,{exact:true}).waitFor();
        await navigate.click();
        await inspect.waitFor({timeout:30000});
        await inspect.click();
        await playing();
        await skip.click();
      }
    };
    const archive=async(total)=>{
      await page.locator('#archive').waitFor();
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('#archive').isVisible(),true);
      const next=page.getByRole('button',{name:'Next record'});
      for(let i=1;i<total;i++) await next.click();
      assert.match(await page.locator('#archive-count').innerText(),new RegExp(total+' / '+total+' explored'));
      await page.getByRole('button',{name:'Continue mission'}).click();
    };
    await page.keyboard.down('KeyW');
    await page.waitForFunction(()=>player.z<7);
    await page.keyboard.up('KeyW');
    await explore(['Surveyor 3','Apollo 12','Apollo 12 ALSEP']);
    await archive(3);
    await playing();
    await skip.click();
    await page.waitForFunction(()=>mode==='field'&&field.kind==='mars');
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    await page.waitForFunction(()=>field.models[1].children.some(child=>child.isGroup&&child.visible&&child.name!==''));
    await screenshot(page,'final-mars');
    await page.reload();
    await page.getByRole('button',{name:'Resume mission'}).click();
    await page.waitForFunction(()=>mode==='field'&&field.kind==='mars');
    await explore(['Perseverance Valley overlook','Opportunity','Last signal overlook']);
    await archive(7);
    await archive(5);
    await page.waitForFunction(()=>sequence[0].shot==='depart');
    await page.evaluate(()=>{film.playbackRate=3;});
    await page.waitForFunction(()=>sequence?.[shotIndex]?.voice==='news' && shotTime>1,null,{timeout:22000});
    await page.locator('#news').waitFor();
    await screenshot(page,'final-voyager-news');
    await page.waitForFunction(()=>sequence?.[shotIndex]?.voice==='imagine' && shotTime>6,null,{timeout:23000});
    await screenshot(page,'final-voyager');
    await page.getByRole('heading',{name:/Surveyor 3 was shut down/}).waitFor();
    await page.waitForFunction(()=>!interviewVideo.paused && interviewVideo.currentTime>.25);
    await screenshot(page,'final-interview');
    const indices=[0,1,2,0,1,2];
    for(let i=0;i<indices.length;i++){
      const answers=page.locator('#answers button');
      await answers.first().waitFor();
      if(i===0){
        await answers.nth(1).click();
        assert.match(await page.locator('#quiz-feedback').innerText(),/Clue/);
      }
      await answers.nth(indices[i]).click();
      if(i===0){
        await page.waitForFunction(()=>activeVoice==='answer0' && voice.currentTime>.15 && !voice.paused);
      }
      await page.getByRole('button',{name:i===5?'Finish interview →':'Next question →'}).click();
    }
    await page.getByRole('heading',{name:'Transmission complete.'}).waitFor();
    assert.equal(await page.locator('#scoreline').innerText(),'5 / 6 correct on the first answer');
    await page.getByRole('button',{name:'Replay mission'}).click();
    await begin.waitFor();
    assert.deepEqual(problems,[]);
    const mobile=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
    await mobile.goto(base);
    await screenshot(mobile,'final-mobile');
    await mobile.getByRole('button',{name:'Archive',exact:true}).click();
    const items=mobile.locator('[data-record-id]');
    assert.equal(await items.count(),19);
    await items.filter({hasText:'Ingenuity'}).click();
    await mobile.getByRole('heading',{name:'Ingenuity',exact:true}).waitFor();
    await mobile.getByRole('button',{name:'Close',exact:true}).click();
    await mobile.getByRole('button',{name:'Begin mission'}).click();
    await mobile.getByRole('button',{name:/Skip scene/}).click();
    assert.equal(await mobile.getByRole('button',{name:'Move forward'}).isVisible(),true);
    console.log('Passed complete Moon/Mars route, 19 archive entries, checkpoint, Voyager scenes, six interview questions, restart and mobile view.');
  } finally {
    await browser.close();
  }
}
run().catch(error=>{console.error(error);process.exitCode=1;});
