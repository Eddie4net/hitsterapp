"use client";

import { MotionConfig } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { normalizeCode, useSession } from "@/net/session";
import { useGameView } from "@/net/useGameView";
import { Home } from "./Home";
import { HostLobby } from "./HostLobby";
import { ControllerLobby, JoinScreen } from "./JoinScreen";
import { Setup } from "./Setup";
import { Table } from "./Table";

type Screen = "home" | "local" | "join";

export function Game() {
  const view = useGameView();
  const role = useSession((s) => s.role);
  const error = useSession((s) => s.error);
  const startHost = useSession((s) => s.startHost);
  const [screen, setScreen] = useState<Screen>("home");
  const [joinCode, setJoinCode] = useState("");

  // De QR-code opent de app met ?join=ABCD: dan ga je meteen naar het meedoen-scherm.
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("join");
    if (code) {
      setJoinCode(normalizeCode(code));
      setScreen("join");
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
  else if (screen === "join") {
    content = (
      <JoinScreen initialCode={joinCode} onBack={() => setScreen("home")} />
    );
  } else {
    content = (
      <Home
        onLocal={() => setScreen("local")}
        onHost={() => void startHost()}
        onJoin={() => setScreen("join")}
      />
    );
  }

  return (
    // Respecteert "minder beweging" in de instellingen van de gebruiker.
    <MotionConfig reducedMotion="user">{content}</MotionConfig>
  );
}
