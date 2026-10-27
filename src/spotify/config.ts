/** Welke rechten vragen we aan Spotify? Alleen wat het spel echt nodig heeft. */
export const SCOPES = [
  "playlist-read-private",
  "playlist-read-collaborative",
  "streaming",
  "user-read-email",
  "user-read-private",
  "user-modify-playback-state",
  "user-read-playback-state",
];

const CLIENT_KEY = "hitster-spotify-client-id";

/** Een Spotify Client ID is 32 tekens (hexadecimaal). Het is geen geheim. */
export function isValidClientId(id: string): boolean {
  return /^[a-f0-9]{32}$/i.test(id.trim());
}

export function clientIdFromEnv(): string | null {
  const value = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID?.trim();
  return value ? value : null;
}

/** Eerst de omgevingsvariabele (Vercel), anders wat je in de app hebt ingevuld. */
export function getClientId(): string | null {
  const fromEnv = clientIdFromEnv();
  if (fromEnv) return fromEnv;
  try {
    const stored = window.localStorage.getItem(CLIENT_KEY)?.trim();
    return stored ? stored : null;
  } catch {
    return null;
  }
}

export function setClientId(id: string): void {
  try {
    window.localStorage.setItem(CLIENT_KEY, id.trim());
  } catch {
    // Opslaan lukt niet (bijvoorbeeld privévenster): je moet hem dan elke keer invullen.
  }
}

export function clearClientId(): void {
  try {
    window.localStorage.removeItem(CLIENT_KEY);
  } catch {
    // Niets om op te ruimen.
  }
}

/** De exacte URL die je in het Spotify-dashboard moet toevoegen. */
export function redirectUri(): string {
  return `${window.location.origin}/callback`;
}

/**
 * Spotify accepteert alleen https, of http op 127.0.0.1 / [::1]. `localhost` mag niet.
 * Geeft een uitleg terug als dit adres niet werkt, anders null.
 */
export function redirectProblem(): string | null {
  const { protocol, hostname, port } = window.location;
  if (hostname === "localhost") {
    return `Spotify accepteert geen "localhost". Open de app via http://127.0.0.1${port ? `:${port}` : ""} om lokaal te testen.`;
  }
  const loopback = hostname === "127.0.0.1" || hostname === "[::1]";
  if (protocol !== "https:" && !loopback) {
    return "Spotify vereist een https-adres (of 127.0.0.1 voor lokaal testen).";
  }
  return null;
}

/** Alleen tijdens ontwikkelen: nep-Spotify om de schermen te testen zonder inloggen. */
export function isMock(): boolean {
  if (process.env.NODE_ENV === "production") return false;
  try {
    return window.localStorage.getItem("hitster-spotify-mock") === "1";
  } catch {
    return false;
  }
}
