# ECHOES — The Last Transmission

Open **prototype.html** in Edge, Chrome, or Firefox and select **Begin mission**. The demo runs from the local files without installation, an account, or a network connection. To use a localhost URL instead, run `python -m http.server 8000 --bind 127.0.0.1` in this folder and visit `http://127.0.0.1:8000/prototype.html`.

## Play

1. Read the corrupted packet and approve the Moon/Mars launch plan.
2. Inspect Surveyor 3, Apollo 12, and ALSEP from protected viewpoints. Select the canvas for WASD or arrows, E to inspect and Q to scan. Drag to turn. Touch controls and direct viewpoint buttons are also available.
3. Take the safe approach to AURORA-L02, clean and align the optics, and correct the catalog status independently.
4. Study the Opportunity record and choose a goal, tool and route for ECHO-7. Replan after the dust event.
5. Match the evidence and unlock the debrief. The optional checks and teacher summary are available from the title and debrief screens.

Settings offer a 2D map, a text path, reduced motion, cue tones and a local reset. Progress and scores are stored by the browser when local storage is available.

## Edit and verify

All source files are in this folder. `data.js` contains mission summaries and route rules. `scene.js` draws the art and terrain, `app.js` runs the story and `style.css` controls the presentation.

Run `node --test tests/model.test.cjs` with Node.js to verify route and repair rules. The optional browser check in `tests/play.cjs` takes a Playwright package path and an installed Chromium-family executable path, then drives the complete local mission.

## Demo scope

Mission names and educational summaries come from the supplied project pack. Independent source review is pending. Every visual is an original procedural illustration. Telemetry, terrain, delays, energy values, packet identifiers and future events are illustrative fixtures. The Moon scene uses a software-rendered perspective view. The demo uses English text and optional locally generated tones. Codex assisted with the implementation, illustrations and tests.


## Verification

Four model tests passed. Chrome completed the entire mission from the local file at 1440 × 900 in the perspective view and at 390 × 844 in text and reduced-motion mode. The desktop run exercised keyboard movement, inspection, the heritage boundary and the 2D view. Both runs exercised wrong answers, the independent repair gates, the Mars dust replan, the debrief, reload persistence and both quizzes. Screenshots are in the screenshots folder. The browser test detected no application errors or HTTP requests during file-based play.

The mobile run used a desktop browser at a phone-sized viewport. Physical-device and screen-reader testing, independent historical source review and learning outcomes have yet to be measured.

