"use client";

import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { playerColor } from "@/lib/players";
import { normalizeCode, useSession } from "@/net/session";
import { hasRealtimeServer } from "@/net/transport";
import { FieldLabel, PRIMARY_BUTTON, Screen, SECONDARY_BUTTON } from "./Screen";

const JOIN_NAME_KEY = "hitsterapp-join-name";

/** Op je telefoon: voer de code in en kies je naam. */
export function JoinScreen({
  initialCode,
  onBack,
}: {
  initialCode: string;
  onBack: () => void;
}) {
  const { join, error, status } = useSession();
  const [code, setCode] = useState(initialCode);
  const [name, setName] = useState("");

  useEffect(() => {
    try {
      setName(window.localStorage.getItem(JOIN_NAME_KEY) ?? "");
    } catch {
      // Geen opgeslagen naam: je typt hem zelf.
    }
  }, []);

  const connecting = status === "connecting";
  const valid = normalizeCode(code).length === 4 && name.trim().length > 0;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    try {
      window.localStorage.setItem(JOIN_NAME_KEY, name.trim());
    } catch {
      // Niet erg als onthouden niet lukt.
    }
    void join(code, name.trim());
  }

  return (
    <Screen>
      <form onSubmit={submit} noValidate>
        <button
          type="button"
          onClick={onBack}
          className="mb-4 inline-flex min-h-11 items-center gap-2 text-sm text-white/80 hover:text-white"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Terug
        </button>

        {error ? (
          <p
            role="alert"
            className="mb-4 rounded-xl bg-red-950/80 px-4 py-3 text-sm font-semibold"
          >
            {error}
          </p>
        ) : null}

        <div className="mb-4">
          <label htmlFor="join-code">
            <FieldLabel>Spelcode</FieldLabel>
          </label>
          <input
            id="join-code"
            value={code}
            onChange={(e) => setCode(normalizeCode(e.target.value))}
            autoCapitalize="characters"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            maxLength={4}
            placeholder="ABCD"
            className="min-h-14 w-full rounded-xl border border-white/25 bg-white/5 px-4 text-center text-3xl font-black uppercase tracking-[0.4em] text-white placeholder:text-white/30"
          />
        </div>

        <div className="mb-6">
          <label htmlFor="join-name">
            <FieldLabel>Jouw naam</FieldLabel>
          </label>
          <input
            id="join-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={16}
            autoComplete="nickname"
            className="min-h-12 w-full rounded-xl border border-white/25 bg-white/5 px-4 text-white"
          />
        </div>

        <button
          type="submit"
          disabled={!valid || connecting}
          className={PRIMARY_BUTTON}
        >
          {connecting ? "Verbinden…" : "Meedoen"}
        </button>

        {!hasRealtimeServer() ? (
          <p className="mt-4 rounded-xl bg-white/5 px-4 py-3 text-sm text-white/80">
            <strong>Testmodus:</strong> er is nog geen spelserver gekoppeld.
            Meedoen werkt nu alleen als het tafelscherm in dezelfde browser open
            staat.
          </p>
        ) : null}
      </form>
    </Screen>
  );
}

/** Wachtkamer op je telefoon, tot de host het spel start. */
export function ControllerLobby() {
  const { lobby, myPlayerId, status, leave, code } = useSession();
  const me = lobby?.players.find((p) => p.id === myPlayerId);

  return (
    <Screen>
      <p className="text-sm text-white/70">Spelcode</p>
      <p className="mb-4 text-4xl font-black tracking-[0.25em] text-gold">
        {code}
      </p>

      {myPlayerId === null ? (
        <output className="block text-white/80">
          {status === "connecting"
            ? "Verbinden met het spel…"
            : "Wachten op het tafelscherm…"}
        </output>
      ) : (
        <>
          <output className="mb-4 block text-lg font-semibold">
            Je doet mee{me ? ` als ${me.name}` : ""}. Wachten tot de host het
            spel start…
          </output>
          {lobby ? (
            <ul className="space-y-2">
              {lobby.players.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center gap-3 rounded-xl bg-white/5 px-4 py-2"
                >
                  <span
                    aria-hidden
                    className="size-3 rounded-full"
                    style={{ background: playerColor(p.id) }}
                  />
                  <span className="flex-1 font-semibold">
                    {p.name}
                    {p.id === myPlayerId ? " (jij)" : ""}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
          {lobby ? (
            <p className="mt-4 text-sm text-white/70">
              {lobby.target} kaartjes om te winnen,{" "}
              {lobby.tokensEnabled ? "met" : "zonder"} tokens.
            </p>
          ) : null}
        </>
      )}

      <button
        type="button"
        onClick={leave}
        className={`${SECONDARY_BUTTON} mt-6 w-full`}
      >
        Verlaten
      </button>
    </Screen>
  );
}
