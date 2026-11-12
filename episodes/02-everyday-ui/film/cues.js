window.CUES={
 "bpm": 120,
 "beatSec": 0.5,
 "duration": 60,
 "beats": 120,
 "scenes": [
  {
   "id": "s00",
   "startBeat": 0,
   "beats": 2,
   "start": 0,
   "dur": 1,
   "k": 1
  },
  {
   "id": "s01",
   "startBeat": 2,
   "beats": 6,
   "start": 1,
   "dur": 3,
   "k": 1
  },
  {
   "id": "s02",
   "startBeat": 8,
   "beats": 14,
   "start": 4,
   "dur": 7,
   "k": 1
  },
  {
   "id": "s03",
   "startBeat": 22,
   "beats": 8,
   "start": 11,
   "dur": 4,
   "k": 1
  },
  {
   "id": "s04",
   "startBeat": 30,
   "beats": 10,
   "start": 15,
   "dur": 5,
   "k": 1
  },
  {
   "id": "s05",
   "startBeat": 40,
   "beats": 10,
   "start": 20,
   "dur": 5,
   "k": 1
  },
  {
   "id": "s06",
   "startBeat": 50,
   "beats": 8,
   "start": 25,
   "dur": 4,
   "k": 1
  },
  {
   "id": "s07",
   "startBeat": 58,
   "beats": 6,
   "start": 29,
   "dur": 3,
   "k": 1
  },
  {
   "id": "s08",
   "startBeat": 64,
   "beats": 10,
   "start": 32,
   "dur": 5,
   "k": 1
  },
  {
   "id": "s09",
   "startBeat": 74,
   "beats": 10,
   "start": 37,
   "dur": 5,
   "k": 1
  },
  {
   "id": "s10",
   "startBeat": 84,
   "beats": 12,
   "start": 42,
   "dur": 6,
   "k": 1
  },
  {
   "id": "s11",
   "startBeat": 96,
   "beats": 8,
   "start": 48,
   "dur": 4,
   "k": 1
  },
  {
   "id": "s12",
   "startBeat": 104,
   "beats": 8,
   "start": 52,
   "dur": 4,
   "k": 1
  },
  {
   "id": "final",
   "startBeat": 112,
   "beats": 8,
   "start": 56,
   "dur": 4,
   "k": 1
  }
 ],
 "events": [
  {
   "b": 0,
   "type": "press",
   "scene": "s00",
   "t": 0
  },
  {
   "b": 0,
   "type": "ink",
   "scene": "s00",
   "len": 0.75,
   "t": 0
  },
  {
   "b": 1,
   "type": "sub",
   "scene": "s00",
   "t": 0.5
  },
  {
   "b": 1.5,
   "type": "riser",
   "scene": "s00",
   "len": 0.5,
   "t": 0.75
  },
  {
   "b": 2,
   "type": "cut",
   "scene": "s00",
   "t": 1
  },
  {
   "b": 2,
   "type": "drop",
   "scene": "s01",
   "t": 1
  },
  {
   "b": 3.5,
   "type": "touch",
   "scene": "s01",
   "t": 1.75
  },
  {
   "b": 3.5,
   "type": "slide",
   "scene": "s01",
   "len": 0.5,
   "t": 1.75
  },
  {
   "b": 4,
   "type": "flip",
   "scene": "s01",
   "to": "on",
   "v": 1,
   "D": 0.7,
   "soft": true,
   "t": 2
  },
  {
   "b": 4.5,
   "type": "cherry",
   "scene": "s01",
   "t": 2.25
  },
  {
   "b": 6.5,
   "type": "touch",
   "scene": "s01",
   "t": 3.25
  },
  {
   "b": 6.5,
   "type": "slide",
   "scene": "s01",
   "len": 0.5,
   "t": 3.25
  },
  {
   "b": 7,
   "type": "flip",
   "scene": "s01",
   "to": "off",
   "v": 0,
   "D": 0.7,
   "soft": true,
   "t": 3.5
  },
  {
   "b": 7.5,
   "type": "settle",
   "scene": "s01",
   "t": 3.75
  },
  {
   "b": 8,
   "type": "cut",
   "scene": "s01",
   "t": 4
  },
  {
   "b": 8,
   "type": "impact",
   "scene": "s02",
   "t": 4
  },
  {
   "b": 9.5,
   "type": "touch",
   "scene": "s02",
   "t": 4.75
  },
  {
   "b": 10,
   "type": "drag",
   "scene": "s02",
   "len": 4,
   "from": 0,
   "to": 1,
   "t": 5
  },
  {
   "b": 11.4,
   "type": "wake",
   "scene": "s02",
   "t": 5.7
  },
  {
   "b": 12,
   "type": "flip",
   "scene": "s02",
   "to": "on",
   "v": 0.5,
   "D": 0.26,
   "beatIn": "kick",
   "t": 6
  },
  {
   "b": 14,
   "type": "land",
   "scene": "s02",
   "t": 7
  },
  {
   "b": 14,
   "type": "pulse",
   "scene": "s02",
   "t": 7
  },
  {
   "b": 15,
   "type": "pulse",
   "scene": "s02",
   "t": 7.5
  },
  {
   "b": 16,
   "type": "pulse",
   "scene": "s02",
   "t": 8
  },
  {
   "b": 16.5,
   "type": "drag",
   "scene": "s02",
   "len": 1.5,
   "from": 1,
   "to": 0.3,
   "t": 8.25
  },
  {
   "b": 18,
   "type": "sit",
   "scene": "s02",
   "t": 9
  },
  {
   "b": 20,
   "type": "nod",
   "scene": "s02",
   "t": 10
  },
  {
   "b": 22,
   "type": "cut",
   "scene": "s02",
   "t": 11
  },
  {
   "b": 22,
   "type": "impact",
   "scene": "s03",
   "t": 11
  },
  {
   "b": 24,
   "type": "stamp",
   "scene": "s03",
   "n": 1,
   "v": 0.33,
   "t": 12
  },
  {
   "b": 24,
   "type": "flip",
   "scene": "s03",
   "to": "on",
   "v": 0.33,
   "D": 0.26,
   "n": 1,
   "t": 12
  },
  {
   "b": 25.5,
   "type": "stamp",
   "scene": "s03",
   "n": 2,
   "v": 0.67,
   "t": 12.75
  },
  {
   "b": 25.5,
   "type": "flip",
   "scene": "s03",
   "to": "on",
   "v": 0.67,
   "D": 0.26,
   "n": 2,
   "t": 12.75
  },
  {
   "b": 28,
   "type": "stamp",
   "scene": "s03",
   "n": 3,
   "v": 1,
   "t": 14
  },
  {
   "b": 28,
   "type": "flip",
   "scene": "s03",
   "to": "on",
   "v": 1,
   "D": 0.26,
   "n": 3,
   "t": 14
  },
  {
   "b": 28.5,
   "type": "lift",
   "scene": "s03",
   "t": 14.25
  },
  {
   "b": 29,
   "type": "rest",
   "scene": "s03",
   "t": 14.5
  },
  {
   "b": 30,
   "type": "cut",
   "scene": "s03",
   "t": 15
  },
  {
   "b": 30,
   "type": "impact",
   "scene": "s04",
   "t": 15
  },
  {
   "b": 31,
   "type": "touch",
   "scene": "s04",
   "t": 15.5
  },
  {
   "b": 31.25,
   "type": "unfold",
   "scene": "s04",
   "len": 0.75,
   "t": 15.625
  },
  {
   "b": 32,
   "type": "flip",
   "scene": "s04",
   "to": "on",
   "v": 0.5,
   "D": 0.26,
   "wow": 1,
   "filter": "narrow",
   "t": 16
  },
  {
   "b": 34,
   "type": "hover",
   "scene": "s04",
   "i": 0,
   "t": 17
  },
  {
   "b": 34.5,
   "type": "hover",
   "scene": "s04",
   "i": 1,
   "t": 17.25
  },
  {
   "b": 35,
   "type": "hover",
   "scene": "s04",
   "i": 2,
   "t": 17.5
  },
  {
   "b": 35.5,
   "type": "touch",
   "scene": "s04",
   "t": 17.75
  },
  {
   "b": 36,
   "type": "flip",
   "scene": "s04",
   "to": "on",
   "v": 1,
   "D": 0.26,
   "wow": 2,
   "t": 18
  },
  {
   "b": 36.5,
   "type": "fold",
   "scene": "s04",
   "len": 0.5,
   "t": 18.25
  },
  {
   "b": 40,
   "type": "cut",
   "scene": "s04",
   "t": 20
  },
  {
   "b": 40,
   "type": "impact",
   "scene": "s05",
   "t": 20
  },
  {
   "b": 41.5,
   "type": "touch",
   "scene": "s05",
   "t": 20.75
  },
  {
   "b": 41.5,
   "type": "drag",
   "scene": "s05",
   "len": 4,
   "from": 0,
   "to": 1.08,
   "kind": "turn",
   "t": 20.75
  },
  {
   "b": 41.75,
   "type": "tick",
   "scene": "s05",
   "i": 0,
   "t": 20.875
  },
  {
   "b": 42,
   "type": "tick",
   "scene": "s05",
   "i": 1,
   "t": 21
  },
  {
   "b": 42.25,
   "type": "tick",
   "scene": "s05",
   "i": 2,
   "t": 21.125
  },
  {
   "b": 42.5,
   "type": "tick",
   "scene": "s05",
   "i": 3,
   "t": 21.25
  },
  {
   "b": 42.75,
   "type": "tick",
   "scene": "s05",
   "i": 4,
   "t": 21.375
  },
  {
   "b": 43,
   "type": "tick",
   "scene": "s05",
   "i": 5,
   "t": 21.5
  },
  {
   "b": 43.25,
   "type": "tick",
   "scene": "s05",
   "i": 6,
   "t": 21.625
  },
  {
   "b": 43.5,
   "type": "tick",
   "scene": "s05",
   "i": 7,
   "t": 21.75
  },
  {
   "b": 43.75,
   "type": "tick",
   "scene": "s05",
   "i": 8,
   "t": 21.875
  },
  {
   "b": 44,
   "type": "tick",
   "scene": "s05",
   "i": 9,
   "t": 22
  },
  {
   "b": 44.25,
   "type": "tick",
   "scene": "s05",
   "i": 10,
   "t": 22.125
  },
  {
   "b": 44.5,
   "type": "tick",
   "scene": "s05",
   "i": 11,
   "t": 22.25
  },
  {
   "b": 44.75,
   "type": "tick",
   "scene": "s05",
   "i": 12,
   "t": 22.375
  },
  {
   "b": 45,
   "type": "tick",
   "scene": "s05",
   "i": 13,
   "t": 22.5
  },
  {
   "b": 45.25,
   "type": "tick",
   "scene": "s05",
   "i": 14,
   "t": 22.625
  },
  {
   "b": 45.5,
   "type": "tick",
   "scene": "s05",
   "i": 15,
   "t": 22.75
  },
  {
   "b": 45.5,
   "type": "overshoot",
   "scene": "s05",
   "t": 22.75
  },
  {
   "b": 45.75,
   "type": "tick",
   "scene": "s05",
   "i": 16,
   "t": 22.875
  },
  {
   "b": 46,
   "type": "tick",
   "scene": "s05",
   "i": 17,
   "t": 23
  },
  {
   "b": 46,
   "type": "drag",
   "scene": "s05",
   "len": 1.5,
   "from": 1.08,
   "to": 1,
   "kind": "turn",
   "t": 23
  },
  {
   "b": 46.25,
   "type": "tick",
   "scene": "s05",
   "i": 18,
   "t": 23.125
  },
  {
   "b": 46.5,
   "type": "tick",
   "scene": "s05",
   "i": 19,
   "t": 23.25
  },
  {
   "b": 46.75,
   "type": "tick",
   "scene": "s05",
   "i": 20,
   "t": 23.375
  },
  {
   "b": 47,
   "type": "tick",
   "scene": "s05",
   "i": 21,
   "t": 23.5
  },
  {
   "b": 47.25,
   "type": "tick",
   "scene": "s05",
   "i": 22,
   "t": 23.625
  },
  {
   "b": 47.5,
   "type": "tick",
   "scene": "s05",
   "i": 23,
   "t": 23.75
  },
  {
   "b": 47.5,
   "type": "hover",
   "scene": "s05",
   "t": 23.75
  },
  {
   "b": 47.75,
   "type": "gap",
   "scene": "s05",
   "t": 23.875
  },
  {
   "b": 48,
   "type": "flip",
   "scene": "s05",
   "to": "on",
   "v": 1,
   "D": 0.26,
   "lock": true,
   "drop": 1,
   "t": 24
  },
  {
   "b": 50,
   "type": "cut",
   "scene": "s05",
   "t": 25
  },
  {
   "b": 50,
   "type": "impact",
   "scene": "s06",
   "t": 25
  },
  {
   "b": 50.5,
   "type": "pour",
   "scene": "s06",
   "len": 5.5,
   "t": 25.25
  },
  {
   "b": 53,
   "type": "pause",
   "scene": "s06",
   "len": 0.5,
   "t": 26.5
  },
  {
   "b": 56,
   "type": "flip",
   "scene": "s06",
   "to": "on",
   "v": 1,
   "D": 0.26,
   "close": true,
   "t": 28
  },
  {
   "b": 58,
   "type": "cut",
   "scene": "s06",
   "t": 29
  },
  {
   "b": 58,
   "type": "impact",
   "scene": "s07",
   "t": 29
  },
  {
   "b": 59,
   "type": "pull",
   "scene": "s07",
   "card": 3,
   "t": 29.5
  },
  {
   "b": 59,
   "type": "flip",
   "scene": "s07",
   "to": "on",
   "v": 0.5,
   "D": 0.26,
   "card": 3,
   "t": 29.5
  },
  {
   "b": 60,
   "type": "pull",
   "scene": "s07",
   "card": 5,
   "t": 30
  },
  {
   "b": 60,
   "type": "flip",
   "scene": "s07",
   "to": "on",
   "v": 1,
   "D": 0.26,
   "card": 5,
   "t": 30
  },
  {
   "b": 61.5,
   "type": "pull",
   "scene": "s07",
   "card": 2,
   "t": 30.75
  },
  {
   "b": 61.5,
   "type": "flip",
   "scene": "s07",
   "to": "on",
   "v": 0.25,
   "D": 0.26,
   "card": 2,
   "t": 30.75
  },
  {
   "b": 64,
   "type": "cut",
   "scene": "s07",
   "t": 32
  },
  {
   "b": 64,
   "type": "impact",
   "scene": "s08",
   "t": 32
  },
  {
   "b": 65,
   "type": "touch",
   "scene": "s08",
   "t": 32.5
  },
  {
   "b": 65,
   "type": "drag",
   "scene": "s08",
   "len": 3,
   "from": 0,
   "to": 1,
   "t": 32.5
  },
  {
   "b": 68,
   "type": "flip",
   "scene": "s08",
   "to": "on",
   "v": 0.5,
   "D": 0.26,
   "chip": 1,
   "t": 34
  },
  {
   "b": 68.3,
   "type": "caption",
   "scene": "s08",
   "n": 1,
   "t": 34.15
  },
  {
   "b": 69.3,
   "type": "tray",
   "scene": "s08",
   "n": 1,
   "t": 34.65
  },
  {
   "b": 70,
   "type": "touch",
   "scene": "s08",
   "t": 35
  },
  {
   "b": 70,
   "type": "drag",
   "scene": "s08",
   "len": 2,
   "from": 0,
   "to": 1,
   "t": 35
  },
  {
   "b": 72,
   "type": "flip",
   "scene": "s08",
   "to": "on",
   "v": 1,
   "D": 0.26,
   "chip": 2,
   "t": 36
  },
  {
   "b": 72.3,
   "type": "caption",
   "scene": "s08",
   "n": 2,
   "t": 36.15
  },
  {
   "b": 73.3,
   "type": "tray",
   "scene": "s08",
   "n": 2,
   "t": 36.65
  },
  {
   "b": 74,
   "type": "cut",
   "scene": "s08",
   "t": 37
  },
  {
   "b": 74,
   "type": "impact",
   "scene": "s09",
   "t": 37
  },
  {
   "b": 76,
   "type": "touch",
   "scene": "s09",
   "t": 38
  },
  {
   "b": 76,
   "type": "pull",
   "scene": "s09",
   "len": 3.5,
   "kind": "drag",
   "t": 38
  },
  {
   "b": 79.75,
   "type": "release",
   "scene": "s09",
   "t": 39.875
  },
  {
   "b": 80,
   "type": "flip",
   "scene": "s09",
   "to": "on",
   "v": 1,
   "D": 0.7,
   "roll": true,
   "soft": true,
   "t": 40
  },
  {
   "b": 81.5,
   "type": "flap",
   "scene": "s09",
   "t": 40.75
  },
  {
   "b": 84,
   "type": "cut",
   "scene": "s09",
   "t": 42
  },
  {
   "b": 84,
   "type": "impact",
   "scene": "s10",
   "t": 42
  },
  {
   "b": 85,
   "type": "gust",
   "scene": "s10",
   "len": 0.5,
   "t": 42.5
  },
  {
   "b": 85,
   "type": "spin",
   "scene": "s10",
   "len": 2,
   "from": 0,
   "to": 2,
   "t": 42.5
  },
  {
   "b": 86,
   "type": "release",
   "scene": "s10",
   "len": 5,
   "t": 43
  },
  {
   "b": 88,
   "type": "hero",
   "scene": "s10",
   "t": 44
  },
  {
   "b": 92,
   "type": "spindown",
   "scene": "s10",
   "len": 1,
   "t": 46
  },
  {
   "b": 92,
   "type": "flip",
   "scene": "s10",
   "to": "on",
   "v": 1,
   "D": 0.7,
   "loaded": true,
   "soft": true,
   "t": 46
  },
  {
   "b": 93,
   "type": "stop",
   "scene": "s10",
   "t": 46.5
  },
  {
   "b": 96,
   "type": "cut",
   "scene": "s10",
   "t": 48
  },
  {
   "b": 96,
   "type": "impact",
   "scene": "s11",
   "crash": true,
   "t": 48
  },
  {
   "b": 96.5,
   "type": "touch",
   "scene": "s11",
   "t": 48.25
  },
  {
   "b": 97,
   "type": "flip",
   "scene": "s11",
   "to": "on",
   "v": 1,
   "D": 0.26,
   "rate": 5,
   "t": 48.5
  },
  {
   "b": 97,
   "type": "fly",
   "scene": "s11",
   "n": 1,
   "hero": false,
   "t": 48.5
  },
  {
   "b": 97.5,
   "type": "fly",
   "scene": "s11",
   "n": 2,
   "hero": false,
   "t": 48.75
  },
  {
   "b": 98,
   "type": "fly",
   "scene": "s11",
   "n": 3,
   "hero": false,
   "t": 49
  },
  {
   "b": 98.5,
   "type": "fly",
   "scene": "s11",
   "n": 4,
   "hero": false,
   "t": 49.25
  },
  {
   "b": 100,
   "type": "fly",
   "scene": "s11",
   "n": 5,
   "hero": true,
   "t": 50
  },
  {
   "b": 102,
   "type": "perch",
   "scene": "s11",
   "t": 51
  },
  {
   "b": 104,
   "type": "cut",
   "scene": "s11",
   "t": 52
  },
  {
   "b": 104,
   "type": "impact",
   "scene": "s12",
   "t": 52
  },
  {
   "b": 105,
   "type": "drag",
   "scene": "s12",
   "len": 2,
   "from": 0,
   "to": 1,
   "t": 52.5
  },
  {
   "b": 107,
   "type": "lid",
   "scene": "s12",
   "t": 53.5
  },
  {
   "b": 107.5,
   "type": "in",
   "scene": "s12",
   "t": 53.75
  },
  {
   "b": 108,
   "type": "clank",
   "scene": "s12",
   "t": 54
  },
  {
   "b": 108,
   "type": "flip",
   "scene": "s12",
   "to": "on",
   "v": 0.5,
   "D": 0.26,
   "t": 54
  },
  {
   "b": 109,
   "type": "receipt",
   "scene": "s12",
   "t": 54.5
  },
  {
   "b": 110.5,
   "type": "seal",
   "scene": "s12",
   "t": 55.25
  },
  {
   "b": 110.5,
   "type": "flip",
   "scene": "s12",
   "to": "on",
   "v": 1,
   "D": 0.26,
   "seal": true,
   "t": 55.25
  },
  {
   "b": 112,
   "type": "cut",
   "scene": "s12",
   "t": 56
  },
  {
   "b": 112,
   "type": "show",
   "scene": "final",
   "id": "s02",
   "i": 0,
   "t": 56
  },
  {
   "b": 113,
   "type": "show",
   "scene": "final",
   "id": "s04",
   "i": 1,
   "t": 56.5
  },
  {
   "b": 114,
   "type": "show",
   "scene": "final",
   "id": "s08",
   "i": 2,
   "t": 57
  },
  {
   "b": 115,
   "type": "riser",
   "scene": "final",
   "len": 1,
   "t": 57.5
  },
  {
   "b": 116,
   "type": "final",
   "scene": "final",
   "big": true,
   "t": 58
  },
  {
   "b": 116,
   "type": "title",
   "scene": "final",
   "len": 0.6,
   "t": 58
  },
  {
   "b": 116.5,
   "type": "subtitle",
   "scene": "final",
   "t": 58.25
  },
  {
   "b": 119,
   "type": "bell",
   "scene": "final",
   "t": 59.5
  },
  {
   "b": 120,
   "type": "end",
   "scene": "final",
   "t": 60
  }
 ]
};