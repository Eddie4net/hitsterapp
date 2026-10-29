"use client";

import { Volume2, VolumeX } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";
import { loadSoundSetting, useSound } from "@/lib/feedback";

/** Eén knop voor al het geluid: muziek, effecten en trillen. */
export function SoundToggle() {
  const { on, toggle } = useSound();

  useEffect(() => {
    loadSoundSetting();
  }, []);

  return (
    <button
      type="button"
      onClick={() => {
        toggle();
        toast(
          on
            ? "Geluid staat uit: muziek, effecten en trillen zijn gedempt."
            : "Geluid staat weer aan.",
        );
      }}
      aria-label={
        on
          ? "Geluid is aan. Tik om alles te dempen: muziek, effecten en trillen."
          : "Geluid is uit. Tik om het weer aan te zetten."
      }
      title={on ? "Alles dempen" : "Geluid aanzetten"}
      className="flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-lg px-2 text-sm text-white/85 hover:bg-white/10"
    >
      {on ? (
        <Volume2 className="size-5" aria-hidden />
      ) : (
        <VolumeX className="size-5 text-red-300" aria-hidden />
      )}
      <span className="hidden whitespace-nowrap sm:inline">
        {on ? "Geluid aan" : "Geluid uit"}
      </span>
    </button>
  );
}
