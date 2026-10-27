"use client";

import { Volume2, VolumeX } from "lucide-react";
import { useEffect } from "react";
import { loadSoundSetting, useSound } from "@/lib/feedback";

export function SoundToggle() {
  const { on, toggle } = useSound();

  useEffect(() => {
    loadSoundSetting();
  }, []);

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={on}
      aria-label={
        on ? "Geluid en trillen staan aan" : "Geluid en trillen staan uit"
      }
      className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-white/80 hover:bg-white/10"
    >
      {on ? (
        <Volume2 className="size-5" aria-hidden />
      ) : (
        <VolumeX className="size-5" aria-hidden />
      )}
    </button>
  );
}
