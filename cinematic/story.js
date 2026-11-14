'use strict';

const lines = {
  signal: ['MISSION CONTROL', 'Two machines went quiet on two different worlds. On the Moon, Surveyor Three fell silent at sunset. On Mars, Opportunity lost power in a dust storm. Yuva and Edith, find out what their last signals can tell us.'],
  trainingMoon: ['YUVA', 'In training, I practice matching a picture to what I see out the window. Find the crater rim. Then find the tracks. Those landmarks will guide me to Surveyor Three.'],
  trainingMars: ['E.D.I.T.H.', 'My training starts with Opportunity’s route. See that yellow line? It ends inside Perseverance Valley. I’ll stop on the ridge where I can see the rover and keep clear of its tracks.'],
  launch: ['MISSION CONTROL', 'Launch is clear. One rocket, two spacecraft. Yuva, you are headed for the Moon. Edith, after separation, you are headed for Mars.'],
  split: ['E.D.I.T.H.', 'Both spacecraft are clear. Yuva, you land in days. My descent comes months later. I will send you the archive from the transit leg.'],
  landing: ['YUVA', 'Lunar descent complete. I have the orbital map on my display. Surveyor Crater is our first stop.'],
  moonStart: ['E.D.I.T.H.', 'Yuva, follow your navigation marker. Check the distance and stay outside the heritage perimeter. I will bring up each mission as you approach.'],
  surveyor: ['E.D.I.T.H.', 'Surveyor Three bounced twice before it settled. Its scoop tested the soil and helped show that a crewed lander could stand here. NASA shut it down for lunar night on May fourth, nineteen sixty-seven. Apollo Twelve later brought parts back to Earth.'],
  apollo: ['E.D.I.T.H.', 'That is Intrepid. Its upper stage carried the crew back to lunar orbit. The lower stage remained here, with the footprints you can see on the orbital image.'],
  alsep: ['E.D.I.T.H.', 'The Apollo Twelve seismometer recorded vibrations in the Moon. The powered stations shut down in nineteen seventy-seven. The archived measurements still tell scientists about what lies below the surface.'],
  lunarRepair: ['E.D.I.T.H.', 'Taurus Littrow, December nineteen seventy-two. A hammer tore the Apollo Seventeen rover’s fender extension off. Tape came loose on the dusty surface. The crew made a new guard from four maps, tape and clamps. It worked because they could fit and fasten it by hand.'],
  moonReport: ['YUVA', 'Moon survey complete. Surveyor’s silence followed sunset. I am sending the site observations and the original shutdown record.'],
  marsDescent: ['E.D.I.T.H.', 'Months later. Mars descent complete. I have received Yuva’s recorded update. I am sending my own camera and route notes back.'],
  cameraLink: ['MISSION CONTROL', 'Mars view received. Take over the exploration controls.'],
  marsStart: ['E.D.I.T.H.', 'Follow the marker up to the ridge. I will keep us clear of the rover and its tracks.'],
  ridge: ['E.D.I.T.H.', 'This is Perseverance Valley, on the rim of Endeavour Crater. The route in yellow is Opportunity’s actual traverse. We will stay on our own path.'],
  opportunity: ['E.D.I.T.H.', 'Opportunity’s instruments found evidence that water once shaped rocks on Mars. During the twenty eighteen storm, dust blocked sunlight and the solar-powered rover fell silent. Earth sent over a thousand recovery commands. Opportunity never answered.'],
  last: ['YUVA', 'I see the last frame. Only part of it made it home. The dates and the storm tell us why the signal stopped.'],
  spiritRepair: ['E.D.I.T.H.', 'Earlier, Spirit had a different problem. In two thousand four, its computer repeatedly reset while trying to manage flash memory. Engineers on Earth temporarily bypassed flash, cleared thousands of files and confirmed normal boot. That recovery happened during Spirit’s mission.'],
  depart: ['MISSION CONTROL', 'Earth orbit, 2026. Yuva and Edith are together again. Their records have arrived safely. The crew is cleared for the final return to Earth.'],
  news: ['NEWS REPORTER', 'From the archive. NASA marked a remarkable distance in the Voyager story. In November twenty twenty-six, Voyager One was projected to reach one light-day from Earth. That is roughly twenty-six billion kilometers.'],
  imagine: ['YUVA', 'A radio signal would take a whole day to travel that far. I keep picturing the two probes out there, each on its own path, each carrying a little piece of home.'],
  record: ['E.D.I.T.H.', 'Each Golden Record carries sounds, music, greetings and images from Earth. It was made to tell a future listener something about the people who sent it.'],
  earth: ['YUVA', 'There’s Earth. It feels different when you have spent so long looking back at it.'],
  reunion: ['NEWS REPORTER', 'Welcome home, Yuva. Before we close the mission, let’s see what the evidence tells us.'],
  q0: ['NEWS REPORTER', 'What was happening when Surveyor Three was shut down?'],
  q1: ['NEWS REPORTER', 'What did the Apollo Seventeen crew attach over the wheel?'],
  q2: ['NEWS REPORTER', 'What reduced Opportunity’s solar power in twenty eighteen?'],
  q3: ['NEWS REPORTER', 'What helped Spirit recover in two thousand four?'],
  q4: ['NEWS REPORTER', 'Which spacecraft landed on the asteroid Eros?'],
  q5: ['NEWS REPORTER', 'What does one light-day away mean for a radio signal?']
};
questions.forEach((question,index)=>{
  lines['answer'+index]=['YUVA',question.answer];
});
