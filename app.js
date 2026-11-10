'use strict';

const chapters=['prologue','launch','moon','moon/repair','mars','evidence','ending'];
const story=[
 ['Earth control · 2048','The missing beat','Two modern relays have stopped reporting. The last packet carried IDs from machines that fell silent decades ago.'],
 ['Wayfarer · 2048','One launch. Two worlds.','Aria Morgan and Cass Ren travel to lunar orbit. ECHO-7 takes the longer transfer to Mars.'],
 ['Oceanus Procellarum · 2048','Walk the silent site','Investigate three protected viewpoints. Find out what each machine did before following the signal.'],
 ['AURORA-L02 · 2048','Two faults. Two fixes.','Reach the modern receiver, restore its optical path and correct the archive mapping.'],
 ['Perseverance Valley region · 2049','Give the rover a goal','ECHO-7 receives an objective near Opportunity’s historic region. The rover must adapt locally when conditions change.'],
 ['Earth control · Delayed logs','Connect the evidence','Match the mission records to their conclusions and diagnose the false alert.'],
 ['AURORA archive · 2051','The archive never died','The modern relays are reporting again. The old machines are silent, and their science is still here.']
];
const key='echoes-local-v1';
const fresh=()=>({stage:0,started:false,mode:'3d',learned:{},reduced:false,sound:false,pre:null,post:null});
let state=fresh();
try{state={...state,...JSON.parse(localStorage.getItem(key)||'{}')};}catch{}
const save=()=>{try{localStorage.setItem(key,JSON.stringify(state));}catch{}};
const main=document.querySelector('main');
const $=selector=>document.querySelector(selector);
const announce=text=>{$('#notice').textContent=text;};
const reduced=()=>state.reduced||matchMedia('(prefers-reduced-motion: reduce)').matches;
let page='',quiz='',artifact='',message='',error=false,moon,position,echoAnimation,echoMode='replay',audio;
const modeNames={'3d':'3D field view',map:'2D map',text:'Text mode'};
const btn=(id,label,extra='')=>'<button type="button" data-action="'+id+'" '+extra+'>'+label+'</button>';
const link=(path,label,primary=false)=>'<a class="button'+(primary?' primary':'')+'" href="#/'+path+'">'+label+'</a>';
const badge=label=>'<span class="label">'+label+'</span>';
const pressed=value=>'aria-pressed="'+Boolean(value)+'"';
const panel=body=>'<section class="panel">'+body+'</section>';
const grid=(a,b)=>'<div class="grid">'+panel(a)+panel(b)+'</div>';
const actions=body=>'<div class="toolbar">'+body+'</div>';
const bottom=body=>'<div class="actions nav-bottom no-print">'+body+'</div>';
const note=()=>message?'<p class="feedback'+(error?' error':'')+'" id="feedback" tabindex="-1">'+message+'</p>':'';
const say=(name,line)=>'<div class="log">'+badge('Dramatized dialogue')+'<p><strong>'+name+'</strong> — “'+line+'”</p></div>';
const answers=(prefix,choices)=>'<div class="choices">'+choices.map((choice,i)=>btn(prefix+i,choice)).join('')+'</div>';
const select=(id,label,choices,value='')=>'<label for="'+id+'">'+label+'<select id="'+id+'">'+choices.map(([v,l])=>'<option value="'+v+'"'+(String(v)===String(value)?' selected':'')+'>'+l+'</option>').join('')+'</select></label>';
function heading(kicker,title,description,label=''){
  return '<div class="heading">'+(label?badge(label):'')+'<div class="eyebrow">'+kicker+'</div><h1>'+title+'</h1><p>'+description+'</p></div>';
}
function tone(){
  if(!state.sound||!window.AudioContext)return;
  try{
    audio??=new AudioContext();
    void audio.resume().catch(()=>{});
    const osc=audio.createOscillator(), gain=audio.createGain(), t=audio.currentTime;
    osc.frequency.setValueAtTime(520,t);
    osc.frequency.exponentialRampToValueAtTime(760,t+.15);
    gain.gain.setValueAtTime(.065,t);
    gain.gain.exponentialRampToValueAtTime(.001,t+.19);
    osc.connect(gain);gain.connect(audio.destination);osc.start(t);osc.stop(t+.19);
  }catch{}
}
function refresh(text='',bad=false){
  message=text;error=bad;render();$('#feedback')?.focus();
}
function refocus(action){message='';render();$('[data-action="'+action+'"]')?.focus();}
const go=path=>{location.hash='#/'+path;};
function unlock(stage){state.stage=Math.max(state.stage,stage);save();}
function advance(stage){state.started=true;unlock(stage);tone();go(chapters[stage]);}
function record(r){
  const labels=['What was it?','Why was it sent?','How did it work?','What did it teach us?','What happened to it?'];
  return '<div class="badge-row"><span>'+r.world+'</span><span>'+r.year+'</span><span>'+r.status+'</span></div><p class="quiet">'+r.site+' · <a href="#/sources">Demo record notes</a></p><dl>'+r.fields.map((field,i)=>'<dt>'+labels[i]+'</dt><dd>'+field+'</dd>').join('')+'</dl>';
}
function home(){
  return '<section class="hero"><canvas id="hero-art" width="1200" height="700" aria-hidden="true"></canvas><div><div class="eyebrow">01 / AURORA HERITAGE NET</div><h1>ECHOES</h1><h2>The Last Transmission</h2><p>A signal names machines that have been silent for decades. Follow the evidence across the Moon and Mars to find out what really sent it.</p><p class="quiet">Interactive fiction · Original illustrations · Simulated mission data</p><div class="actions">'+btn('start',state.started?'Resume mission →':'Begin mission →','class="primary"')+link('archive','Open archive')+'</div><div class="actions">'+btn('quiz-pre','Optional pre-mission check')+'</div></div><span class="coordinate">SECTOR 03 / MOON → MARS</span></section><div class="summary-strip"><div><span class="eyebrow">01 / Moon</span><strong>Explore the site</strong></div><div><span class="eyebrow">02 / Mars</span><strong>Plan a safe route</strong></div><div><span class="eyebrow">03 / Archive</span><strong>Trace the signal</strong></div></div>';
}
function prologue(){
  return grid('<div class="eyebrow">Packet / 0418</div><pre class="packet">ORIGIN NODE  AURORA-L02\nDISPLAY ID   <span>SURVEYOR_3</span>\nMARS TWIN    AURORA-M07\nDISPLAY ID   <span>OPPORTUNITY</span>\nCHECKSUM     PARTIAL</pre>'+say('Maya Chen','The modern nodes failed. Why are their packets carrying old mission names?'),
  '<h2>Read the fields</h2><p>The origin node identifies the sender. The display ID is a name pulled from the equipment catalog.</p><h3>What is the best working theory?</h3>'+answers('packet-',['The old machines must have restarted.','A modern packet is carrying historical catalog IDs.','The packet proves a live distress call from Mars.'])+note());
}
function launch(){
  const visual=state.mode==='text'?'':`<svg class="scene launch-map" viewBox="0 0 500 230" role="img" aria-label="Illustrative split trajectory from Earth to Moon and Mars">
    <path d="M74 162Q132 40 269 58M74 162Q218 216 427 96" fill="none" stroke="#a6efdf" stroke-width="2" stroke-dasharray="4 7"/>
    <circle cx="70" cy="166" r="23" fill="#466c86"/><circle cx="270" cy="58" r="13" fill="#c9c9bd"/><circle cx="428" cy="96" r="24" fill="#ae664c"/>
    <g fill="#f0f5f7" font-size="15" text-anchor="middle"><text x="70" y="209">EARTH</text><text x="270" y="35">MOON</text><text x="428" y="142">MARS</text></g>
    <path id="lunar-stack" d="M74 162l-8 4 1-8 7 4" fill="#a6efdf"/><path id="mars-stack" d="M74 162l-8 4 1-8 7 4" fill="#ffc29b"/>
  </svg>`+actions(btn('separation','Replay stack separation'));
  return grid('<div class="eyebrow">Illustrative transfer plan</div>'+visual+'<div class="stages"><span class="lit">Wayfarer<br>Launch</span><span>Aria + Cass<br>Moon · days</span><span>ECHO-7<br>Mars · months</span></div>'+say('Cass Ren','Same launch, separate engines. We’ll be in lunar orbit long before ECHO-7 arrives.'),
  '<h2>Approve the flight caption</h2>'+answers('launch-',['One launch, two propelled stacks and different arrival dates.','One spacecraft arrives at both worlds the same day.'])+note());
}
function openArtifact(id){
  artifact=id;echoMode='replay';message='';render();$('#artifact-heading').focus();
}
function moonPage(){
  const count=sites.filter(s=>state.learned[s.id]).length;
  const modes=Object.entries(modeNames).map(([id,label])=>btn('mode-'+id,label,pressed(state.mode===id))).join('');
  const landmarks=sites.map(s=>btn('site-'+s.id,equipment[s.id].name+(state.learned[s.id]?' ✓':''),pressed(artifact===s.id))).join('');
  const view=state.mode==='3d'
    ? '<canvas id="moon-scene" class="scene" width="900" height="506" tabindex="0" aria-label="Interactive third-person lunar scene" aria-describedby="moon-help"></canvas><p id="moon-help" class="quiet">Focus the scene for WASD or arrows, E to inspect, Q to scan. Drag to turn. You can also use the viewpoint list.</p><p id="moon-status"></p>'+actions([['w','↑ Forward'],['a','← Left'],['s','↓ Back'],['d','→ Right'],['scan','Scan'],['inspect','Inspect']].map(([id,label])=>btn('walk-'+id,label)).join(''))
    : state.mode==='map'?terrainMap():'<p>Follow the marked trail from base camp. Each observation takes place from outside the protected perimeter.</p>';
  return grid('<div class="hud"><span class="eyebrow">Viewpoint access</span><span>'+count+' / 3 records</span></div>'+actions(modes)+view+actions(landmarks),
    artifact?artifactPage():'<h2>Mission log</h2>'+say('Dr Sanaa Malik','Start with what each instrument did. Its mission record can tell you more than a noisy packet.')+'<p>Select a safe viewpoint or walk to a cyan marker.</p>')+
    bottom(count===3?link('moon/repair','Open relay workbench →',true):'<span class="quiet">Collect three records to unlock the workbench.</span>');
}
function artifactPage(){
  const r=equipment[artifact];
  let visual=state.mode==='text'?'':diagram(artifact,artifact==='surveyor'&&echoMode==='replay');
  if(artifact==='surveyor'){
    visual+=actions(btn('echo-replay','Play Time-Echo',pressed(echoMode==='replay'))+btn('echo-diagram','Compare schematic',pressed(echoMode==='diagram')))+
      '<p class="quiet">'+(echoMode==='diagram'?'Original schematic comparison. The camera was among the components retrieved by the later crew.':'Original reconstruction · descent → first bounce → second bounce → rest.')+'</p>';
  }
  if(artifact==='alsep')visual+='<svg class="wave" viewBox="0 0 450 65" role="img" aria-label="Synthetic waveform illustration"><path d="M0 33H85L96 29 102 36 113 30 127 35 134 22 140 54 148 9 154 44 165 17 171 48 181 26 190 35 205 30 215 34H450" fill="none" stroke="#a6efdf" stroke-width="2"/></svg><p class="quiet">Synthetic waveform · 1969 deployment → 1977 shutdown</p>';
  return badge('Demo archive record')+'<h2 id="artifact-heading" tabindex="-1">'+r.name+'</h2>'+visual+record(r)+
    (state.learned[artifact]?'<p class="feedback">Record collected. '+r.fact+'</p>':'<h3>'+r.question+'</h3>'+answers('artifact-',r.choices))+note();
}
function playEcho(mode){
  echoMode=mode;refocus('echo-'+mode);
  const lander=$('#echo-lander');
  if(mode==='replay'&&lander&&!reduced()&&lander.animate){
    const frames=[[-110,0],[-76,.29],[0,.49],[-29,.58],[0,.68],[-13,.75],[0,.85],[0,1]];
    echoAnimation=lander.animate(frames.map(([y,offset])=>({transform:'translateY('+y+'px)',offset})),{duration:8000});
  }
  announce(mode==='replay'?'Descent, first bounce, second bounce and rest.':'Original schematic comparison.');
}

let bearing=state.optics?0:30, clean=Boolean(state.optics), classification='', sender='';
function repair(){
  if(!state.detour)return grid(state.mode==='text'?'<h2>Service route</h2><p>A marked trail follows the perimeter to the receiver.</p>':terrainMap(),'<h2>Choose the approach</h2><p>The modern receiver sits beyond the protected historical site.</p>'+answers('detour-',['Cross the old instrument field.','Follow the marked detour outside the perimeter.'])+note());
  const complete=relayReady(state.optics,state.archive);
  return grid(badge(state.optics?'Optics restored':'Fault 01 / Optics')+'<h2>Align the modern receiver</h2><p>Clean the lens and rotate the receiver to the center bearing.</p><div class="workbench" aria-label="Current bearing '+bearing+' degrees">'+[-30,-15,0,15,30].map(a=>'<span class="'+(a===bearing?'active':'')+'">'+a+'°</span>').join('')+'</div>'+
    actions(btn('clean',clean?'Lens clear ✓':'Clean lens',pressed(clean))+btn('left','Rotate left')+btn('right','Rotate right')+btn('optics','Test optics')),

    badge(state.archive?'Catalog corrected':'Fault 02 / Archive')+'<h2>Correct the status lookup</h2><p>Preserve the old science records. Assign live signals to their modern sender.</p>'+actions(
    select('classification','Historical equipment',[['','Choose status'],['active','Active navigation relay'],['retired','Retired · historical science record']],classification)+
    select('sender','Current sender',[['','Choose sender'],['ALSEP','Apollo 12 ALSEP'],['AURORA-L02','AURORA-L02']],sender))+btn('fix-archive','Apply status mapping'))+note()+
    bottom(complete?link('mars','Receive Mars log →',true):'<span class="quiet">Both independent fixes must pass.</span>');
}

const newMars=()=>({module:'',goal:'',budget:2,delay:12,route:'',storm:false,step:0});
let mars=newMars(),timer;
const marsBusy=()=>mars.step>0&&mars.step<4;
function marsPage(){
  const r=equipment.opportunity;
  const setup=actions(select('goal','Objective',[['','Choose objective'],['restore','Restore modern reference marker'],['visit','Approach the historical rover']],mars.goal)+
    select('module','Tool module',[['','Choose tool'],['MOTE','MOTE · passive optical marker'],['PIX','PIX · survey camera']],mars.module)+
    select('budget','Risk budget',[[1,'1 · low'],[2,'2 · moderate'],[3,'3 · exploratory']],mars.budget)+
    select('delay','Illustrative one-way delay',[[4,'4 minutes'],[12,'12 minutes'],[20,'20 minutes']],mars.delay));
  const candidates=Object.entries(routes).map(([id,route])=>{
    const a=assessRoute(route,mars.budget,mars.storm);
    return btn('route-'+id,route.name+'<small>'+a.energy+' battery units · risk '+a.risk+' · '+(a.blocked?'Protected crossing':a.valid?'Available':'Exceeds limits')+'<br>'+route.reason+'</small>',pressed(mars.route===id));
  }).join('');
  const stages=['Queued','Uplink','Local evaluation','Downlink'].map((s,i)=>'<span class="'+((state.mars||mars.step>i)?'lit':'')+'">'+s+'</span>').join('');
  return '<div class="mars">'+grid('<h2>Opportunity archive</h2>'+badge('Demo archive record')+(state.mode==='text'?'':diagram('opportunity'))+record(r)+
    '<p class="quiet">The original schematic shows a triangular ridge beside the rover. The position and route grid are invented.</p>'+
    (state.landmark?'<p class="feedback">Landmark matched. The ridge is a visual reference outside the protected area.</p>':'<h3>Match the illustrated landmark</h3>'+answers('landmark-',['A triangular ridge','A circular landing pad','A relay tower']))+
    (state.learned.opportunity?'<p class="feedback">'+r.fact+'</p>':'<h3>'+r.question+'</h3>'+answers('opp-',r.choices)),
    '<h2>ECHO-7 planning console</h2>'+badge('Deterministic simulation')+'<p>Battery cap 24 units. Protected cells are always impassable. PIX surveys terrain. MOTE restores the passive marker.</p>'+setup+
    (state.mode==='text'?'':marsMap(mars.route,mars.storm))+'<div class="route-list stack">'+candidates+'</div>'+
    '<p class="quiet">Lowest-energy route within limits: <strong>'+routes[recommendRoute(mars.budget,mars.storm)].name+'</strong>.</p>'+
    (mars.storm?'<p class="feedback">Dust event. The shelf now exceeds safe energy and risk limits. ECHO-7 evaluates a detour locally.</p>':'')+
    '<div id="command-stages" class="stages" aria-label="Compressed timeline">'+stages+'</div><p class="quiet">Simulated '+mars.delay+'-minute one-way delay. Display time is compressed.</p>'+
    (state.mars?'<p class="feedback">Delayed report received. MOTE restored the modern marker via the rim detour.</p>':marsBusy()?btn('mars-skip','Show simulated report now'):btn('mars-send',mars.storm?'Simulate local replan':'Queue delayed objective','class="primary"')))+note()+
    bottom(state.mars&&state.learned.opportunity&&state.landmark?link('evidence','Open evidence board →',true):'<span class="quiet">Match the landmark, collect the rover lesson and finish the simulated plan.</span>')+'</div>';
}
function maybeEvidence(){
  if(state.mars&&state.landmark&&state.learned.opportunity)unlock(5);
  else save();
}
function sendMars(){
  if(mars.goal!=='restore'||mars.module!=='MOTE')return refresh('Select the modern marker objective and MOTE. PIX can survey, but it cannot deploy the marker.',true);
  if(!mars.route)return refresh('Compare the three routes and choose a candidate.',true);
  const a=assessRoute(routes[mars.route],mars.budget,mars.storm);
  if(a.blocked)return refresh('Protected cells are impassable. Select a route around the heritage area.',true);
  if(!a.valid)return refresh('The selected route exceeds the risk budget or battery cap.',true);
  mars.step=1;refresh('Command queued. The compressed transmission is running.');
  timer=setTimeout(tickMars,reduced()?250:800);
}
function tickMars(){
  if(mars.step===3)return deliverMars();
  mars.step++;
  document.querySelectorAll('#command-stages span')[mars.step-1]?.classList.add('lit');
  announce(mars.step===2?'Simulated uplink in transit.':'ECHO-7 is evaluating the route locally.');
  timer=setTimeout(tickMars,reduced()?250:800);
}
function deliverMars(){
  clearTimeout(timer);
  if(!marsBusy())return;
  mars.step=4;
  if(!mars.storm){
    mars.storm=true;
    return refresh('The uplink reached ECHO-7. Dust changed shelf conditions. Choose a safe route for the simulated local replan.');
  }
  state.mars=true;maybeEvidence();tone();
  refresh('Downlink received. ECHO-7 stayed clear of the heritage zone and deployed MOTE.');
}
function evidence(){
  const prompts=[equipment.surveyor.fact,equipment.alsep.fact,equipment.opportunity.fact];
  const choices=[['','Choose a conclusion'],['scoop','Retired lander records still inform engineering.'],['archive','An archived waveform is distinct from a live heartbeat.'],['closure','Last contact and official closure are separate events.']];
  return grid('<h2>Match three evidence records</h2>'+prompts.map((p,i)=>'<div class="linkrow">'+select('link'+i,p,choices)+'</div>').join(''),
    '<h2>What caused the false alert?</h2><form id="evidence-form"><div class="choices"><label><input type="radio" name="cause" value="revival"> The historical missions restarted.</label><label><input type="radio" name="cause" value="optics"> Only the optical path failed.</label><label><input type="radio" name="cause" value="both"> Modern optics failed and the archive attached retired IDs to live relays.</label></div><button class="primary" type="submit">Validate evidence →</button></form>')+note();
}
function ending(){
  const scores=(state.pre===null?'':'Pre-mission '+state.pre+'/5. ')+(state.post===null?'':'Post-mission '+state.post+'/5.');
  return say('Maya Chen','The relay was broken. So was our interpretation.')+'<div class="grid equal">'+Object.values(equipment).map(r=>panel('<div class="eyebrow">'+r.tag+'</div><h2>'+r.name+'</h2><p>'+r.fact+'</p>')).join('')+
    '</div><section class="panel stack"><h2>Mission debrief</h2><p>Delayed signals favor goal-based control. Heritage protection keeps equipment and its surroundings intact. A historic identifier in a packet is a clue to investigate.</p><p>'+scores+'</p><p class="teacher">Teacher prompt: Ask learners why both a hardware repair and a catalog correction were needed. Compare the rover’s options before and after the simulated dust event.</p><div class="actions no-print">'+btn('quiz-post','Optional post-mission check')+btn('print','Print teacher summary')+link('archive','Browse archive')+'</div></section>';
}
function archivePage(){
  return heading('Free access / Equipment archive','Records outlast missions','Open any record at any time. The exhibit combines blueprint mission summaries with original illustrations.')+
    '<div class="archive-grid">'+Object.entries(equipment).map(([id,r])=>panel(badge(r.tag)+'<h2>'+r.name+'</h2>'+(state.mode==='text'?'':diagram(id))+'<details><summary>Open mission record</summary>'+record(r)+'</details>')).join('')+'</div>'+
    '<section class="panel stack"><h2>Remote archive · Status contrast</h2><p>A fictional deep-space probe in this demo remains operational decades after launch. Use the mission record to classify equipment. Its age alone gives too little information.</p></section>';
}
function settings(){
  return heading('Local preferences','Settings','Settings and progress are stored in this browser profile.')+
    panel('<h2>Presentation</h2>'+actions(select('mode-setting','Lunar view',Object.entries(modeNames),state.mode)+btn('motion','Reduced motion '+(state.reduced?'on':'off'),pressed(state.reduced))+btn('sound','Original cue tones '+(state.sound?'on':'off'),pressed(state.sound)))+
    '<p>Dialogue is always written on screen. Text mode provides selectable viewpoints and written routes. System reduced-motion preferences are honored.</p>')+
    '<section class="panel stack"><h2>Start over</h2><p>Clear this demo’s progress and quiz scores in this browser.</p>'+btn('reset','Reset mission')+'</section>';
}
function sources(){
  return heading('Local archive / Provenance','Data notes','The supplied project pack provides historical context. The playable records use synthetic data and original artwork.')+
    panel('<dl><dt>Demo archive record</dt><dd>Mission background adapted from the pack. Independent human source review is pending.</dd><dt>Original illustration</dt><dd>Locally drawn schematic, terrain or animation. Positions are stylized.</dd><dt>Illustrative simulation</dt><dd>Invented logs, waveform, terrain, battery values and hazards. The delay is an illustrative setting.</dd><dt>Fictional future</dt><dd>AURORA, Wayfarer, ECHO-7 and all future dialogue are story elements.</dd></dl>');
}
function credits(){
  return heading('Independent local prototype','Credits','Story and mission outline adapted from the user-provided ECHOES project pack.')+
    panel('<p>Demo implementation and procedural artwork were created with Codex. Graphics and optional cue tones are generated locally. ECHOES is independent educational fiction and has no affiliation with NASA.</p>');
}
function quizPage(){
  return heading('Optional learning check',quiz==='pre'?'Before the mission':'After the mission','Five anonymous questions. Your score stays on this device.')+
    panel('<form id="quiz-form">'+questions.map((q,i)=>'<fieldset><legend>'+q.question+'</legend>'+q.choices.map((a,j)=>'<label><input type="radio" required name="q'+i+'" value="'+j+'"> '+a+'</label>').join('')+'</fieldset>').join('')+
    '<div class="actions"><button class="primary" type="submit">Save score</button>'+btn('quiz-close','Skip check')+'</div></form>');
}

function render(){
  if(moon)position={...moon.position};
  moon=null;echoAnimation?.cancel();
  const screens={prologue,launch,moon:moonPage,'moon/repair':repair,mars:marsPage,evidence,ending};
  const pages={'':home,archive:archivePage,settings,sources,credits};
  const index=chapters.indexOf(page);
  if(quiz)main.innerHTML=quizPage();
  else if(index>=0){
    const progress='<nav class="progress no-print" aria-label="Mission chapters">'+chapters.map((p,i)=>i<=state.stage?'<a class="'+(p===page?'current':'done')+'" href="#/'+p+'" aria-label="'+story[i][1]+'" title="'+story[i][1]+'"'+(p===page?' aria-current="step"':'')+'></a>':'<span title="Locked chapter"></span>').join('')+'</nav>';
    main.innerHTML=progress+heading(...story[index],'Fictional future')+screens[page]();
  }else main.innerHTML=Object.hasOwn(pages,page)?pages[page]():heading('Unknown chapter','Page unavailable','Return to the title screen to continue.')+link('','Return to ECHOES');
  document.title=(quiz?'Learning check':index>=0?story[index][1]:'The Last Transmission')+' | ECHOES';
  if($('#hero-art'))drawHero($('#hero-art'));
  if($('#moon-scene')){
    moon=startMoon($('#moon-scene'),$('#moon-status'),openArtifact,announce);
    if(moon&&position)moon.restore(position);
    if(!moon)$('#moon-status').textContent='Use the viewpoint list or switch to the 2D map.';
  }
}
function routeChange(){
  const next=location.hash.startsWith('#/')?location.hash.slice(2):'';
  if(chapters.indexOf(next)>state.stage){
    go(state.started?chapters[state.stage]:'');
    return;
  }
  if(page==='mars'&&next!=='mars'&&marsBusy()){
    clearTimeout(timer);mars.step=0;
  }
  page=next;quiz='';message='';render();
  if(next)main.focus({preventScroll:true});
  window.scrollTo(0,0);
}
function learn(id,index){
  const r=equipment[id];
  if(r.answer!==index)return refresh(r.hint,true);
  state.learned[id]=true;
  if(sites.every(s=>state.learned[s.id]))unlock(3);
  maybeEvidence();tone();refresh('Record logged. '+r.fact);
}
function checkRepair(){
  if(relayReady(state.optics,state.archive))unlock(4);
  else save();
  tone();
}
main.addEventListener('click',event=>{
  const target=event.target.closest('[data-action]');
  if(!target)return;
  const id=target.dataset.action;
  if(id==='start')return advance(state.stage);
  if(id.startsWith('packet-'))return id==='packet-1'?advance(1):refresh('The display ID comes from a catalog. The origin node identifies the modern sender.',true);
  if(id.startsWith('launch-'))return id==='launch-0'?advance(2):refresh('The lunar and Mars transfers follow separate trajectories and take different amounts of time.',true);
  if(id==='separation'){
    refocus(id);
    for(const [target,x,y] of [['#lunar-stack',190,-103],['#mars-stack',345,-64]]){
      const stack=$(target);
      if(reduced())stack.setAttribute('transform','translate('+x+' '+y+')');
      else stack.animate([{transform:'translate(0,0)'},{transform:'translate('+x+'px,'+y+'px)'}],{duration:target==='#lunar-stack'?1300:2400,fill:'forwards'});
    }
    return announce('The Moon stack and Mars stack separate onto different trajectories.');
  }
  if(id.startsWith('mode-')){
    state.mode=id.slice(5);save();return refocus(id);
  }
  if(id.startsWith('site-'))return openArtifact(id.slice(5));
  if(id.startsWith('walk-')){
    const key=id.slice(5);
    if(key==='inspect')moon?.open();
    else if(key==='scan')moon?.scan();
    else moon?.move(key);
    return;
  }
  if(id.startsWith('echo-'))return playEcho(id.slice(5));
  if(id.startsWith('artifact-'))return learn(artifact,Number(id.slice(9)));
  if(id.startsWith('detour-')){
    if(id==='detour-0')return refresh('The direct approach crosses protected ground. Follow the service trail around it.',true);
    state.detour=true;save();return refresh('Detour clear. You reached the fictional receiver.');
  }
  if(['clean','left','right'].includes(id)){
    if(state.optics)return announce('The optics passed the test and are locked in alignment.');
    if(id==='clean')clean=true;
    else bearing=Math.max(-30,Math.min(30,bearing+(id==='left'?-15:15)));
    return refocus(id);
  }
  if(id==='optics'){
    if(!clean||bearing!==0)return refresh('Clean the lens and bring the bearing to 0° before testing.',true);
    state.optics=true;checkRepair();return refresh('Optical signal restored. '+(state.archive?'Both repairs confirmed.':'The catalog mapping still needs correction.'));
  }
  if(id==='fix-archive'){
    if(classification!=='retired'||radioSource(sender)!=='AURORA-L02')return refresh('Preserve ALSEP as a retired science record and assign the live sender to AURORA-L02.',true);
    state.archive=true;checkRepair();return refresh('Catalog corrected. '+(state.optics?'Both repairs confirmed.':'The optical receiver still needs repair.'));
  }
  if(id.startsWith('landmark-')){
    if(id!=='landmark-0')return refresh('Look for the triangular ridge described in the archive.',true);
    state.landmark=true;maybeEvidence();return refresh('Landmark confirmed.');
  }
  if(id.startsWith('opp-'))return learn('opportunity',Number(id.slice(4)));
  if(id.startsWith('route-')){
    if(marsBusy())return announce('Wait for the queued command report.');
    mars.route=id.slice(6);return refocus(id);
  }
  if(id==='mars-send')return sendMars();
  if(id==='mars-skip')return deliverMars();
  if(id==='quiz-pre'||id==='quiz-post'){quiz=id.slice(5);render();main.focus();return;}
  if(id==='quiz-close'){quiz='';render();main.focus();return;}
  if(id==='print')return print();
  if(id==='motion'||id==='sound'){
    const setting=id==='motion'?'reduced':'sound';
    state[setting]=!state[setting];save();
    if(id==='sound')tone();
    return refocus(id);
  }
  if(id==='reset'&&confirm('Reset mission progress and quiz scores on this device?')){
    state=fresh();position=undefined;moon=null;artifact='';bearing=30;clean=false;classification='';sender='';
    clearTimeout(timer);mars=newMars();save();go('');
  }
});
main.addEventListener('change',event=>{
  const {id,value}=event.target;
  if(id==='mode-setting'){state.mode=value;save();return;}
  if(id==='classification')classification=value;
  if(id==='sender')sender=value;
  if(page==='mars'&&['goal','module','budget','delay'].includes(id)){
    if(marsBusy()){
      event.target.value=mars[id];
      return announce('Wait for the queued command report.');
    }
    mars[id]=['budget','delay'].includes(id)?Number(value):value;
    message='';render();document.getElementById(id)?.focus();
  }
});
main.addEventListener('submit',event=>{
  event.preventDefault();
  const form=event.target, data=new FormData(form);
  if(form.id==='quiz-form'){
    const score=questions.filter((q,i)=>Number(data.get('q'+i))===q.answer).length;
    state[quiz]=score;quiz='';save();refresh('Saved score: '+score+' out of 5.');
    if(page==='')announce('Saved score: '+score+' out of 5.');
  }
  if(form.id==='evidence-form'){
    const valid=['scoop','archive','closure'].every((answer,i)=>$('#link'+i).value===answer);
    if(valid&&data.get('cause')==='both')return advance(6);
    message=valid?'The physical receiver and the catalog mapping both failed.':'Match each clue to the conclusion it supports. Look for soil tests, seismic measurements and rover closure.';
    error=true;$('#feedback')?.remove();main.insertAdjacentHTML('beforeend',note());$('#feedback').focus();
  }
});
document.querySelector('.skip').addEventListener('click',event=>{event.preventDefault();main.focus();});
addEventListener('hashchange',routeChange);
routeChange();
