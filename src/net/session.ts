import { create } from "zustand";
import { useGameStore } from "@/game/store";
import type { Song } from "@/game/types";
import { applyPlayerIntent } from "./intents";
import { type Presence, toPublicState } from "./publicState";
import { createTransport, type Transport } from "./transport";
import {
  type Intent,
  type LobbyState,
  MAX_PLAYERS,
  type Message,
  type PublicState,
  type RejectReason,
} from "./types";

type Seat = {
  id: number;
  name: string;
  /** null = speelt op het tafelscherm zelf. */
  clientId: string | null;
  lastSeen: number;
};

type Role = "none" | "host" | "controller";
type Status = "idle" | "connecting" | "connected" | "lost" | "error";

type SessionState = {
  role: Role;
  status: Status;
  error: string | null;
  transportKind: Transport["kind"] | null;
  code: string;
  clientId: string;
  // Host
  seats: Seat[];
  target: number;
  tokensEnabled: boolean;
  started: boolean;
  // Telefoon
  myPlayerId: number | null;
  lobby: LobbyState | null;
  remote: PublicState | null;

  startHost: () => Promise<void>;
  addLocalPlayer: (name: string) => void;
  removeSeat: (id: number) => void;
  setSettings: (target: number, tokensEnabled: boolean) => void;
  startHostedGame: (songs?: Song[], preShuffled?: boolean) => void;
  join: (code: string, name: string) => Promise<void>;
  sendIntent: (intent: Intent) => void;
  leave: () => void;
};

const CODE_LETTERS = "ABCDEFGHJKMNPQRSTUVWXYZ"; // zonder I, L, O: lastig te lezen
const BEAT_MS = 4000;
const HOST_TICK_MS = 3000;
const OFFLINE_AFTER_MS = 12000;
const HOST_SILENT_MS = 15000;
const CLIENT_KEY = "hitsterapp-client";

export function normalizeCode(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, 4);
}

function makeCode(): string {
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => CODE_LETTERS[b % CODE_LETTERS.length]).join(
    "",
  );
}

function getClientId(): string {
  try {
    const stored = window.sessionStorage.getItem(CLIENT_KEY);
    if (stored) return stored;
    const fresh = crypto.randomUUID();
    window.sessionStorage.setItem(CLIENT_KEY, fresh);
    return fresh;
  } catch {
    return crypto.randomUUID();
  }
}

// Verbindingen en timers leven buiten de store, zodat ze niet mee-renderen.
let transport: Transport | null = null;
let unsubTransport: (() => void) | null = null;
let unsubGame: (() => void) | null = null;
const timers: ReturnType<typeof setInterval>[] = [];
let lastHostMessage = 0;

function stopEverything() {
  for (const t of timers.splice(0)) clearInterval(t);
  unsubTransport?.();
  unsubGame?.();
  unsubTransport = null;
  unsubGame = null;
  transport?.close();
  transport = null;
}

export const useSession = create<SessionState>((set, get) => {
  function presence(): Presence[] {
    const now = Date.now();
    return get().seats.map((seat) => ({
      remote: seat.clientId !== null,
      connected:
        seat.clientId === null || now - seat.lastSeen < OFFLINE_AFTER_MS,
    }));
  }

  function lobbyState(): LobbyState {
    const { code, seats, target, tokensEnabled } = get();
    const info = presence();
    return {
      code,
      target,
      tokensEnabled,
      players: seats.map((seat, i) => ({
        id: seat.id,
        name: seat.name,
        remote: info[i].remote,
        connected: info[i].connected,
      })),
    };
  }

  function broadcastLobby() {
    transport?.send({ kind: "lobby", lobby: lobbyState() });
  }

  function broadcastState() {
    if (!transport) return;
    const game = useGameStore.getState();
    transport.send({ kind: "state", state: toPublicState(game, presence()) });
  }

  function reject(clientId: string, reason: RejectReason) {
    transport?.send({ kind: "rejected", clientId, reason });
  }

  function handleAsHost(message: Message) {
    const { seats, started } = get();
    if (message.kind === "join") {
      const existing = seats.find((s) => s.clientId === message.clientId);
      if (existing) {
        existing.lastSeen = Date.now();
        transport?.send({
          kind: "welcome",
          clientId: message.clientId,
          playerId: existing.id,
        });
        if (started) broadcastState();
        else broadcastLobby();
        return;
      }
      if (started) return reject(message.clientId, "started");
      if (seats.length >= MAX_PLAYERS) return reject(message.clientId, "full");
      const taken = seats.some(
        (s) => s.name.toLowerCase() === message.name.trim().toLowerCase(),
      );
      if (taken || !message.name.trim())
        return reject(message.clientId, "name");
      const seat: Seat = {
        id: seats.length,
        name: message.name.trim().slice(0, 16),
        clientId: message.clientId,
        lastSeen: Date.now(),
      };
      set({ seats: [...seats, seat] });
      transport?.send({
        kind: "welcome",
        clientId: message.clientId,
        playerId: seat.id,
      });
      broadcastLobby();
    } else if (message.kind === "beat") {
      const seat = seats.find((s) => s.clientId === message.clientId);
      if (seat) seat.lastSeen = Date.now();
    } else if (message.kind === "intent") {
      const seat = seats.find((s) => s.clientId === message.clientId);
      if (!seat || !started) return;
      seat.lastSeen = Date.now();
      applyPlayerIntent(seat.id, message.intent);
    }
  }

  function handleAsController(message: Message) {
    const { clientId } = get();
    if (message.kind === "welcome" && message.clientId === clientId) {
      lastHostMessage = Date.now();
      set({ myPlayerId: message.playerId, status: "connected", error: null });
    } else if (message.kind === "rejected" && message.clientId === clientId) {
      const text: Record<RejectReason, string> = {
        full: "Dit spel zit vol.",
        started: "Dit spel is al begonnen.",
        name: "Deze naam is al in gebruik. Kies een andere.",
      };
      stopEverything();
      set({ role: "none", status: "error", error: text[message.reason] });
    } else if (message.kind === "lobby") {
      lastHostMessage = Date.now();
      set({ lobby: message.lobby, status: "connected" });
    } else if (message.kind === "state") {
      lastHostMessage = Date.now();
      set({ remote: message.state, status: "connected" });
    } else if (message.kind === "closed") {
      stopEverything();
      set({
        role: "none",
        status: "error",
        error: "De host heeft het spel gestopt.",
        remote: null,
        lobby: null,
        myPlayerId: null,
      });
    }
  }

  return {
    role: "none",
    status: "idle",
    error: null,
    transportKind: null,
    code: "",
    clientId: "",
    seats: [],
    target: 5,
    tokensEnabled: true,
    started: false,
    myPlayerId: null,
    lobby: null,
    remote: null,

    startHost: async () => {
      stopEverything();
      const code = makeCode();
      set({
        role: "host",
        status: "connecting",
        error: null,
        code,
        clientId: getClientId(),
        seats: [],
        started: false,
        remote: null,
        lobby: null,
        myPlayerId: null,
      });
      try {
        transport = await createTransport(code);
      } catch (e) {
        set({
          role: "none",
          status: "error",
          error: e instanceof Error ? e.message : "Verbinden mislukt.",
        });
        return;
      }
      set({ status: "connected", transportKind: transport.kind });
      unsubTransport = transport.subscribe(handleAsHost);
      timers.push(
        setInterval(() => {
          if (get().started) broadcastState();
          else broadcastLobby();
        }, HOST_TICK_MS),
      );
    },

    addLocalPlayer: (name) => {
      const { seats, started } = get();
      const clean = name.trim().slice(0, 16);
      if (started || !clean || seats.length >= MAX_PLAYERS) return;
      if (seats.some((s) => s.name.toLowerCase() === clean.toLowerCase()))
        return;
      set({
        seats: [
          ...seats,
          {
            id: seats.length,
            name: clean,
            clientId: null,
            lastSeen: Date.now(),
          },
        ],
      });
      broadcastLobby();
    },

    removeSeat: (id) => {
      const { seats, started } = get();
      if (started) return;
      set({
        seats: seats
          .filter((s) => s.id !== id)
          .map((s, i) => ({ ...s, id: i })),
      });
      broadcastLobby();
    },

    setSettings: (target, tokensEnabled) => {
      set({ target, tokensEnabled });
      broadcastLobby();
    },

    startHostedGame: (songs, preShuffled) => {
      const { seats, target, tokensEnabled, started } = get();
      if (started || seats.length < 2) return;
      useGameStore.getState().start(
        seats.map((s) => s.name),
        target,
        tokensEnabled,
        songs,
        preShuffled,
      );
      set({ started: true });
      unsubGame?.();
      unsubGame = useGameStore.subscribe(broadcastState);
      broadcastState();
    },

    join: async (rawCode, name) => {
      stopEverything();
      const code = normalizeCode(rawCode);
      const clientId = getClientId();
      set({
        role: "controller",
        status: "connecting",
        error: null,
        code,
        clientId,
        myPlayerId: null,
        lobby: null,
        remote: null,
      });
      try {
        transport = await createTransport(code);
      } catch (e) {
        set({
          role: "none",
          status: "error",
          error: e instanceof Error ? e.message : "Verbinden mislukt.",
        });
        return;
      }
      set({ transportKind: transport.kind });
      lastHostMessage = Date.now();
      unsubTransport = transport.subscribe(handleAsController);
      const sendJoin = () => transport?.send({ kind: "join", clientId, name });
      sendJoin();
      timers.push(
        // Blijf aanmelden tot de host antwoordt, en opnieuw als de verbinding wegviel.
        setInterval(() => {
          const { myPlayerId, status } = get();
          if (myPlayerId === null || status === "lost") sendJoin();
        }, 2000),
        setInterval(() => {
          const { myPlayerId } = get();
          if (myPlayerId !== null) transport?.send({ kind: "beat", clientId });
          if (
            myPlayerId !== null &&
            Date.now() - lastHostMessage > HOST_SILENT_MS
          ) {
            set({ status: "lost" });
          }
        }, BEAT_MS),
      );
      // Geen antwoord van de host: duidelijke melding in plaats van eindeloos wachten.
      setTimeout(() => {
        const s = get();
        if (
          s.role === "controller" &&
          s.myPlayerId === null &&
          s.status === "connecting"
        ) {
          stopEverything();
          set({
            role: "none",
            status: "error",
            error:
              "Geen spel gevonden met deze code. Controleer de code en of het scherm van de host nog open staat.",
          });
        }
      }, 10000);
    },

    sendIntent: (intent) => {
      const { clientId } = get();
      transport?.send({ kind: "intent", clientId, intent });
    },

    leave: () => {
      const { role } = get();
      if (role === "host") {
        transport?.send({ kind: "closed" });
        useGameStore.getState().reset();
      }
      stopEverything();
      set({
        role: "none",
        status: "idle",
        error: null,
        seats: [],
        started: false,
        myPlayerId: null,
        lobby: null,
        remote: null,
        transportKind: null,
      });
    },
  };
});
