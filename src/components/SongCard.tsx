import { Disc3 } from "lucide-react";
import type { Song } from "@/game/types";

const SIZE = "h-36 w-28 sm:h-44 sm:w-32";

/** Kaartje met het jaar groot in beeld; de kleur hangt af van het jaar. */
export function SongCard({
  song,
  highlight = false,
}: {
  song: Song;
  highlight?: boolean;
}) {
  const hue = (song.year * 7) % 360;
  return (
    <div
      className={`${SIZE} flex shrink-0 flex-col justify-between rounded-xl p-3 text-white shadow-lg ring-2 ${
        highlight ? "ring-gold" : "ring-white/20"
      }`}
      style={{
        background: `linear-gradient(145deg, hsl(${hue} 65% 30%), hsl(${(hue + 40) % 360} 65% 20%))`,
      }}
    >
      <p className="text-3xl font-black leading-none tabular-nums sm:text-4xl">
        {song.year}
      </p>
      <div>
        <p className="line-clamp-2 text-sm font-bold leading-tight">
          {song.title}
        </p>
        <p className="mt-1 line-clamp-2 text-xs text-white/85">{song.artist}</p>
      </div>
    </div>
  );
}

/** Achterkant: het raadkaartje waarvan je het jaar nog niet weet. */
export function CardBack({ label }: { label?: string }) {
  return (
    <div
      className={`${SIZE} flex shrink-0 flex-col items-center justify-center gap-2 rounded-xl bg-[repeating-linear-gradient(45deg,#1b1b1b,#1b1b1b_8px,#242424_8px,#242424_16px)] text-gold shadow-lg ring-2 ring-gold/60`}
    >
      <Disc3 className="size-12" aria-hidden />
      {label ? <p className="text-sm font-bold">{label}</p> : null}
    </div>
  );
}
