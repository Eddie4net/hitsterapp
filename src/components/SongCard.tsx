import type { Song } from "@/game/types";

/** Vierkante kaartjes met een zacht kleurverloop, zoals bij het bordspel. */
const SIZE = "size-32 sm:size-40";

/**
 * Verloop per decennium (boven naar onder). Alle kleuren zijn licht genoeg
 * voor de donkere tekst (contrast boven 4,5:1).
 */
const GRADIENTS: Record<number, [string, string]> = {
  195: ["#b58af2", "#d6b8fb"], // paars
  196: ["#ffd84a", "#ffb866"], // geel naar oranje
  197: ["#ff7aa8", "#f06bc0"], // roze
  198: ["#4f9cf5", "#7fc0f7"], // blauw
  199: ["#8fd14f", "#c3ec7a"], // groen
  200: ["#7fd6e0", "#b9eef0"], // lichtturquoise
  201: ["#ff9b5c", "#ffc48a"], // oranje
  202: ["#ff7d7d", "#ffb0a0"], // koraal
};
const FALLBACK: [string, string] = ["#c3cbd6", "#e2e7ee"];

function gradientFor(year: number): string {
  const [from, to] = GRADIENTS[Math.floor(year / 10)] ?? FALLBACK;
  return `linear-gradient(165deg, ${from}, ${to})`;
}

/** Voorkant: artiest bovenaan, jaar groot in het midden, titel cursief onderaan. */
export function SongCard({
  song,
  highlight = false,
}: {
  song: Song;
  highlight?: boolean;
}) {
  return (
    <div
      className={`${SIZE} flex shrink-0 flex-col items-center justify-between rounded-md px-2 py-3 text-center text-[#14141f] shadow-[0_8px_16px_rgba(0,0,0,0.4)] ${
        highlight ? "ring-4 ring-white" : "ring-1 ring-black/20"
      }`}
      style={{ background: gradientFor(song.year) }}
    >
      <p className="line-clamp-2 text-[11px] font-semibold leading-tight sm:text-xs">
        {song.artist}
      </p>
      <p className="text-4xl font-bold leading-none tracking-tight tabular-nums sm:text-5xl">
        {song.year}
      </p>
      <p className="line-clamp-2 text-xs font-light italic leading-tight sm:text-sm">
        {song.title}
      </p>
    </div>
  );
}

/** Achterkant: een munt met neonregenboog; het jaar is nog geheim. */
export function CardBack({ label }: { label?: string }) {
  return (
    <div
      className={`${SIZE} relative flex shrink-0 items-center justify-center overflow-hidden rounded-md bg-[#15131c] shadow-[0_8px_16px_rgba(0,0,0,0.45)] ring-1 ring-black/40`}
    >
      <span
        aria-hidden
        className="absolute inset-3 rounded-full"
        style={{
          background:
            "conic-gradient(from 20deg, #ff4d8d, #ffd23f, #2dc4d9, #7c3aed, #ff4d8d)",
        }}
      />
      <span
        aria-hidden
        className="absolute inset-[30%] rounded-full bg-[#15131c]"
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

/** Kleine munt voor het scorebord. */
export function TokenCoin() {
  return (
    <span
      aria-hidden
      className="inline-block size-3.5 rounded-full ring-1 ring-black/50"
      style={{
        background:
          "radial-gradient(circle, #15131c 0 38%, transparent 40%), conic-gradient(#ff4d8d, #ffd23f, #2dc4d9, #7c3aed, #ff4d8d)",
      }}
    />
  );
}

/** Kleine variant voor de tijdlijnen van de andere spelers. */
export function CompactCard({ song }: { song: Song }) {
  return (
    <div
      className="flex size-20 shrink-0 flex-col items-center justify-between rounded px-1 py-1.5 text-center text-[#14141f] shadow-[0_5px_10px_rgba(0,0,0,0.4)] ring-1 ring-black/20 sm:size-24"
      style={{ background: gradientFor(song.year) }}
    >
      <p className="line-clamp-1 w-full text-[9px] font-semibold leading-tight">
        {song.artist}
      </p>
      <p className="text-2xl font-bold leading-none tracking-tight tabular-nums sm:text-3xl">
        {song.year}
      </p>
      <p className="line-clamp-1 w-full text-[9px] font-light italic leading-tight">
        {song.title}
      </p>
    </div>
  );
}
