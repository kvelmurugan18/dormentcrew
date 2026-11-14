'use strict';

const checkpointKey = 'echoes-mission-2042-v1';
let visited = new Set();
let checkpoint = readCheckpoint();
let archiveIds = [];
let selectedRecord = '';
let archivePending = null;
let archiveReturnFocus = null;
let archiveVoice = false;
let archiveVideo = null;
let fieldInspection = null;
let quizIndex = 0;
let scoreCount = 0;
let tried = false;
let solved = false;

function readCheckpoint() {
  try {
    const saved = JSON.parse(localStorage.getItem(checkpointKey));
    if (saved && ['moon','mars','return','interview'].includes(saved.chapter)) {
      return {
        chapter: saved.chapter,
        index: Number.isInteger(saved.index) ? Math.max(0,saved.index) : 0,
        visited: Array.isArray(saved.visited) ? saved.visited.filter(id => recordById[id]) : []
      };
    }
  } catch {}
  return null;
}

function saveCheckpoint(chapter, index=0) {
  checkpoint = {chapter,index,visited:[...visited]};
  try { localStorage.setItem(checkpointKey,JSON.stringify(checkpoint)); } catch {}
  $('continue').hidden = false;
}

function clearCheckpoint() {
  checkpoint = null;
  try { localStorage.removeItem(checkpointKey); } catch {}
  $('continue').hidden = true;
}

function showArchive(ids, onDone = null, inspection = null) {
  archiveIds = ids;
  archivePending = onDone;
  fieldInspection = inspection;
  archiveReturnFocus = document.activeElement;
  archiveVoice = !inspection && !voice.paused;
  archiveVideo = [film,interviewVideo].find(video=>!video.hidden&&!video.paused) || null;
  held.clear();
  touches.clear();
  voice.pause();
  archiveVideo?.pause();
  $('archive').classList.toggle('inspection',Boolean(inspection));
  $('archive-title').textContent = inspection ? inspection.title : 'Equipment archive';
  $('archive-close').hidden = Boolean(archivePending && !inspection);
  $('archive-close').textContent = inspection ? 'Back to route' : 'Close';
  $('inspection-film').hidden = !inspection;
  $('archive-continue').textContent = inspection ? 'Next waypoint →' : 'Continue mission →';
  $('archive').showModal();
  showRecord(inspection ? ids[0] : ids.find(id=>!visited.has(id)) || ids[0]);
  const focusTarget = inspection ? $('archive-detail').querySelector('h3') :
    archivePending ? $('archive-list').querySelector('button') : $('archive-close');
  focusTarget?.focus();
  if(inspection?.voice)talk(inspection.voice);
}

function showRecord(id) {
  if (!archiveIds.includes(id)) return;
  selectedRecord = id;
  if (archivePending) visited.add(id);
  const data = recordById[id];
  const list = $('archive-list');
  list.replaceChildren();
  let region;
  archiveIds.forEach(recordId => {
    const item = recordById[recordId];
    const section = fieldInspection ? (recordId===archiveIds[0] ? 'At this stop' : 'Related mission records') : item.region;
    if (section !== region) {
      region = section;
      const heading = document.createElement('h3');
      heading.textContent = region;
      list.append(heading);
    }
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.recordId = recordId;
    button.setAttribute('aria-current', String(recordId === id));
    button.textContent = (visited.has(recordId) ? '✓  ' : '') + item.name;
    list.append(button);
  });
  const next = $('archive-next');
  const detail = $('archive-detail');
  detail.innerHTML = '<div class="site"></div><h3 tabindex="-1"></h3><figure><img><figcaption></figcaption></figure><p></p><div class="archive-links"></div>';
  detail.querySelector('.site').textContent = data.site;
  detail.querySelector('h3').textContent = data.name;
  const img = detail.querySelector('img');
  img.alt = 'Mission reference for ' + data.name;
  img.addEventListener('error', () => { img.closest('figure').hidden = true; }, {once:true});
  img.src = finalAssets + data.image;
  detail.querySelector('figcaption').textContent = data.credit;
  detail.querySelector('p').textContent = data.text;
  const links = [['Mission source',data.source],...(data.extra?[data.extra]:[])];
  for (const [label,url] of links) {
    const a = document.createElement('a');
    a.textContent = label;
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener';
    detail.querySelector('.archive-links').append(a,document.createTextNode('  '));
  }
  const total = archiveIds.filter(recordId => visited.has(recordId)).length;
  $('archive-count').textContent = fieldInspection ? '' : archivePending ? total + ' / ' + archiveIds.length + ' explored' : archiveIds.length + ' records';
  $('archive-continue').hidden = !archivePending || (!fieldInspection && total < archiveIds.length);
  list.querySelector('[aria-current=true]')?.scrollIntoView({block:'nearest',inline:'nearest'});
  next.hidden = Boolean(fieldInspection) || archiveIds.length === 1 || Boolean(archivePending && total === archiveIds.length);
}

function closeArchive(continueMission = false) {
  if(archivePending && !fieldInspection && (!continueMission || archiveIds.some(id=>!visited.has(id))))return;
  if(fieldInspection)talk('');
  const done = continueMission ? archivePending : null;
  const resume = archiveVoice;
  const resumeVideo = archiveVideo;
  archivePending = null;
  fieldInspection = null;
  archiveVoice = false;
  archiveVideo = null;
  $('archive').close();
  if (done) {
    done();
    return;
  }
  if (resume && !paused) voice.play().catch(()=>{});
  if (!paused) resumeVideo?.play().catch(()=>{});
  archiveReturnFocus?.focus({preventScroll:true});
}

function startInterview() {
  saveCheckpoint('interview');
  quizIndex = 0;
  scoreCount = 0;
  changeMode('quiz');
  $('feed').textContent = 'EARTH · 2026 · YUVA LIVE';
  cueScore('score-return');
  if(!reduce){
    if(!interviewVideo.getAttribute('src'))interviewVideo.src=finalAssets+'interview-loop.mp4?v=2026';
    interviewVideo.hidden=false;
    interviewVideo.play().catch(()=>{interviewVideo.hidden=true;});
  }
  showQuestion();
}

function showQuestion() {
  const question = questions[quizIndex];
  tried = false;
  solved = false;
  $('quiz-progress').textContent = 'YUVA’S INTERVIEW  /  ' + (quizIndex + 1) + ' OF ' + questions.length;
  $('question').textContent = question.prompt;
  $('quiz-feedback').textContent = '';
  $('quiz-clue').hidden = false;
  $('quiz-next').hidden = true;
  $('quiz-next').textContent = quizIndex === questions.length - 1 ? 'Finish interview →' : 'Next question →';
  const options = $('answers');
  options.replaceChildren();
  question.options.forEach((label,index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.addEventListener('click', () => answerQuestion(button,index));
    options.append(button);
  });
  talk('q'+quizIndex);
  $('question').focus({preventScroll:true});
}

function answerQuestion(button,index) {
  if (solved) return;
  const question = questions[quizIndex];
  if (index !== question.correct) {
    tried = true;
    button.classList.add('wrong');
    button.disabled = true;
    showQuizClue();
    $('answers').querySelector('button:not(:disabled)')?.focus();
    return;
  }
  solved = true;
  if (!tried) scoreCount++;
  button.classList.add('correct');
  for (const option of $('answers').children) option.disabled = true;
  $('quiz-feedback').textContent = 'Yuva · ' + question.answer;
  talk('answer'+quizIndex);
  $('quiz-clue').hidden = true;
  $('quiz-next').hidden = false;
  $('quiz-next').focus({preventScroll:true});
}

function showQuizClue() {
  const question = questions[quizIndex];
  $('quiz-feedback').textContent = 'Clue · ' + (recordById[question.record]?.clue ||
    'A light-day measures how far light travels in one day.');
}

function bindPanels() {
  $('archive-list').addEventListener('click', event => {
    const button = event.target.closest('[data-record-id]');
    if (button) {
      showRecord(button.dataset.recordId);
      $('archive-detail').querySelector('h3').focus({preventScroll:true});
    }
  });
  $('archive-next').addEventListener('click', () => {
    const pendingId = archivePending && archiveIds.find(id => !visited.has(id));
    showRecord(pendingId || archiveIds[(archiveIds.indexOf(selectedRecord)+1)%archiveIds.length]);
    if($('archive-next').hidden)$('archive-continue').focus();
  });
  $('archive-close').addEventListener('click', () => closeArchive());
  $('inspection-film').addEventListener('click', () => {
    const replay = fieldInspection?.replay;
    if(!replay)return;
    closeArchive();
    replay();
  });
  $('archive-continue').addEventListener('click', () => closeArchive(true));
  $('archive').addEventListener('cancel', event => {
    event.preventDefault();
    if(!archivePending || fieldInspection)closeArchive();
  });
  $('archive-open').addEventListener('click', () => showArchive(records.map(record => record.id)));
  $('quiz-clue').addEventListener('click', showQuizClue);
  $('quiz-next').addEventListener('click', () => {
    if (!solved) return;
    if (++quizIndex < questions.length) showQuestion();
    else finish();
  });
}
