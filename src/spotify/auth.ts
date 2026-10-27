import {
  clearClientId,
  getClientId,
  isMock,
  redirectProblem,
  redirectUri,
  SCOPES,
} from "./config";
import { challengeFor, randomString } from "./pkce";

export type Tokens = {
  accessToken: string;
  refreshToken: string | null;
  /** Tijdstip (ms) waarop het toegangstoken verloopt. */
  expiresAt: number;
};

const TOKEN_KEY = "hitster-spotify-tokens";
const VERIFIER_KEY = "hitster-spotify-verifier";
const STATE_KEY = "hitster-spotify-state";
const TOKEN_URL = "https://accounts.spotify.com/api/token";

function readJson<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function loadTokens(): Tokens | null {
  return readJson<Tokens>(TOKEN_KEY);
}

function saveTokens(tokens: Tokens): void {
  try {
    window.localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
  } catch {
    // Niet kunnen opslaan betekent opnieuw inloggen na een verversing van de pagina.
  }
}

export function isLoggedIn(): boolean {
  return isMock() || loadTokens() !== null;
}

/** Stuurt je naar Spotify om in te loggen. Daarna kom je terug op /callback. */
export async function startLogin(): Promise<void> {
  const clientId = getClientId();
  if (!clientId) throw new Error("Vul eerst je Spotify Client ID in.");
  const problem = redirectProblem();
  if (problem) throw new Error(problem);
  const verifier = randomString(64);
  const state = randomString(24);
  try {
    window.localStorage.setItem(VERIFIER_KEY, verifier);
    window.localStorage.setItem(STATE_KEY, state);
  } catch {
    throw new Error("Je browser laat niets opslaan, dus inloggen kan niet.");
  }
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirectUri(),
    scope: SCOPES.join(" "),
    state,
    code_challenge_method: "S256",
    code_challenge: await challengeFor(verifier),
  });
  window.location.assign(`https://accounts.spotify.com/authorize?${params}`);
}

type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
};

async function requestTokens(body: Record<string, string>): Promise<Tokens> {
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body),
  });
  if (!response.ok) {
    const detail = (await response.json().catch(() => null)) as {
      error_description?: string;
    } | null;
    throw new Error(
      detail?.error_description ?? `Spotify weigerde (${response.status}).`,
    );
  }
  const json = (await response.json()) as TokenResponse;
  return {
    accessToken: json.access_token,
    // Bij vernieuwen geeft Spotify niet altijd een nieuw refresh-token mee: houd het oude dan.
    refreshToken: json.refresh_token ?? loadTokens()?.refreshToken ?? null,
    expiresAt: Date.now() + json.expires_in * 1000,
  };
}

/** Wordt aangeroepen op /callback met de gegevens uit de URL. */
export async function completeLogin(
  params: URLSearchParams,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const denied = params.get("error");
  if (denied) {
    return {
      ok: false,
      error:
        denied === "access_denied"
          ? "Je hebt de koppeling niet goedgekeurd."
          : `Spotify meldde: ${denied}.`,
    };
  }
  const code = params.get("code");
  const state = params.get("state");
  let expectedState: string | null = null;
  let verifier: string | null = null;
  try {
    expectedState = window.localStorage.getItem(STATE_KEY);
    verifier = window.localStorage.getItem(VERIFIER_KEY);
  } catch {
    // Zonder opslag kunnen we de terugkeer niet controleren.
  }
  if (!code || !state || !verifier || state !== expectedState) {
    return {
      ok: false,
      error: "De terugkeer van Spotify klopte niet. Probeer het opnieuw.",
    };
  }
  const clientId = getClientId();
  if (!clientId)
    return { ok: false, error: "Je Client ID is niet meer beschikbaar." };
  try {
    const tokens = await requestTokens({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri(),
      client_id: clientId,
      code_verifier: verifier,
    });
    saveTokens(tokens);
    window.localStorage.removeItem(VERIFIER_KEY);
    window.localStorage.removeItem(STATE_KEY);
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Inloggen mislukt.",
    };
  }
}

/** Geeft een geldig toegangstoken en ververst het zo nodig. Null als je opnieuw moet inloggen. */
export async function getAccessToken(
  forceRefresh = false,
): Promise<string | null> {
  if (isMock()) return "mock-token";
  const tokens = loadTokens();
  if (!tokens) return null;
  if (!forceRefresh && tokens.expiresAt - Date.now() > 60_000) {
    return tokens.accessToken;
  }
  const clientId = getClientId();
  if (!tokens.refreshToken || !clientId) {
    logout();
    return null;
  }
  try {
    const fresh = await requestTokens({
      grant_type: "refresh_token",
      refresh_token: tokens.refreshToken,
      client_id: clientId,
    });
    saveTokens(fresh);
    return fresh.accessToken;
  } catch {
    logout();
    return null;
  }
}

export function logout(): void {
  try {
    window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Niets om weg te halen.
  }
}

/** Alles over Spotify vergeten, ook het Client ID dat je in de app hebt ingevuld. */
export function forgetSpotify(): void {
  logout();
  clearClientId();
}
