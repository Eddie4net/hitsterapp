"use client";

import {
  ArrowLeft,
  Check,
  Copy,
  MonitorSmartphone,
  Smartphone,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { START_TOKENS } from "@/game/rules";
import { playerColor } from "@/lib/players";
import { useSession } from "@/net/session";
import { hasRealtimeServer } from "@/net/transport";
import { MAX_PLAYERS } from "@/net/types";
import {
  Choice,
  FieldLabel,
  PRIMARY_BUTTON,
  Screen,
  SECONDARY_BUTTON,
} from "./Screen";
import { TARGET_OPTIONS } from "./Setup";

function useJoinUrl(code: string) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    if (code) setUrl(`${window.location.origin}/?join=${code}`);
  }, [code]);
  return url;
}

function QrCode({ url }: { url: string }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    if (!url) return;
    let cancelled = false;
    void import("qrcode").then((QRCode) =>
      QRCode.toDataURL(url, {
        margin: 1,
        width: 240,
        errorCorrectionLevel: "M",
      }).then((data) => {
        if (!cancelled) setSrc(data);
      }),
    );
    return () => {
      cancelled = true;
    };
  }, [url]);
  if (!src)
    return <div className="size-40 rounded-xl bg-white/10" aria-hidden />;
  return (
    // biome-ignore lint/performance/noImgElement: data-URL van de QR-code, geen optimalisatie nodig
    <img
      src={src}
      alt="QR-code om mee te doen"
      className="size-40 rounded-xl bg-white p-1"
    />
  );
}

/** Wachtkamer van het tafelscherm: code, QR, wie er al zijn en de instellingen. */
export function HostLobby() {
  const {
    code,
    status,
    transportKind,
    seats,
    target,
    tokensEnabled,
    setSettings,
    addLocalPlayer,
    removeSeat,
    startHostedGame,
    leave,
  } = useSession();
  const url = useJoinUrl(code);
  const [localName, setLocalName] = useState("");
  const [copied, setCopied] = useState(false);
  const isLocalhost =
    typeof window !== "undefined" &&
    ["localhost", "127.0.0.1", "[::1]"].includes(window.location.hostname);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Kopiëren kan geblokkeerd zijn; de link staat ook gewoon in beeld.
    }
  }

  const now = Date.now();
  return (
    <Screen wide>
      <button
        type="button"
        onClick={leave}
        className="mb-4 inline-flex min-h-11 items-center gap-2 text-sm text-white/80 hover:text-white"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Stoppen
      </button>

      {status === "connecting" ? (
        <output className="block text-white/80">Spel aanmaken…</output>
      ) : (
        <div className="grid gap-6 md:grid-cols-[auto_1fr]">
          <div className="flex flex-col items-center gap-3">
            <QrCode url={url} />
            <div className="text-center">
              <p className="text-sm text-white/70">Spelcode</p>
              <p className="text-5xl font-black tracking-[0.2em] text-gold">
                <span className="sr-only">{code.split("").join(" ")}</span>
                <span aria-hidden>{code}</span>
              </p>
            </div>
            <button type="button" onClick={copy} className={SECONDARY_BUTTON}>
              {copied ? (
                <Check className="mr-2 inline size-4" aria-hidden />
              ) : (
                <Copy className="mr-2 inline size-4" aria-hidden />
              )}
              {copied ? "Gekopieerd" : "Kopieer de link"}
            </button>
          </div>

          <div className="space-y-5">
            <div>
              <FieldLabel>
                Spelers ({seats.length}/{MAX_PLAYERS})
              </FieldLabel>
              {seats.length === 0 ? (
                <p className="rounded-xl bg-white/5 p-4 text-sm text-white/75">
                  Nog niemand. Scan de QR-code met je telefoon of ga naar de
                  link en voer de code in.
                </p>
              ) : (
                <ul className="space-y-2">
                  {seats.map((seat) => {
                    const online =
                      seat.clientId === null || now - seat.lastSeen < 12000;
                    return (
                      <li
                        key={seat.id}
                        className="flex items-center gap-3 rounded-xl bg-white/5 px-4 py-2"
                      >
                        <span
                          aria-hidden
                          className="size-3 rounded-full"
                          style={{ background: playerColor(seat.id) }}
                        />
                        <span className="flex-1 font-semibold">
                          {seat.name}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-white/70">
                          {seat.clientId === null ? (
                            <>
                              <MonitorSmartphone
                                className="size-4"
                                aria-hidden
                              />
                              dit scherm
                            </>
                          ) : (
                            <>
                              <Smartphone className="size-4" aria-hidden />
                              {online ? "telefoon" : "telefoon (offline)"}
                            </>
                          )}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeSeat(seat.id)}
                          aria-label={`${seat.name} verwijderen`}
                          className="flex size-9 items-center justify-center rounded-lg text-white/70 hover:bg-white/10"
                        >
                          <X className="size-4" aria-hidden />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}

              {seats.length < MAX_PLAYERS ? (
                <form
                  className="mt-3 flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    addLocalPlayer(localName);
                    setLocalName("");
                  }}
                >
                  <label className="sr-only" htmlFor="local-name">
                    Naam van een speler zonder telefoon
                  </label>
                  <input
                    id="local-name"
                    value={localName}
                    onChange={(e) => setLocalName(e.target.value)}
                    maxLength={16}
                    placeholder="Speler zonder telefoon"
                    autoComplete="off"
                    className="min-h-11 flex-1 rounded-xl border border-white/25 bg-white/5 px-4 text-white placeholder:text-white/50"
                  />
                  <button type="submit" className={SECONDARY_BUTTON}>
                    Toevoegen
                  </button>
                </form>
              ) : null}
            </div>

            <fieldset>
              <legend>
                <FieldLabel>Spelduur en tokens</FieldLabel>
              </legend>
              <div className="flex flex-wrap gap-2">
                {TARGET_OPTIONS.map((o) => (
                  <Choice
                    key={o.value}
                    selected={target === o.value}
                    onClick={() => setSettings(o.value, tokensEnabled)}
                  >
                    {o.label}
                    <span className="block text-sm font-normal opacity-80">
                      {o.hint}
                    </span>
                  </Choice>
                ))}
                <Choice
                  selected={tokensEnabled}
                  onClick={() => setSettings(target, !tokensEnabled)}
                >
                  {tokensEnabled ? "Met tokens" : "Zonder tokens"}
                  <span className="block text-sm font-normal opacity-80">
                    {tokensEnabled
                      ? `${START_TOKENS} per speler`
                      : "Tik om aan te zetten"}
                  </span>
                </Choice>
              </div>
            </fieldset>

            <button
              type="button"
              onClick={startHostedGame}
              disabled={seats.length < 2}
              className={PRIMARY_BUTTON}
            >
              {seats.length < 2 ? "Minimaal 2 spelers nodig" : "Start het spel"}
            </button>
          </div>
        </div>
      )}

      {isLocalhost ? (
        <p className="mt-5 rounded-xl bg-amber-950/70 px-4 py-3 text-sm text-amber-100">
          Je opent dit via <strong>localhost</strong>. Telefoons kunnen dat
          adres niet bereiken. Open de app via de Vercel-link om met telefoons
          te spelen.
        </p>
      ) : null}
      {transportKind === "local" || !hasRealtimeServer() ? (
        <p className="mt-3 rounded-xl bg-white/5 px-4 py-3 text-sm text-white/80">
          <strong>Testmodus:</strong> er is nog geen spelserver gekoppeld
          (Supabase). Meedoen werkt nu alleen tussen tabbladen in deze browser.
        </p>
      ) : null}
      <p className="mt-3 text-sm text-white/60">
        De muziek speelt straks op dit scherm, zodat iedereen hem tegelijk
        hoort.
      </p>
    </Screen>
  );
}
