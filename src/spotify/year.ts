/**
 * Het jaartal van Spotify is het jaar van de uitgave waar het nummer op staat. Bij een
 * heruitgave of verzamelaar is dat vaak veel later dan het jaar van de hit. Hitster
 * gaat om het oorspronkelijke jaar, dus controleren we dat bij MusicBrainz (open database).
 */

/** Haalt " - Remastered 2011", "(Live)", "(feat. X)" enzovoort van een titel. */
export function cleanTitle(title: string): string {
  let t = title;
  t = t.replace(
    /\s+-\s+.*(remaster|mono|stereo|version|edit|mix|live|single|bonus|deluxe|anniversary|\b(19|20)\d{2}\b).*$/i,
    "",
  );
  t = t.replace(
    /\s*[([][^)\]]*(remaster|mono|stereo|version|edit|mix|live|bonus|deluxe|anniversary)[^)\]]*[)\]]/gi,
    "",
  );
  t = t.replace(/\s*[([]\s*(feat|ft|with)\.?[^)\]]*[)\]]/gi, "");
  return t.trim() || title;
}

export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export type MbRecording = {
  title?: string;
  score?: number;
  "first-release-date"?: string;
  disambiguation?: string;
  "artist-credit"?: { name?: string; artist?: { name?: string } }[];
};

const UNWANTED =
  /live|cover|karaoke|tribute|instrumental|demo|acoustic|remix|rehearsal/i;

/**
 * Kies uit de zoekresultaten van MusicBrainz het vroegste jaar van een opname die echt
 * dit nummer van deze artiest is. Null als er geen betrouwbare match is.
 */
export function pickYear(
  recordings: MbRecording[],
  title: string,
  artist: string,
): number | null {
  const wantedTitle = normalize(cleanTitle(title));
  const wantedArtist = normalize(artist.split(",")[0] ?? artist);
  if (!wantedTitle || !wantedArtist) return null;
  let best: number | null = null;
  for (const rec of recordings) {
    if ((rec.score ?? 0) < 80) continue;
    if (normalize(rec.title ?? "") !== wantedTitle) continue;
    if (rec.disambiguation && UNWANTED.test(rec.disambiguation)) continue;
    const credits = (rec["artist-credit"] ?? []).map((c) =>
      normalize(c.name ?? c.artist?.name ?? ""),
    );
    const artistMatches = credits.some(
      (c) => c && (c.includes(wantedArtist) || wantedArtist.includes(c)),
    );
    if (!artistMatches) continue;
    const year = Number.parseInt(
      rec["first-release-date"]?.slice(0, 4) ?? "",
      10,
    );
    if (!Number.isFinite(year) || year < 1900) continue;
    if (best === null || year < best) best = year;
  }
  return best;
}

/** Het jaar van Spotify, tenzij MusicBrainz een eerder (oorspronkelijk) jaar kent. */
export function combineYears(
  spotifyYear: number,
  musicBrainzYear: number | null,
): { year: number; source: "spotify" | "musicbrainz" } {
  if (musicBrainzYear !== null && musicBrainzYear < spotifyYear) {
    return { year: musicBrainzYear, source: "musicbrainz" };
  }
  return {
    year: spotifyYear,
    source: musicBrainzYear === spotifyYear ? "musicbrainz" : "spotify",
  };
}

export type MbReleaseGroup = {
  title?: string;
  score?: number;
  "first-release-date"?: string;
  "secondary-types"?: string[];
  "artist-credit"?: { name?: string; artist?: { name?: string } }[];
};

const UNWANTED_TYPES = new Set([
  "Live",
  "Remix",
  "DJ-mix",
  "Demo",
  "Mixtape/Street",
  "Spokenword",
  "Interview",
  "Audiobook",
  "Audio drama",
]);

/**
 * Kies het vroegste jaar uit de uitgaven (singles, albums) met precies deze titel van deze
 * artiest. Betrouwbaarder dan losse opnames, want daar staan ook live-versies en covers tussen.
 */
export function pickYearFromGroups(
  groups: MbReleaseGroup[],
  title: string,
  artist: string,
): number | null {
  const wantedTitle = normalize(cleanTitle(title));
  const wantedArtist = normalize(artist.split(",")[0] ?? artist);
  if (!wantedTitle || !wantedArtist) return null;
  let best: number | null = null;
  for (const group of groups) {
    if ((group.score ?? 0) < 80) continue;
    if (normalize(group.title ?? "") !== wantedTitle) continue;
    if ((group["secondary-types"] ?? []).some((t) => UNWANTED_TYPES.has(t)))
      continue;
    const credits = (group["artist-credit"] ?? []).map((c) =>
      normalize(c.name ?? c.artist?.name ?? ""),
    );
    if (
      !credits.some(
        (c) => c && (c.includes(wantedArtist) || wantedArtist.includes(c)),
      )
    ) {
      continue;
    }
    const year = Number.parseInt(
      group["first-release-date"]?.slice(0, 4) ?? "",
      10,
    );
    if (!Number.isFinite(year) || year < 1900) continue;
    if (best === null || year < best) best = year;
  }
  return best;
}
