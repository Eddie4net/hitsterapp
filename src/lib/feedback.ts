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

function tone(
  freq: number,
  start: number,
  length: number,
  type: OscillatorType,
) {
  if (!audio) return;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  const t0 = audio.currentTime + start;
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(0.18, t0 + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + length);
  osc.connect(gain).connect(audio.destination);
  osc.start(t0);
  osc.stop(t0 + length + 0.05);
}

function vibrate(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    // Niet elk apparaat kan trillen.
  }
}

type Cue = "correct" | "wrong" | "steal" | "win";

export function playCue(cue: Cue) {
  if (!useSound.getState().on) return;
  try {
    audio ??= new AudioContext();
    if (audio.state === "suspended") void audio.resume();
  } catch {
    return;
  }
  if (cue === "correct") {
    tone(523, 0, 0.18, "triangle");
    tone(784, 0.14, 0.3, "triangle");
    vibrate(40);
  } else if (cue === "wrong") {
    tone(180, 0, 0.35, "sawtooth");
    tone(140, 0.18, 0.4, "sawtooth");
    vibrate([80, 60, 80]);
  } else if (cue === "steal") {
    tone(660, 0, 0.1, "square");
    tone(880, 0.1, 0.18, "square");
    vibrate(30);
  } else {
    for (const [i, freq] of [523, 659, 784, 1047].entries()) {
      tone(freq, i * 0.15, 0.35, "triangle");
    }
    vibrate([60, 40, 60, 40, 120]);
  }
}
