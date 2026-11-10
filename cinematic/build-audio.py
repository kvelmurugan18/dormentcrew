from pathlib import Path
import math
import struct
import wave
import json

folder = Path(__file__).resolve().parent / 'assets'
durations = {}
for path in sorted(folder.glob('*.wav')):
    if path.stem in ('score', 'voice-test'):
        continue
    with wave.open(str(path), 'rb') as clip:
        durations[path.stem] = round(clip.getnframes() / clip.getframerate(), 3)

(folder.parent / 'timings.js').write_text('const voiceTimes=' + json.dumps(durations) + ';\n')
rate, seconds = 22050, 18
tau = 2 * math.pi
notes = [55, 82.444, 110, 130.813, 164.814, 220, 261.626]
with wave.open(str(folder / 'score.wav'), 'wb') as score:
    score.setparams((1, 2, rate, 0, 'NONE', 'not compressed'))
    samples = bytearray()
    for frame in range(rate * seconds):
        t = frame / rate
        fade = min(1, t / 2, (seconds - t) / 2)
        slow = sum(math.sin(tau * f * t + 0.15 * math.sin(t + i)) * (.25 + .13 * math.sin(t * .48 + i)) / (i + 2) for i, f in enumerate(notes))
        step = int(t * 2) % len(notes)
        elapsed = t % .5
        bell = math.sin(tau * 4 * notes[step] * t) * min(1, elapsed * 80) * math.exp(-elapsed * 8)
        samples.extend(struct.pack('<h', int(fade * (slow * 4700 + bell * 900))))
    score.writeframes(samples)

