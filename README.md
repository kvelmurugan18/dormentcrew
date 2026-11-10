# ECHOES — The Last Transmission

Open **index.html** in Chrome or Edge and select **Begin mission**. Everything needed to play is in this folder. The first scene is a local voiced WebM film. After landing, the browser renders the Moon and Mars in WebGL. No account, install step, server, or network connection is required. If the older prototype was already open, reload the page.

## Play the mission

- Move with **WASD** or the **arrow keys**. Turn with **Q / E** or drag the scene. Phones have hold-to-move and turn controls.
- Follow the cyan beacons. At each marker, use **F** or **Inspect**. Aria visits Surveyor 3, Apollo 12, the seismic station and the modern receiver in order.
- The conversation alternates between Aria and ECHO-7. After the optical handoff, follow the Mars route in first person, including the guided detour around Opportunity.
- After the second repair, watch the Earthbound Voyager sequence and reunion. **Esc** pauses. **CC** toggles optional English subtitles. The opening, conversations and return have a skip control.

## Source and assets

- **cinematic/story.js** contains dialogue. **shots.js** contains the shot list and camera choreography. **game.js** handles the player, controls and transitions. **models.js** and **world.js** contain the animated models and procedural scenes.
- **cinematic/assets/opening.webm** is the standalone, voiced opening. The inspections, call, Voyager history and reunion are animated in the browser with prerecorded local dialogue.
- **cinematic/credits.html** records the Natural Earth map and ESO panorama sources, Three.js license and Voyager references. The future mission, routes and equipment are stylized fiction. ECHO-7 is a scripted character.
- **prototype.html** opens the earlier text-oriented demo. Its source and tests are kept separately from the new entry point.

## Verification and regeneration

Run `node --test tests/model.test.cjs` for the earlier prototype's model tests. Run `node tests/cinematic.cjs` for the new game with a local Playwright package and Chromium. Optional environment variables **PLAYWRIGHT_PATH** and **CHROME_PATH** select their local paths, and **ECHOES_PREVIEWS** saves screenshots. The test drives the real keyboard controls and a simulated touch press.

The **cinematic/record-dialogue.ps1**, **build-audio.py** and **render-opening.cjs** helpers regenerate the offline voice tracks, score and film. The film renderer needs Playwright, Chromium and FFmpeg (**FFMPEG_PATH**). Run these from the project root. It is only necessary to regenerate media when changing the opening or dialogue.


