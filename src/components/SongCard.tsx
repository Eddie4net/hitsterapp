import type { Song } from "@/game/types";

/** Vierkante kaartjes, zoals bij het bordspel. */
const SIZE = "size-32 sm:size-40";

/** Felle kleuren per decennium; tekstkleur gekozen voor genoeg contrast. */
const PALETTE = [
  { bg: "#FF4D8D", fg: "#111111" },
  { bg: "#2DC4D9", fg: "#111111" },
  { bg: "#FFD23F", fg: "#111111" },
  { bg: "#FF8A3D", fg: "#111111" },
  { bg: "#7C3AED", fg: "#FFFFFF" },
  { bg: "#A3E635", fg: "#111111" },
  { bg: "#2563EB", fg: "#FFFFFF" },
  { bg: "#E11D48", fg: "#FFFFFF" },
];

function paletteFor(year: number) {
  return PALETTE[Math.floor(year / 10) % PALETTE.length];
}

/** Voorkant: artiest bovenaan, jaar groot in het midden, titel onderaan. */
export function SongCard({
  song,
  highlight = false,
}: {
  song: Song;
  highlight?: boolean;
}) {
  const { bg, fg } = paletteFor(song.year);
  return (
    <div
      className={`${SIZE} relative flex shrink-0 flex-col justify-between overflow-hidden rounded-lg p-3 shadow-[0_8px_16px_rgba(0,0,0,0.45)] ${
        highlight ? "ring-4 ring-white" : "ring-1 ring-black/30"
      }`}
      style={{ backgroundColor: bg, color: fg }}
    >
      <span
        aria-hidden
        className="absolute -right-8 -bottom-8 size-24 rounded-full bg-white/20"
      />
      <span
        aria-hidden
        className="absolute -top-6 -left-6 size-16 rounded-full bg-black/10"
      />
      <p className="relative line-clamp-2 text-[11px] font-extrabold uppercase leading-tight tracking-wide sm:text-xs">
        {song.artist}
      </p>
      <p className="relative text-center text-4xl font-black leading-none tabular-nums sm:text-5xl">
        {song.year}
      </p>
      <p className="relative line-clamp-2 text-center text-xs font-semibold italic leading-tight">
        {song.title}
      </p>
    </div>
  );
}

/** Achterkant: een draaiende plaat; het jaar is nog geheim. */
export function CardBack({ label }: { label?: string }) {
  return (
    <div
      className={`${SIZE} relative flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-black shadow-[0_8px_16px_rgba(0,0,0,0.45)] ring-1 ring-black/40`}
    >
      <span
        aria-hidden
        className="absolute inset-3 rounded-full"
        style={{
          background:
            "conic-gradient(from 20deg, #FF4D8D, #FFD23F, #2DC4D9, #7C3AED, #FF4D8D)",
        }}
      />
      <span
        aria-hidden
        className="absolute inset-[30%] rounded-full bg-black"
      />
      <span aria-hidden className="absolute size-2 rounded-full bg-white/80" />
      {label ? (
        <p className="absolute inset-x-0 bottom-1 text-center text-xs font-bold text-white">
          <span className="rounded bg-black/70 px-2 py-0.5">{label}</span>
        </p>
      ) : null}
    </div>
  );
}
