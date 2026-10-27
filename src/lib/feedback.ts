import { create } from "zustand";

const STORAGE_KEY = "hitsterapp-sound";

function readStored(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== "off";
  } catch {
    return true;
  }
}

/** Geluid en trillen aan/uit, onthouden in de browser. */
export const useSound = create<{ on: boolean; toggle: () => void }>(
  (set, get) => ({
    on: true,
    toggle: () => {
      const on = !get().on;
      set({ on });
      try {
        window.localStorage.setItem(STORAGE_KEY, on ? "on" : "off");
      } catch {
        // Opslaan mislukt (bijvoorbeeld privévenster): de instelling geldt dan alleen nu.
      }
    },
  }),
);

/** Lees de opgeslagen keuze pas in de browser, zodat server en browser gelijk starten. */
export function loadSoundSetting() {
  useSound.setState({ on: readStored() });
}

let audio: AudioContext | null = null;
let noiseBuffer: AudioBuffer | null = null;

function tone(
  freq: number,
  start: number,
  length: number,
  type: OscillatorType,
  volume = 0.18,
) {
  if (!audio) return;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  const t0 = audio.currentTime + start;
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(volume, t0 + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + length);
  osc.connect(gain).connect(audio.destination);
  osc.start(t0);
  osc.stop(t0 + length + 0.05);
}

/** Gefilterde ruis: klinkt als papier, kaartjes die schuiven of een tik op hout. */
function noise(
  start: number,
  length: number,
  filterFreq: number,
  volume = 0.25,
  q = 0.9,
) {
  if (!audio) return;
  if (!noiseBuffer) {
    noiseBuffer = audio.createBuffer(1, audio.sampleRate, audio.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  const src = audio.createBufferSource();
  const filter = audio.createBiquadFilter();
  const gain = audio.createGain();
  const t0 = audio.currentTime + start;
  src.buffer = noiseBuffer;
  filter.type = "bandpass";
  filter.frequency.value = filterFreq;
  filter.Q.value = q;
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(volume, t0 + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + length);
  src.connect(filter).connect(gain).connect(audio.destination);
  src.start(t0);
  src.stop(t0 + length + 0.05);
}

function vibrate(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    // Niet elk apparaat kan trillen.
  }
}

export type Cue =
  | "correct"
  | "wrong"
  | "steal"
  | "win"
  | "flip"
  | "place"
  | "shuffle"
  | "coin"
  | "hitster";

export function playCue(cue: Cue) {
  if (!useSound.getState().on) return;
  try {
    audio ??= new AudioContext();
    if (audio.state === "suspended") void audio.resume();
  } catch {
    return;
  }
  switch (cue) {
    case "flip":
      noise(0, 0.12, 3200, 0.22);
      noise(0.07, 0.1, 5200, 0.12);
      break;
    case "place":
      noise(0, 0.08, 900, 0.3, 1.4);
      tone(120, 0, 0.1, "sine", 0.2);
      vibrate(15);
      break;
    case "shuffle":
      for (let i = 0; i < 9; i++)
        noise(i * 0.09, 0.08, 2600 + (i % 3) * 700, 0.14);
      break;
    case "coin":
      tone(1318, 0, 0.12, "triangle", 0.12);
      tone(1760, 0.07, 0.35, "triangle", 0.1);
      break;
    case "hitster":
      tone(220, 0, 0.18, "sawtooth", 0.14);
      tone(330, 0.12, 0.18, "sawtooth", 0.14);
      tone(660, 0.24, 0.4, "square", 0.12);
      vibrate([40, 30, 80]);
      break;
    case "correct":
      tone(523, 0, 0.18, "triangle");
      tone(784, 0.14, 0.3, "triangle");
      vibrate(40);
      break;
    case "wrong":
      tone(180, 0, 0.35, "sawtooth");
      tone(140, 0.18, 0.4, "sawtooth");
      vibrate([80, 60, 80]);
      break;
    case "steal":
      tone(660, 0, 0.1, "square");
      tone(880, 0.1, 0.18, "square");
      vibrate(30);
      break;
    case "win":
      for (const [i, freq] of [523, 659, 784, 1047].entries()) {
        tone(freq, i * 0.15, 0.35, "triangle");
      }
      vibrate([60, 40, 60, 40, 120]);
      break;
  }
}
