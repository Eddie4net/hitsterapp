"use client";

import { MotionConfig } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { normalizeCode, useSession } from "@/net/session";
import { useGameView } from "@/net/useGameView";
import { useMusic } from "@/spotify/music";
import { Home } from "./Home";
import { HostLobby } from "./HostLobby";
import { ControllerLobby, JoinScreen } from "./JoinScreen";
import { MusicScreen } from "./MusicScreen";
import { Setup } from "./Setup";
import { Table } from "./Table";

type Screen = "home" | "local" | "join" | "music";

export function Game() {
  const view = useGameView();
  const role = useSession((s) => s.role);
  const error = useSession((s) => s.error);
  const startHost = useSession((s) => s.startHost);
  const [screen, setScreen] = useState<Screen>("home");
  const [joinCode, setJoinCode] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  // De laatst gekozen playlist komt vanzelf terug.
  useEffect(() => {
    useMusic.getState().restore();
  }, []);

  // De QR-code opent de app met ?join=ABCD, Spotify stuurt je terug met ?spotify=…
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("join");
    if (code) {
      setJoinCode(normalizeCode(code));
      setScreen("join");
    }
    const spotify = params.get("spotify");
    if (spotify === "connected") {
      setNotice("Spotify is gekoppeld. Kies nu een playlist.");
      setScreen("music");
    } else if (spotify === "error") {
      setNotice(params.get("message") ?? "Spotify koppelen is niet gelukt.");
      setScreen("music");
    }
    if (spotify) {
      // De melding hoeft niet in het adres te blijven staan.
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  // Na stoppen of verlaten: terug naar het begin (of naar het meedoen-scherm als er iets mis ging).
  const previousRole = useRef(role);
  useEffect(() => {
    if (role === "none" && previousRole.current !== "none") {
      setScreen(error ? "join" : "home");
    }
    previousRole.current = role;
  }, [role, error]);

  let content: React.ReactNode;
  if (view) content = <Table view={view} />;
  else if (role === "host") content = <HostLobby />;
  else if (role === "controller") content = <ControllerLobby />;
  else if (screen === "local")
    content = <Setup onBack={() => setScreen("home")} />;
  else if (screen === "music") {
    content = (
      <MusicScreen
        notice={notice}
        onBack={() => {
          setNotice(null);
          setScreen("home");
        }}
      />
    );
  } else if (screen === "join") {
    content = (
      <JoinScreen initialCode={joinCode} onBack={() => setScreen("home")} />
    );
  } else {
    content = (
      <Home
        notice={notice}
        onLocal={() => setScreen("local")}
        onHost={() => void startHost()}
        onJoin={() => setScreen("join")}
        onMusic={() => {
          setNotice(null);
          setScreen("music");
        }}
      />
    );
  }

  return (
    // Respecteert "minder beweging" in de instellingen van de gebruiker.
    <MotionConfig reducedMotion="user">{content}</MotionConfig>
  );
}
