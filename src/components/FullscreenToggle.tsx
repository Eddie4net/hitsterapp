"use client";

import { Maximize, Minimize } from "lucide-react";
import { useEffect, useState } from "react";

/** Volledig scherm voor meer onderdompeling. Verdwijnt als de browser het niet ondersteunt (bijvoorbeeld iPhone). */
export function FullscreenToggle() {
  const [supported, setSupported] = useState(false);
  const [full, setFull] = useState(false);

  useEffect(() => {
    setSupported(document.fullscreenEnabled);
    const onChange = () => setFull(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  if (!supported) return null;

  return (
    <button
      type="button"
      onClick={() => {
        if (document.fullscreenElement) void document.exitFullscreen();
        else void document.documentElement.requestFullscreen();
      }}
      aria-label={full ? "Volledig scherm verlaten" : "Volledig scherm"}
      className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-white/80 hover:bg-white/10"
    >
      {full ? (
        <Minimize className="size-5" aria-hidden />
      ) : (
        <Maximize className="size-5" aria-hidden />
      )}
    </button>
  );
}
