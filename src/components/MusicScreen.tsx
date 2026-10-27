"use client";

import {
  ArrowLeft,
  Check,
  Copy,
  ExternalLink,
  ListMusic,
  LogOut,
  Music2,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  getMe,
  getPlaylist,
  listMyPlaylists,
  type Me,
  type PlaylistSummary,
  parsePlaylistId,
} from "@/spotify/api";
import { forgetSpotify, isLoggedIn, logout, startLogin } from "@/spotify/auth";
import {
  clientIdFromEnv,
  getClientId,
  isMock,
  isValidClientId,
  redirectProblem,
  redirectUri,
  setClientId,
} from "@/spotify/config";
import { MIN_SONGS, useMusic } from "@/spotify/music";
import { FieldLabel, PRIMARY_BUTTON, Screen, SECONDARY_BUTTON } from "./Screen";

function CopyLine({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div>
      <p className="mb-1 text-xs text-white/65">{label}</p>
      <div className="flex items-center gap-2">
        <code className="min-w-0 flex-1 break-all rounded-lg bg-black/50 px-3 py-2 text-sm text-gold">
          {value}
        </code>
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(value);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            } catch {
              // Kopiëren geblokkeerd: de tekst staat ook gewoon in beeld.
            }
          }}
          aria-label={`Kopieer ${label}`}
          className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-white/25 hover:bg-white/10"
        >
          {copied ? (
            <Check className="size-4" aria-hidden />
          ) : (
            <Copy className="size-4" aria-hidden />
          )}
        </button>
      </div>
    </div>
  );
}

/** Welke adressen je in het Spotify-dashboard moet toevoegen, afgeleid van waar de app nu draait. */
function RedirectHelp() {
  const [uri, setUri] = useState("");
  const [problem, setProblem] = useState<string | null>(null);
  useEffect(() => {
    // Spotify weigert "localhost"; lokaal moet je 127.0.0.1 gebruiken.
    setUri(redirectUri().replace("//localhost", "//127.0.0.1"));
    setProblem(redirectProblem());
  }, []);
  const isLoopback = uri.startsWith("http://127.0.0.1");
  return (
    <div className="space-y-3 rounded-xl bg-white/5 p-4 text-sm">
      <p className="font-semibold">Voeg dit toe in het Spotify-dashboard</p>
      <ol className="list-decimal space-y-1 pl-5 text-white/85">
        <li>
          Ga naar{" "}
          <a
            href="https://developer.spotify.com/dashboard"
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-gold underline"
          >
            developer.spotify.com/dashboard
            <ExternalLink className="ml-1 inline size-3" aria-hidden />
          </a>{" "}
          en open je app, dan <strong>Settings</strong>.
        </li>
        <li>
          Plak bij <strong>Redirect URIs</strong> de onderstaande link en klik
          op <strong>Add</strong>, daarna op <strong>Save</strong>.
        </li>
        <li>
          Vink bij "Which API/SDKs are you planning to use?"{" "}
          <strong>Web API</strong> en <strong>Web Playback SDK</strong> aan.
        </li>
      </ol>
      {uri ? (
        <CopyLine label="Redirect URI voor dit adres" value={uri} />
      ) : null}
      {uri && !isLoopback ? (
        <CopyLine
          label="Alleen voor lokaal testen (optioneel)"
          value="http://127.0.0.1:3000/callback"
        />
      ) : null}
      {problem ? (
        <p
          role="alert"
          className="rounded-lg bg-amber-950/70 px-3 py-2 text-amber-100"
        >
          {problem}
        </p>
      ) : null}
      <p className="text-white/65">
        De link moet exact kloppen, zonder slash aan het eind. Zolang je app in
        ontwikkelmodus staat, moet de Spotify-account waarmee je inlogt bij{" "}
        <strong>Users management</strong> staan, en moet de eigenaar van de app
        Premium hebben.
      </p>
    </div>
  );
}

function ClientIdForm({ onSaved }: { onSaved: () => void }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        if (!isValidClientId(value)) {
          setError(
            "Een Client ID bestaat uit 32 letters en cijfers. Kopieer hem uit het dashboard.",
          );
          return;
        }
        setClientId(value);
        onSaved();
      }}
      className="space-y-3"
    >
      <div>
        <label htmlFor="client-id">
          <FieldLabel>Spotify Client ID</FieldLabel>
        </label>
        <input
          id="client-id"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError(null);
          }}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "client-id-error" : undefined}
          placeholder="bijvoorbeeld 3f2a…"
          className="min-h-12 w-full rounded-xl border border-white/25 bg-white/5 px-4 font-mono text-white placeholder:text-white/40"
        />
        {error ? (
          <p id="client-id-error" className="mt-1 text-sm text-red-300">
            {error}
          </p>
        ) : null}
        <p className="mt-1 text-xs text-white/60">
          Je Client ID staat in het dashboard bij je app. Het is geen geheim; de
          "Client secret" heb je niet nodig en moet je hier nooit invullen.
        </p>
      </div>
      <button type="submit" className={PRIMARY_BUTTON}>
        Opslaan
      </button>
    </form>
  );
}

function PlaylistRow({
  playlist,
  selected,
  onPick,
}: {
  playlist: PlaylistSummary;
  selected: boolean;
  onPick: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onPick}
        disabled={!playlist.readable}
        aria-pressed={selected}
        className={`flex w-full items-center gap-3 rounded-xl border p-2 text-left transition ${
          selected
            ? "border-gold bg-gold/15"
            : "border-white/15 bg-white/5 hover:bg-white/10"
        } disabled:cursor-not-allowed disabled:opacity-50`}
      >
        {playlist.imageUrl ? (
          // biome-ignore lint/performance/noImgElement: externe Spotify-afbeelding, geen optimalisatie nodig
          <img
            src={playlist.imageUrl}
            alt=""
            className="size-12 rounded-md object-cover"
          />
        ) : (
          <span className="flex size-12 items-center justify-center rounded-md bg-white/10">
            <ListMusic className="size-5" aria-hidden />
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold">{playlist.name}</span>
          <span className="block truncate text-xs text-white/70">
            {playlist.trackCount} nummers · {playlist.ownerName}
            {playlist.collaborative ? " · gezamenlijk" : ""}
          </span>
          {!playlist.readable ? (
            <span className="block text-xs text-amber-200">
              Niet van jou: Spotify geeft de nummers niet vrij in
              ontwikkelmodus.
            </span>
          ) : null}
        </span>
        {selected ? <Check className="size-5 text-gold" aria-hidden /> : null}
      </button>
    </li>
  );
}

function PlaylistPicker({ me }: { me: Me }) {
  const music = useMusic();
  const [playlists, setPlaylists] = useState<PlaylistSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [link, setLink] = useState("");
  const [linkError, setLinkError] = useState<string | null>(null);
  const [linkBusy, setLinkBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    listMyPlaylists(me.id)
      .then((list) => {
        if (!cancelled) setPlaylists(list);
      })
      .catch((e: unknown) => {
        if (!cancelled)
          setError(
            e instanceof Error ? e.message : "Je playlists ophalen is mislukt.",
          );
      });
    return () => {
      cancelled = true;
    };
  }, [me.id]);

  async function pasteLink(e: React.FormEvent) {
    e.preventDefault();
    setLinkError(null);
    const id = parsePlaylistId(link);
    if (!id) {
      setLinkError(
        "Dat lijkt geen Spotify-playlistlink. Kopieer de link via Delen, Playlistlink kopiëren.",
      );
      return;
    }
    setLinkBusy(true);
    try {
      const found = await getPlaylist(id, me.id);
      if (!found.readable) {
        setLinkError(
          "Deze playlist is niet van jou. Spotify staat het ophalen van de nummers in ontwikkelmodus alleen toe voor je eigen of gezamenlijke playlists. Kopieer de nummers naar een eigen playlist en plak die link.",
        );
        return;
      }
      await music.loadPlaylist({ id: found.id, name: found.name });
      setLink("");
    } catch (err) {
      setLinkError(
        err instanceof Error ? err.message : "De playlist ophalen is mislukt.",
      );
    } finally {
      setLinkBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <FieldLabel>Kies een playlist</FieldLabel>
        {error ? (
          <p
            role="alert"
            className="rounded-xl bg-red-950/80 px-4 py-3 text-sm font-semibold"
          >
            {error}
          </p>
        ) : playlists === null ? (
          <output className="block text-sm text-white/75">
            Je playlists ophalen…
          </output>
        ) : playlists.length === 0 ? (
          <p className="rounded-xl bg-white/5 p-4 text-sm text-white/80">
            Je hebt nog geen playlists. Maak er een in Spotify, of plak
            hieronder een link.
          </p>
        ) : (
          <ul className="max-h-72 space-y-2 overflow-y-auto pr-1">
            {playlists.map((p) => (
              <PlaylistRow
                key={p.id}
                playlist={p}
                selected={music.playlist?.id === p.id}
                onPick={() =>
                  void music.loadPlaylist({ id: p.id, name: p.name })
                }
              />
            ))}
          </ul>
        )}
      </div>

      <form onSubmit={pasteLink} noValidate>
        <label htmlFor="playlist-link">
          <FieldLabel>Of plak een playlistlink</FieldLabel>
        </label>
        <div className="flex gap-2">
          <input
            id="playlist-link"
            value={link}
            onChange={(e) => {
              setLink(e.target.value);
              setLinkError(null);
            }}
            autoComplete="off"
            spellCheck={false}
            placeholder="https://open.spotify.com/playlist/…"
            className="min-h-11 min-w-0 flex-1 rounded-xl border border-white/25 bg-white/5 px-4 text-white placeholder:text-white/40"
          />
          <button
            type="submit"
            disabled={!link.trim() || linkBusy}
            className={SECONDARY_BUTTON}
          >
            {linkBusy ? "Ophalen…" : "Gebruiken"}
          </button>
        </div>
        {linkError ? (
          <p role="alert" className="mt-2 text-sm text-red-300">
            {linkError}
          </p>
        ) : null}
      </form>
    </div>
  );
}

function Selection() {
  const { source, playlist, status, songs, progress, skipped, error } =
    useMusic();
  if (source === "sample") {
    return (
      <p className="rounded-xl bg-white/5 p-4 text-sm text-white/80">
        <strong>Nu gekozen:</strong> de voorbeeldnummers (zonder muziek).
      </p>
    );
  }
  return (
    <div className="rounded-xl bg-white/5 p-4 text-sm" aria-live="polite">
      <p className="font-semibold">
        <Music2 className="mr-2 inline size-4 text-gold" aria-hidden />
        {playlist?.name}
      </p>
      {status === "loading" ? (
        <p className="mt-1 text-white/80">
          Nummers ophalen… {progress.loaded}
          {progress.total ? ` van ${progress.total}` : ""}
        </p>
      ) : null}
      {status === "ready" ? (
        <p
          className={`mt-1 ${songs.length < MIN_SONGS ? "text-amber-200" : "text-white/80"}`}
        >
          {songs.length} bruikbare nummers
          {skipped > 0
            ? ` (${skipped} overgeslagen: lokale bestanden, dubbele of niet afspeelbare nummers)`
            : ""}
          .
          {songs.length < MIN_SONGS
            ? ` Dat zijn er te weinig: je hebt er minimaal ${MIN_SONGS} nodig.`
            : " De jaartallen worden bij de start gecontroleerd."}
        </p>
      ) : null}
      {status === "error" ? (
        <p role="alert" className="mt-1 text-red-300">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** Scherm om Spotify te koppelen en een playlist te kiezen. */
export function MusicScreen({
  onBack,
  notice,
}: {
  onBack: () => void;
  notice?: string | null;
}) {
  const [clientId, setClientIdState] = useState<string | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [me, setMe] = useState<Me | null>(null);
  const [meError, setMeError] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const chooseSample = useMusic((s) => s.chooseSample);
  const musicStatus = useMusic((s) => s.status);

  const refresh = useCallback(() => {
    setClientIdState(getClientId());
    setLoggedIn(isLoggedIn());
  }, []);
  useEffect(refresh, [refresh]);

  useEffect(() => {
    if (!loggedIn) {
      setMe(null);
      return;
    }
    let cancelled = false;
    getMe()
      .then((m) => {
        if (!cancelled) {
          setMe(m);
          setMeError(null);
        }
      })
      .catch((e: unknown) => {
        if (!cancelled)
          setMeError(
            e instanceof Error ? e.message : "Je account ophalen is mislukt.",
          );
      });
    return () => {
      cancelled = true;
    };
  }, [loggedIn]);

  return (
    <Screen wide>
      <button
        type="button"
        onClick={onBack}
        className="mb-4 inline-flex min-h-11 items-center gap-2 text-sm text-white/80 hover:text-white"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Klaar
      </button>

      <h2 className="mb-1 text-2xl font-black">Muziek</h2>
      <p className="mb-5 text-sm text-white/75">
        Speel met je eigen playlist uit Spotify. De muziek speelt op het scherm
        dat de tafel is (laptop of tablet), niet op de telefoons.
      </p>

      {notice ? (
        <output className="mb-4 block rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold">
          {notice}
        </output>
      ) : null}
      {isMock() ? (
        <p className="mb-4 rounded-xl bg-amber-950/70 px-4 py-2 text-xs text-amber-100">
          Testmodus: je ziet nep-playlists, er is niet echt met Spotify
          verbonden.
        </p>
      ) : null}

      <div className="space-y-5">
        {!clientId ? (
          <>
            <ClientIdForm onSaved={refresh} />
            <RedirectHelp />
          </>
        ) : !loggedIn ? (
          <>
            <p className="text-sm text-white/80">
              Client ID:{" "}
              <code className="text-gold">
                {clientId.slice(0, 6)}…{clientId.slice(-4)}
              </code>
              {clientIdFromEnv() ? " (vanuit de serverinstelling)" : ""}
            </p>
            {loginError ? (
              <p
                role="alert"
                className="rounded-xl bg-red-950/80 px-4 py-3 text-sm font-semibold"
              >
                {loginError}
              </p>
            ) : null}
            <button
              type="button"
              className={PRIMARY_BUTTON}
              onClick={() => {
                setLoginError(null);
                startLogin().catch((e: unknown) =>
                  setLoginError(
                    e instanceof Error ? e.message : "Inloggen mislukt.",
                  ),
                );
              }}
            >
              Verbinden met Spotify
            </button>
            <button
              type="button"
              onClick={() => setShowHelp((v) => !v)}
              aria-expanded={showHelp}
              className={`${SECONDARY_BUTTON} w-full`}
            >
              {showHelp
                ? "Verberg de redirect-uitleg"
                : "Welke redirect-link moet ik toevoegen?"}
            </button>
            {showHelp ? <RedirectHelp /> : null}
            {!clientIdFromEnv() ? (
              <button
                type="button"
                onClick={() => {
                  forgetSpotify();
                  refresh();
                }}
                className="text-sm text-white/70 underline"
              >
                Ander Client ID gebruiken
              </button>
            ) : null}
          </>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3 rounded-xl bg-white/5 px-4 py-3 text-sm">
              <span>
                Gekoppeld als <strong>{me?.displayName ?? "…"}</strong>
              </span>
              <button
                type="button"
                onClick={() => {
                  logout();
                  chooseSample();
                  refresh();
                }}
                className="inline-flex min-h-9 items-center gap-1 text-white/80 hover:text-white"
              >
                <LogOut className="size-4" aria-hidden />
                Uitloggen
              </button>
            </div>
            {meError ? (
              <p
                role="alert"
                className="rounded-xl bg-red-950/80 px-4 py-3 text-sm font-semibold"
              >
                {meError}
              </p>
            ) : null}
            {me ? <PlaylistPicker me={me} /> : null}
          </>
        )}

        <Selection />

        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={onBack} className={PRIMARY_BUTTON}>
            {musicStatus === "loading"
              ? "Klaar (nummers worden nog opgehaald)"
              : "Klaar"}
          </button>
          <button
            type="button"
            onClick={() => {
              chooseSample();
              onBack();
            }}
            className={`${SECONDARY_BUTTON} w-full`}
          >
            Toch voorbeeldnummers gebruiken
          </button>
        </div>
      </div>
    </Screen>
  );
}
