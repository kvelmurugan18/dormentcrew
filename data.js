'use strict';

const equipment = {
  surveyor: {
    name: 'Surveyor 3', tag: '01 / LUNAR LANDER', world: 'Moon', year: '1967',
    site: 'Oceanus Procellarum', status: 'Retired',
    fields: ['Robotic lunar lander', 'Study the surface before crewed landings.', 'A camera recorded the surroundings while a mechanical scoop dug into the soil.', 'Soil tests helped engineers understand the surface. A later crew visited and brought back the camera and other components.', 'The mission ended in 1967. Its experiments and recovered parts became part of the historical record.'],
    question: 'Why was the soil scoop important?',
    choices: ['It tested how the surface behaved under pressure.', 'It brought samples back to Earth on its own.', 'It acted as the lander’s radio antenna.'],
    answer: 0, hint: 'The scoop dug into the surface so engineers could study how the soil behaved. It stayed with the lander.',
    fact: 'The soil tests were useful long after the lander fell silent.'
  },
  apollo: {
    name: 'Apollo 12', tag: '02 / LUNAR MODULE', world: 'Moon', year: '1969',
    site: 'Oceanus Procellarum', status: 'Descent stage left on Moon',
    fields: ['Crewed lunar mission and two-stage lunar module', 'Land astronauts precisely enough to work near Surveyor 3.', 'The lower stage landed the crew and served as the launch platform. The upper stage carried the crew back to lunar orbit.', 'The visit gave researchers a chance to study hardware after extended exposure to the lunar environment.', 'The descent stage remained on the surface. The ascent stage lifted the crew away.'],
    question: 'Which part of the lunar module remained on the surface?',
    choices: ['Ascent stage — it carried the crew to orbit.', 'Descent stage — it served as the launch platform.', 'Both stages — the crew returned on foot.'],
    answer: 1, hint: 'The upper ascent stage carried the crew back to lunar orbit. The lower stage stayed behind.',
    fact: 'The module on the surface is a descent stage, left after the crew departed.'
  },
  alsep: {
    name: 'Apollo 12 ALSEP', tag: '03 / SCIENCE ARRAY', world: 'Moon', year: '1969–1977',
    site: 'Apollo 12 experiment site', status: 'Shut down',
    fields: ['Apollo Lunar Surface Experiments Package', 'Record the Moon’s physical environment after the crew left.', 'A passive seismic experiment measured vibrations in the ground.', 'Seismic records help researchers study the Moon’s interior.', 'The instruments were shut down in 1977. Their historical measurements remained available for research.'],
    question: 'How should the modern archive classify the seismic records?',
    choices: ['An active navigation heartbeat.', 'A live distress call.', 'A historical science record from retired equipment.'],
    answer: 2, hint: 'The waveform represents a ground measurement. An archived measurement can be replayed after its instrument stops.',
    fact: 'A preserved seismic waveform does not indicate that ALSEP is still transmitting.'
  },
  opportunity: {
    name: 'Opportunity', tag: '04 / MARS ROVER', world: 'Mars', year: '2004–2019',
    site: 'Perseverance Valley region', status: 'Mission complete',
    fields: ['Solar-powered robotic Mars rover', 'Look for clues about how water shaped Mars.', 'Cameras and instruments examined terrain, rocks and soils along its route.', 'Minerals and rock features provided evidence of past water-affected environments.', 'Contact was lost during a 2018 dust storm. The mission was declared complete in 2019.'],
    question: 'Which clue points to a past watery environment?',
    choices: ['An old rover ID in a new packet.', 'Minerals and rock features shaped by water.', 'The color of the simulated dust overlay.'],
    answer: 1, hint: 'The archive lesson concerns evidence in rocks and minerals. A packet identifier is a catalog label.',
    fact: 'Opportunity’s findings survive in the archive. Contact loss and mission closure were separate events.'
  }
};

const questions = [
  'Which tool helped Surveyor 3 investigate the lunar surface?',
  'Which lunar-module stage stayed behind?',
  'What did the ALSEP seismic experiment measure?',
  'What helped Opportunity identify a past watery environment?',
  'Why should a Mars rover receive a goal and safety limits?'
].map((question, index) => ({
  question,
  choices: [
    ['Soil scoop', 'Optical relay', 'Rocket seat'],
    ['Ascent stage', 'Descent stage', 'Both stages'],
    ['Radio identities', 'Solar brightness', 'Ground vibrations'],
    ['Packet timestamps', 'Rocks and minerals', 'Rover paint'],
    ['Radio signals take time to travel', 'It can hear Earth instantly', 'It never encounters hazards']
  ][index],
  answer: [0, 1, 2, 1, 0][index]
}));

const routes = {
  rim: {name:'Rim detour', points:[[0,4],[0,3],[0,2],[0,1],[1,1],[2,1],[3,1],[4,1],[5,1],[5,0]], base:18, dust:2, risk:1, reason:'Keeps to stable high ground around the heritage area.'},
  shelf: {name:'East shelf', points:[[0,4],[1,4],[2,4],[3,4],[4,4],[5,4],[5,3],[5,2],[5,1],[5,0]], base:14, dust:14, risk:2, reason:'Uses a shorter traverse in meters, with more exposure to dust on the shelf.'},
  direct: {name:'Direct crossing', points:[[0,4],[1,4],[1,3],[2,3],[2,2],[3,2],[4,2],[4,1],[5,1],[5,0]], base:11, dust:5, risk:3, reason:'Crosses protected cells near the historic rover.'}
};
const protectedCell = (x, y) => x >= 2 && x <= 3 && y >= 2 && y <= 3;
function assessRoute(route, budget, storm) {
  const blocked = route.points.some(([x, y]) => protectedCell(x, y));
  const energy = route.base + (storm ? route.dust : 0);
  const risk = route.risk + (storm && route.dust > 10 ? 2 : 0);
  return {blocked, energy, risk, valid: !blocked && risk <= budget && energy <= 24};
}
function recommendRoute(budget, storm) {
  return Object.entries(routes).filter(([, route]) => assessRoute(route, budget, storm).valid)
    .sort(([, a], [, b]) => assessRoute(a, budget, storm).energy - assessRoute(b, budget, storm).energy)[0]?.[0];
}
const relayReady = (optics, archive) => optics && archive;
const radioSource = id => ['AURORA-L02', 'AURORA-M07'].includes(id) ? id : null;
