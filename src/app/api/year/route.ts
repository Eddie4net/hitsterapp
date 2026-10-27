import { NextResponse } from "next/server";
import {
  cleanTitle,
  type MbRecording,
  type MbReleaseGroup,
  pickYear,
  pickYearFromGroups,
} from "@/spotify/year";

/**
 * Zoekt het oorspronkelijke jaar van een nummer op bij MusicBrainz. Dit gebeurt op de server
 * omdat MusicBrainz om een herkenbare User-Agent en maximaal 1 verzoek per seconde vraagt.
 * Eerst kijken we naar de uitgaven (singles en albums), want daar staat het oorspronkelijke
 * jaar het betrouwbaarst; lukt dat niet, dan naar losse opnames. Een gelukte uitkomst wordt
 * door het CDN een week bewaard, zodat hetzelfde nummer maar één keer opgezocht hoeft te worden.
 */
const USER_AGENT = "Hitster/1.0 (+https://hitsterapp.vercel.app)";
const SPACING_MS = 1100;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Verzoeken wachten in een rij, met een pauze ertussen.
let queue: Promise<unknown> = Promise.resolve();
function throttled<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(task);
  queue = run.then(
    () => sleep(SPACING_MS),
    () => sleep(SPACING_MS),
  );
  return run;
}

const escapeQuery = (s: string) => s.replace(/["\\]/g, " ").slice(0, 200);

/** Eén verzoek aan MusicBrainz, met één nieuwe poging als ze even afremmen (503). */
async function musicBrainz<T>(
  entity: string,
  query: string,
): Promise<T | null> {
  const url = `https://musicbrainz.org/ws/2/${entity}?query=${encodeURIComponent(query)}&fmt=json&limit=100`;
  return throttled(async () => {
    for (let attempt = 0; attempt < 2; attempt++) {
      const response = await fetch(url, {
        headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
      });
      if (response.ok) return (await response.json()) as T;
      if (response.status !== 503 && response.status !== 429) return null;
      await sleep(2000);
    }
    return null;
  });
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const title = params.get("title")?.trim();
  const artist = params.get("artist")?.trim();
  if (!title || !artist) {
    return NextResponse.json(
      { error: "title en artist zijn verplicht" },
      { status: 400 },
    );
  }

  const cleaned = escapeQuery(cleanTitle(title));
  const main = escapeQuery(artist.split(",")[0]);
  let answered = false;

  try {
    const groups = await musicBrainz<{ "release-groups"?: MbReleaseGroup[] }>(
      "release-group",
      `releasegroup:"${cleaned}" AND artist:"${main}"`,
    );
    if (groups) answered = true;
    let year = groups
      ? pickYearFromGroups(groups["release-groups"] ?? [], title, artist)
      : null;

    if (year === null) {
      const recordings = await musicBrainz<{ recordings?: MbRecording[] }>(
        "recording",
        `recording:"${cleaned}" AND artist:"${main}"`,
      );
      if (recordings) answered = true;
      year = recordings
        ? pickYear(recordings.recordings ?? [], title, artist)
        : null;
    }

    // Alleen bewaren als MusicBrainz echt antwoordde, niet bij een tijdelijke storing.
    return NextResponse.json(
      { year },
      answered
        ? {
            headers: {
              "Cache-Control":
                "public, s-maxage=604800, stale-while-revalidate=86400",
            },
          }
        : undefined,
    );
  } catch {
    return NextResponse.json({ year: null });
  }
}
