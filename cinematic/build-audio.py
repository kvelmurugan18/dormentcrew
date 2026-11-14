from pathlib import Path
import math
import struct
import wave
import json

folder = Path(__file__).resolve().parent / 'assets'
durations = {}
for path in sorted(folder.glob('*.wav')):
    if path.stem.startswith('score') or path.stem == 'voice-test':
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


def render_score(name, chords, melody, beat, brightness):
    duration = 32 * beat
    with wave.open(str(folder / (name + '.wav')), 'wb') as track:
        track.setparams((1, 2, rate, 0, 'NONE', 'not compressed'))
        samples = bytearray()
        for frame in range(round(rate * duration)):
            t = frame / rate
            count = t / beat
            bar = int(count / 8) % len(chords)
            pos = count / 8 % 1
            pad = 0
            for chord, gain in ((chords[bar-1], max(0, 1-pos*4)), (chords[bar], min(1, pos*4))):
                pad += gain * sum(math.sin(tau*f*t) + .15*math.sin(2*tau*f*t+.3) for f in chord)
            note = melody[int(count) % len(melody)]
            age = (count % 1) * beat
            envelope = min(1, age * 30) * math.exp(-age / (.38 + brightness))
            lead = envelope * (math.sin(tau*note*age) + brightness * math.sin(2*tau*note*age))
            fade = min(1, t * 1.8, (duration-t) * 1.8)
            samples.extend(struct.pack('<h', int(fade*(pad*950 + lead*2400))))
        track.writeframes(samples)


render_score('score-moon', [(55,82.41,130.81), (43.65,65.41,110), (65.41,98,130.81), (49,73.42,123.47)],
             [220,329.63,261.63,392,220,0,196,261.63], 1.15, .18)
render_score('score-mars', [(73.42,110,146.83), (58.27,87.31,116.54), (65.41,98,130.81), (55,82.41,110)],
             [293.66,0,440,349.23,0,392,293.66,220], .69, .28)
render_score('score-return', [(65.41,98,164.81), (55,82.41,130.81), (43.65,65.41,110), (49,73.42,123.47)],
             [329.63,392,523.25,392,293.66,349.23,440,261.63], 1.06, .41)

