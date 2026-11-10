'use strict';
// Scene dialogue. Audio files use the same keys.
const lines = {
  signal: ['CONTROL', 'Wayfarer, we lost two heritage relays. One on the Moon. One on Mars. Both packets are carrying names from the old missions.'],
  launch: ['ARIA', 'Copy, Control. I will take the lunar site. Echo, take the Mars stack. We will compare notes when you get there.'],
  split: ['ECHO-7', 'Separation confirmed. Your trip takes days. Mine takes months. I will keep a light on for you.'],
  landing: ['CONTROL', 'Aria, you are clear to land. Follow the route beacons and stay outside the marked heritage zones.'],
  moonStart: ['ARIA', 'Boots down. I see the first beacon. Let’s find out what these machines can tell us.'],
  surveyor: ['ARIA', 'Surveyor Three. Its scoop tested how the lunar soil behaved. Watch the lander settle. Two bounces, then it was still.'],
  apollo: ['ARIA', 'The top stage carried the crew back to orbit. This lower stage stayed behind. It cannot be the source of our signal.'],
  alsep: ['ARIA', 'The seismic experiment measured vibrations in the ground. That waveform is an archived measurement. It is not a live heartbeat.'],
  moonRelay: ['ARIA', 'Modern receiver in sight. Clearing the dust. Aligning the lens. Now to correct the archive so it stops assigning old names to new signals.'],
  callAria: ['ARIA', 'Echo, the Moon relay is back. Its catalog confused old equipment with a live sender. Are you seeing the same thing?'],
  callEcho: ['ECHO-7', 'Delayed reply received. Same pattern here. I have a safe route around Opportunity. I am sending you my camera and drive controls.'],
  callBack: ['ARIA', 'I see your camera. I will drive from your point of view. Keep me outside the rover’s protected zone.'],
  marsStart: ['ECHO-7', 'Camera linked. Follow the first beacon along the ridge. I will keep us on safe terrain.'],
  ridge: ['ECHO-7', 'The ridge gives us a clear view across the valley. Dust is filling the direct approach. I have marked a route around it.'],
  opportunity: ['ECHO-7', 'There is Opportunity. Its instruments found evidence that water once shaped rocks here. Its discoveries stayed with us after its last signal.'],
  marsRelay: ['ECHO-7', 'At the modern relay. Deploying the optical marker. Correcting the sender label. Both relays now agree. Mission complete.'],
  depart: ['ARIA', 'Both sites are clear, and our records are on their way home. Echo, what do you think about on a long trip back?'],
  voyager: ['ECHO-7', 'The Voyagers. Two probes left Earth in nineteen seventy seven. Voyager One visited Jupiter and Saturn. Voyager Two continued to Uranus and Neptune.'],
  record: ['ECHO-7', 'Each carries a Golden Record with greetings, sounds, music and pictures from Earth. It was a way to tell someone, somewhere, that we were here.'],
  stars: ['ECHO-7', 'Both crossed into interstellar space. They kept going outward. We get to do something the Voyagers were never built to do.'],
  earth: ['ARIA', 'Come home. Welcome back, Echo.'],
  reunion: ['ECHO-7', 'Welcome back, Aria. The old missions are safe in the archive. Our story can go beside theirs.']
};

