# ECHOES — The Last Transmission

A cinematic browser game by Dorment Crew. In this dramatized expedition set in 2026, Yuva and E.D.I.T.H. investigate the last signals from Surveyor 3 and Opportunity using historical NASA mission records.

## Play

Open the [published game](https://kvelmurugan18.github.io/dormentcrew/) or run `python -m http.server 8766 --bind 127.0.0.1` from the project folder and open `http://127.0.0.1:8766/` in Chrome or Edge. Everything the game needs is included. You can play without an account or a connection to NASA. Serving the folder over HTTP enables the detailed 3D suit and reliable video playback.

- Select **Begin mission** to play the voiced cutscenes. **CC** toggles captions and **Esc** pauses.
- Move with **WASD** or the arrow keys. Turn with **Q / E** or drag. Use the on-screen buttons on touchscreens.
- Follow the distance marker or choose **Navigate** for guided movement. Use **F** or **Inspect** at each stop to open its NASA image and description. The same panel lets you watch the replay or continue to the next waypoint. The route switches from Yuva on the Moon to E.D.I.T.H.’s camera on Mars.
- Explore the equipment records, watch the crew return, and answer six questions in Yuva’s televised interview. Reloading preserves the latest mission checkpoint.

The older prototype remains available through `prototype.html`.

## Assets and verification

- `cinematic/story.js` holds dialogue, `shots.js` holds film cues, and `archive-data.js` holds records and interview questions.
- `cinematic/direction.js` builds the 3D sets and animates the original shots. The final MP4s are bundled in `cinematic/assets/final` with dialogue and score. The on-site [credits](cinematic/credits.html) identify NASA footage, scientific visualizations and other media.
- Run `node --test tests/model.test.cjs` for the earlier prototype tests. Run `node tests/cinematic.cjs` with the HTTP server active to validate video playback, exploration, checkpoint recovery, the archive and the interview in Chromium. Set `PLAYWRIGHT_PATH`, `CHROME_PATH`, and `ECHOES_URL` if local paths differ. `ECHOES_PREVIEWS` optionally writes screenshots to an existing directory.
- To regenerate the female narration, install `kokoro-js` and run `node cinematic/record-neural.cjs`, then `python cinematic/build-audio.py`. The first run downloads the Kokoro model. Regenerate the films with `node cinematic/render-opening.cjs` while the local server is running. The renderer takes optional film names, `PLAYWRIGHT_PATH`, `CHROME_PATH`, and `FFMPEG_PATH`. Set `ECHOES_ARCHIVE_MEDIA` to a directory containing the NASA and licensed stock originals under the filenames listed in the renderer to include their excerpts.
