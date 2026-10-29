import type { Song } from "@/game/types";
import { LogoMark, Wordmark } from "./Logo";

/** Vierkante kaartjes met een zacht kleurverloop, zoals bij het bordspel. */
const SIZE = "size-(--card)";

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
      className={`${SIZE} flex shrink-0 flex-col items-center justify-between rounded-md px-[6%] py-[8%] text-center text-[#14141f] shadow-[0_8px_16px_rgba(0,0,0,0.4)] ${
        highlight ? "ring-4 ring-white" : "ring-1 ring-black/20"
      }`}
      style={{ background: gradientFor(song.year) }}
    >
      <p
        className="line-clamp-2 font-semibold leading-tight"
        style={{ fontSize: "max(9px, calc(var(--card) * 0.085))" }}
      >
        {song.artist}
      </p>
      <p
        className="font-bold leading-none tracking-tight tabular-nums"
        style={{ fontSize: "calc(var(--card) * 0.3)" }}
      >
        {song.year}
      </p>
      <p
        className="line-clamp-2 font-light italic leading-tight"
        style={{ fontSize: "max(9px, calc(var(--card) * 0.095))" }}
      >
        {song.title}
      </p>
    </div>
  );
}

/** Achterkant: het Spot-On-merkteken op diep paars, met een gouden lijst en het woord erboven. */
export function CardBack({ label }: { label?: string }) {
  return (
    <div
      className={`${SIZE} relative shrink-0 overflow-hidden rounded-md shadow-[0_8px_16px_rgba(0,0,0,0.45)] ring-1 ring-black/40`}
      style={{
        background:
          "radial-gradient(120% 90% at 50% 40%, #2a1857 0%, #150b30 55%, #090514 100%)",
      }}
    >
      <span
        aria-hidden
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(135deg, #fff 0 1px, transparent 1px 7px)",
        }}
      />
      <span
        aria-hidden
        className="absolute inset-[4px] rounded-[5px] border border-amber-200/35"
      />
      <Wordmark className="absolute left-1/2 top-[6%] w-[58%] -translate-x-1/2" />
      <LogoMark className="absolute inset-x-[12%] top-[16%] w-[76%] drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]" />
      {label ? (
        <p className="absolute inset-x-0 bottom-1 text-center text-xs font-bold text-white">
          <span className="rounded bg-black/70 px-2 py-0.5">{label}</span>
        </p>
      ) : null}
    </div>
  );
}

/** Token: gouden gefreesde munt met het merkteken. */
export function TokenCoin({ className = "size-5" }: { className?: string }) {
  return (
    <LogoMark
      kind="coin"
      className={`inline-block align-middle drop-shadow-[0_1px_1.5px_rgba(0,0,0,0.55)] ${className}`}
    />
  );
}

/** Kleine variant voor de tijdlijnen van de andere spelers. */
export function CompactCard({ song }: { song: Song }) {
  return (
    <div
      className="flex size-[calc(var(--card)*0.6)] shrink-0 flex-col items-center justify-between rounded px-1 py-1.5 text-center text-[#14141f] shadow-[0_5px_10px_rgba(0,0,0,0.4)] ring-1 ring-black/20"
      style={{ background: gradientFor(song.year) }}
    >
      <p
        className="line-clamp-1 w-full font-semibold leading-tight"
        style={{ fontSize: "max(8px, calc(var(--card) * 0.052))" }}
      >
        {song.artist}
      </p>
      <p
        className="font-bold leading-none tracking-tight tabular-nums"
        style={{ fontSize: "calc(var(--card) * 0.19)" }}
      >
        {song.year}
      </p>
      <p
        className="line-clamp-1 w-full font-light italic leading-tight"
        style={{ fontSize: "max(8px, calc(var(--card) * 0.055))" }}
      >
        {song.title}
      </p>
    </div>
  );
}
