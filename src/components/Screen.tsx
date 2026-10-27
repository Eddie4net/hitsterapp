import { Disc3 } from "lucide-react";
import type { ReactNode } from "react";
import { RulesButton } from "./RulesDialog";
import { SoundToggle } from "./SoundToggle";

/** Eikenhouten vloer met een donkere kaart erop: het beginscherm, de lobby en het meedoen-scherm. */
export function Screen({
  children,
  wide = false,
}: {
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <main className="floor flex flex-1 items-center justify-center p-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]">
      <div
        className={`w-full ${wide ? "max-w-3xl" : "max-w-md"} rounded-3xl border border-white/10 bg-stone-950/90 p-6 text-white shadow-2xl backdrop-blur sm:p-8`}
      >
        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Disc3 className="size-10 text-gold" aria-hidden />
            <h1 className="text-3xl font-black tracking-tight">Hitsterapp</h1>
          </div>
          <div className="flex items-center gap-1">
            <RulesButton />
            <SoundToggle />
          </div>
        </div>
        {children}
      </div>
    </main>
  );
}

export function Choice({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`min-h-12 rounded-xl border px-5 py-2 text-left font-medium transition-colors ${
        selected
          ? "border-gold bg-gold text-black"
          : "border-white/25 bg-white/5 hover:bg-white/10"
      }`}
    >
      {children}
    </button>
  );
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-white/70">
      {children}
    </p>
  );
}

export const PRIMARY_BUTTON =
  "min-h-12 w-full rounded-xl bg-gold px-6 py-3 text-lg font-bold text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50";
export const SECONDARY_BUTTON =
  "min-h-11 rounded-xl border border-white/25 px-4 text-sm font-semibold text-white hover:bg-white/10";
