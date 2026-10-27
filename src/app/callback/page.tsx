"use client";

import { useEffect, useState } from "react";
import { completeLogin } from "@/spotify/auth";

/** Hier komt Spotify terecht nadat je hebt ingelogd. We ronden de koppeling af en sturen je terug. */
export default function SpotifyCallback() {
  const [message, setMessage] = useState("Spotify koppelen…");

  useEffect(() => {
    void completeLogin(new URLSearchParams(window.location.search)).then(
      (result) => {
        if (result.ok) {
          window.location.replace("/?spotify=connected");
        } else {
          setMessage(result.error);
          setTimeout(
            () =>
              window.location.replace(
                `/?spotify=error&message=${encodeURIComponent(result.error)}`,
              ),
            1500,
          );
        }
      },
    );
  }, []);

  return (
    <main className="floor flex flex-1 items-center justify-center p-4">
      <output className="rounded-2xl bg-stone-950/90 px-6 py-4 text-lg font-semibold text-white">
        {message}
      </output>
    </main>
  );
}
