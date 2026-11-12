# audio — 《一物一控》配乐 + foley

Run (Git Bash, node, ffmpeg on PATH; ~25 s, deterministic — two runs give identical mix.wav md5):

    node gen_cues.js      # cues.json only (timeline.js = docs/方案.md section C, the single source of truth)
    node gen_audio.js     # music.wav sfx.wav mix.wav mix.mp3 cues.json ledger.json  (env MG/SG = music/sfx gain, default .62/1)
    node analyze.js       # duration, LUFS/TP, onset check, per-section band power

Outputs in `out/`: music.wav (stem), sfx.wav (stem), mix.wav (loudnorm I=-14 / TP<=-1.5, exactly 60.000 s, 44.1 kHz 16-bit stereo), mix.mp3, cues.json, ledger.json (synth start of every sfx vs cue).

cues.json: same schema as toggle-lab (`bpm, beatSec, duration, beats, scenes[{id,startBeat,beats,start,dur,k}], events[{b,t,type,scene,...}]`). Scene ids s00..s12 + `final`. `flip` events carry `to:'on'|'off'`, `v`, `D`; `drag` carries `len,from,to`.

## Section map (G major, 120 BPM, bar n = beats 4(n-1)..4n)
| section | bars | beats | content |
|---|---|---|---|
| intro | 1-2 | 0-8 | lush pad + piano arps; stamp thump 0, boing 4/7, no drums |
| build | 3-8 | 8-32 | kick+offbeat hat from 12; claps bars 4-6 only (stamps 24/25.5/28 are the claps); motif A bars 4-5, rest bar 6, A again 7-8 |
| radio break | 9-12 | 32-48 | same music rendered twice: narrow (mono, 350-2800 Hz 4th order, small room, saturation, -22 dB noise bed) crossfaded with the full-band dry render by the knob-proximity curve (41.5->45.5 to .8, 45.5 overshoot to .2, 46->47.5 to .9); no kick/hat, ratchet ticks = shaker; snare roll 47-47.75; 47.75 drums+noise out (quarter-beat gap); 48 dry 1.0 |
| Drop 1 | 13-19 | 48-76 | full groove; hat off 48-56 (sand hiss = hat); shaker off + lead silent 58-64 (cards solo); crash 64; stab 68 |
| ebb | 20-21 | 76-84 | kick on 1,3 only, bright pad, motif A |
| breakdown | 22-24 | 84-96 | no drums, pad + one low pedal, piano; pinwheel clacks are the rhythm; swell 94-96 |
| Drop 2 | 25-29 | 96-116 | crash 96, motif B + choir, bells x5 (foley), <=2 twinkles, snare roll 115-116 |
| final | 30 | 116-120 | kick + crash + G1 sub + choir bloom, B-D-E close, bell G6 at 119, fade to silence by 59.95 s |

Motif identity = B4 D5 E5 (motifs `MA`, `MB`, `MB2`, `MC` in gen_audio.js). Chord table `CH`/`BARCH`. Foley (D2) functions are in the "foley" block; every sound starts at `T(cue.b)`.
