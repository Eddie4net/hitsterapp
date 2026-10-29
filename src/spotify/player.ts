import { create } from "zustand";
import { useSound } from "@/lib/feedback";
import { getAccessToken } from "./auth";
import { isMock } from "./config";

/**
 * Afspelen via de Spotify Web Playback SDK: dit apparaat (het tafelscherm) wordt zelf
 * een Spotify-speler. Daarvoor is Premium nodig, en het werkt niet op elke browser
 * (op een iPhone bijvoorbeeld niet betrouwbaar).
 */

type SdkPlayer = {
  connect: () => Promise<boolean>;
  disconnect: () => void;
  addListener: (event: string, callback: (payload: unknown) => void) => void;
  activateElement: () => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  seek: (ms: number) => Promise<void>;
  setVolume: (volume: number) => Promise<void>;
};

declare global {
  interface Window {
    Spotify?: {
      Player: new (options: {
        name: string;
        getOAuthToken: (cb: (token: string) => void) => void;
        volume?: number;
      }) => SdkPlayer;
    };
    onSpotifyWebPlaybackSDKReady?: () => void;
  }
}

type PlayerState = {
  status: "idle" | "connecting" | "ready" | "error";
  error: string | null;
  playing: boolean;
  trackUri: string | null;
};

export const usePlayer = create<PlayerState>(() => ({
  status: "idle",
  error: null,
  playing: false,
  trackUri: null,
}));

const VOLUME = 0.8;
const currentVolume = () => (useSound.getState().on ? VOLUME : 0);

let player: SdkPlayer | null = null;
let muteWatched = false;

/** De geluidsknop dempt ook de muziek: het volume van de Spotify-speler volgt hem. */
function watchMute() {
  if (muteWatched) return;
  muteWatched = true;
  useSound.subscribe(() => {
    void player?.setVolume(currentVolume()).catch(() => undefined);
  });
}
let deviceId: string | null = null;
let sdkPromise: Promise<void> | null = null;

function loadSdk(): Promise<void> {
  if (window.Spotify) return Promise.resolve();
  sdkPromise ??= new Promise<void>((resolve, reject) => {
    window.onSpotifyWebPlaybackSDKReady = () => resolve();
    const script = document.createElement("script");
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.async = true;
    script.onerror = () =>
      reject(
        new Error("De Spotify-speler kon niet laden. Staat een adblocker aan?"),
      );
    document.body.appendChild(script);
  });
  return sdkPromise;
}

const fail = (error: string) => usePlayer.setState({ status: "error", error });

/** Maakt dit apparaat een Spotify-speler. Roep dit aan na een klik, zodat de browser geluid toestaat. */
export async function connectPlayer(): Promise<boolean> {
  watchMute();
  if (isMock()) {
    usePlayer.setState({ status: "ready", error: null });
    return true;
  }
  if (usePlayer.getState().status === "ready" && player) return true;
  usePlayer.setState({ status: "connecting", error: null });
  try {
    await loadSdk();
  } catch (e) {
    fail(e instanceof Error ? e.message : "De Spotify-speler kon niet laden.");
    return false;
  }
  const Spotify = window.Spotify;
  if (!Spotify) {
    fail("De Spotify-speler is niet beschikbaar in deze browser.");
    return false;
  }

  return new Promise<boolean>((resolve) => {
    const sdk = new Spotify.Player({
      name: "Hitster",
      getOAuthToken: (cb) => {
        void getAccessToken().then((t) => cb(t ?? ""));
      },
      volume: currentVolume(),
    });
    player = sdk;
    const timer = setTimeout(() => {
      fail("Verbinden met Spotify duurde te lang. Probeer het opnieuw.");
      resolve(false);
    }, 15000);
    const done = (ok: boolean) => {
      clearTimeout(timer);
      resolve(ok);
    };
    sdk.addListener("ready", (payload) => {
      void sdk.setVolume(currentVolume()).catch(() => undefined);
      deviceId = (payload as { device_id: string }).device_id;
      usePlayer.setState({ status: "ready", error: null });
      done(true);
    });
    sdk.addListener("not_ready", () => {
      deviceId = null;
      usePlayer.setState({ status: "connecting" });
    });
    sdk.addListener("account_error", () => {
      fail("Afspelen in de browser vereist Spotify Premium.");
      done(false);
    });
    sdk.addListener("authentication_error", () => {
      fail("Inloggen bij Spotify is verlopen. Koppel Spotify opnieuw.");
      done(false);
    });
    sdk.addListener("initialization_error", () => {
      fail(
        "Deze browser ondersteunt de Spotify-speler niet. Gebruik Chrome of Edge op een laptop.",
      );
      done(false);
    });
    sdk.addListener("playback_error", (payload) => {
      const message = (payload as { message?: string }).message;
      usePlayer.setState({ error: message ?? "Afspelen is mislukt." });
    });
    sdk.addListener("player_state_changed", (payload) => {
      const state = payload as { paused?: boolean } | null;
      if (state) usePlayer.setState({ playing: !state.paused });
    });
    void sdk.activateElement().catch(() => undefined);
    void sdk.connect().then((ok) => {
      if (!ok) {
        fail("Verbinden met Spotify is mislukt.");
        done(false);
      }
    });
  });
}

/** Speelt een nummer af op dit apparaat, vanaf het begin. */
export async function playUri(uri: string): Promise<void> {
  usePlayer.setState({ trackUri: uri });
  if (isMock()) {
    usePlayer.setState({ status: "ready", playing: true, error: null });
    return;
  }
  if (usePlayer.getState().status !== "ready" || !deviceId) {
    if (!(await connectPlayer()) || !deviceId) return;
  }
  const token = await getAccessToken();
  if (!token)
    return fail("Inloggen bij Spotify is verlopen. Koppel Spotify opnieuw.");
  const response = await fetch(
    `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ uris: [uri], position_ms: 0 }),
    },
  );
  if (response.status === 403) {
    fail("Afspelen is niet toegestaan. Heb je Spotify Premium?");
  } else if (response.status === 404) {
    usePlayer.setState({ status: "idle" });
    fail("De Spotify-speler is niet meer verbonden. Tik op Opnieuw verbinden.");
  } else if (!response.ok && response.status !== 204) {
    usePlayer.setState({ error: "Het nummer kon niet worden afgespeeld." });
  } else {
    usePlayer.setState({ playing: true, error: null });
  }
}

export async function pausePlayback(): Promise<void> {
  if (isMock()) return void usePlayer.setState({ playing: false });
  await player?.pause().catch(() => undefined);
}

export async function resumePlayback(): Promise<void> {
  if (isMock()) return void usePlayer.setState({ playing: true });
  await player?.activateElement().catch(() => undefined);
  await player?.resume().catch(() => undefined);
}

export async function restartPlayback(): Promise<void> {
  if (isMock()) return void usePlayer.setState({ playing: true });
  await player?.activateElement().catch(() => undefined);
  await player?.seek(0).catch(() => undefined);
  await player?.resume().catch(() => undefined);
}

export function disconnectPlayer(): void {
  player?.disconnect();
  player = null;
  deviceId = null;
  usePlayer.setState({
    status: "idle",
    playing: false,
    trackUri: null,
    error: null,
  });
}
