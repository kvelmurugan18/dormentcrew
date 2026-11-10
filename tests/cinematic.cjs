const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const assert=require('node:assert/strict');
const {resolve,join}=require('node:path');
const {pathToFileURL}=require('node:url');
const fs=require('node:fs');
const link=pathToFileURL(resolve('index.html')).href;
const output=process.env.ECHOES_PREVIEWS;
async function shot(page,name){
  if(output){
    fs.mkdirSync(output,{recursive:true});
    await page.screenshot({path:join(output,name+'.png'),animations:'disabled'});
  }
}
(async()=>{
  const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,args:['--enable-unsafe-swiftshader']});
  try{
    const page=await browser.newPage({viewport:{width:1280,height:720}});
    const errors=[],network=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('request',r=>{if(r.url().startsWith('http'))network.push(r.url());});
    await page.goto(link);
    await page.waitForFunction(()=>Boolean(renderer&&orbit));
    await shot(page,'01-title');
    await page.getByRole('button',{name:'CC',exact:true}).click();
    await page.getByRole('button',{name:'Begin mission'}).click();
    await page.waitForFunction(()=>filmPlaying&&film.currentTime>.6,{},{timeout:12000});
    assert.match(await page.locator('#speech').innerText(),/lost two heritage relays/);
    await shot(page,'02-opening');
    const skip=()=>page.getByRole('button',{name:'Skip sequence'}).click();
    await skip();
    await page.waitForFunction(()=>mode==='field'&&field.kind==='moon');
    await shot(page,'03-moon');
    await page.keyboard.press('Escape');
    await page.getByRole('dialog').waitFor();
    await page.getByRole('button',{name:'Resume'}).click();
    async function axis(axis,target){
      const at=await page.evaluate(axis=>player[axis],axis);
      if(Math.abs(at-target)<.6)return;
      const k=axis==='x'?(at>target?'KeyA':'KeyD'):(at>target?'KeyW':'KeyS');
      await page.keyboard.down(k);
      try{
        await page.waitForFunction(({axis,at,target})=>at>target?player[axis]<target+.42:player[axis]>target-.42,{axis,at,target});
      }finally{await page.keyboard.up(k);}
    }
    async function walk(x,z){await axis('x',x);await axis('z',z);}
    async function inspect(label){
      await page.locator('#target').getByText(label,{exact:true}).waitFor();
      await page.locator('#interact').waitFor();
      await page.keyboard.press('KeyF');
      await page.waitForFunction(()=>sequence?.[0]?.shot==='inspect');
    }
    await walk(-10,-8);await inspect('Surveyor 3');
    await page.waitForTimeout(1000);
    await shot(page,'04-time-echo');await skip();
    await walk(6,-23);await inspect('Apollo 12');await skip();
    await walk(-7,-38);await inspect('Seismic station');await skip();
    await walk(8,-54);await inspect('Modern receiver');await skip();
    await page.waitForFunction(()=>sequence?.[shotIndex]?.shot==='callAria');
    await shot(page,'05-aria-call');
    await page.waitForFunction(()=>sequence?.[shotIndex]?.shot==='callEcho',{},{timeout:35000});
    await page.waitForFunction(()=>voice.currentTime>.2&&!voice.paused);
    await shot(page,'06-echo-reply');
    await skip();
    await page.waitForFunction(()=>mode==='field'&&field.kind==='mars'&&!field.actor.visible);
    await page.locator('#visor').waitFor();
    await shot(page,'07-mars-pov');
    await walk(-10,-9);await inspect('Ridge lookout');await skip();
    await walk(-9,-33);await inspect('Opportunity');await skip();
    await axis('x',-8);await axis('z',-46);await walk(2,-51);await walk(10,-53);
    await inspect('Modern marker');await skip();
    await page.waitForFunction(()=>sequence?.[shotIndex]?.shot==='voyager',{},{timeout:35000});
    await shot(page,'08-voyager');
    await page.waitForFunction(()=>sequence?.[shotIndex]?.shot==='record',{},{timeout:35000});
    await shot(page,'09-golden-record');
    await page.waitForFunction(()=>sequence?.[shotIndex]?.shot==='stars'&&orbit.sky.visible,{},{timeout:30000});
    await page.getByRole('link',{name:/ESO\/S. Brunier/}).waitFor();
    await shot(page,'09b-interstellar');
    await page.waitForFunction(()=>sequence?.[shotIndex]?.shot==='reunion',{},{timeout:45000});
    await shot(page,'10-reunion');
    await page.getByRole('heading',{name:'Mission complete.'}).waitFor({timeout:25000});
    await page.getByRole('button',{name:'Replay mission'}).click();
    await page.getByRole('button',{name:'Begin mission'}).waitFor();
    assert.deepEqual(errors,[]);
    assert.deepEqual(network,[]);
    console.log('Desktop: voiced video, four lunar stops, two-way camera cut, three Mars stops and safe detour, Voyager sequence, reunion, replay. Passed.');
    const mobile=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true,deviceScaleFactor:1});
    await mobile.goto(link);
    await mobile.getByRole('button',{name:'Begin mission'}).click();
    await mobile.getByRole('button',{name:'Skip sequence'}).click();
    await mobile.waitForFunction(()=>mode==='field');
    const forward=mobile.getByRole('button',{name:'Move forward'});
    await forward.waitFor();
    const {x,y,width,height}=await forward.boundingBox();
    const cdp=await mobile.context().newCDPSession(mobile);
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:x+width/2,y:y+height/2}]});
    await mobile.waitForFunction(()=>player.z<7);
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    assert.equal(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    await shot(mobile,'11-touch');
    console.log('Phone viewport: touch navigation and full-screen layout. Passed.');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});

