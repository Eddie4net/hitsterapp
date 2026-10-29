"use client";

import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  ArrowRight,
  LogOut,
  Plus,
  SkipForward,
  Trophy,
  WifiOff,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Fragment, type ReactNode, useState } from "react";
import { toast } from "sonner";
import { BUY_COST, describeSlot, MAX_TOKENS } from "@/game/rules";
import type { Result } from "@/game/types";
import { resultMessage } from "@/lib/messages";
import { playerColor } from "@/lib/players";
import { useTableEffects } from "@/lib/useTableEffects";
import type { GameView } from "@/net/useGameView";
import { useMusic } from "@/spotify/music";
import { useHostMusic } from "@/spotify/useHostMusic";
import { Ambient } from "./Ambient";
import { FullscreenToggle } from "./FullscreenToggle";
import { HitsterStamp } from "./HitsterStamp";
import { MusicControls } from "./MusicControls";
import { Chair, FabricDefs, Plant } from "./Room";
import { RulesButton } from "./RulesDialog";
import { CardBack, CompactCard, SongCard, TokenCoin } from "./SongCard";
import { SoundToggle } from "./SoundToggle";

const SLOT_HEIGHT = "h-32 sm:h-40";

/** Donker doorschijnend vlak: houdt tekst op het houten blad goed leesbaar. */
const PLATE =
  "rounded-2xl bg-stone-950/75 px-4 py-2 text-white shadow-lg backdrop-blur-sm";

const GHOST_BUTTON =
  "inline-flex min-h-11 items-center gap-2 rounded-xl bg-stone-950/80 px-4 text-sm font-semibold text-white hover:bg-stone-950 disabled:cursor-not-allowed disabled:opacity-50";

function Slot({
  index,
  label,
  onPlace,
}: {
  index: number;
  label: string;
  onPlace: (index: number) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `slot-${index}` });
  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={() => onPlace(index)}
      aria-label={`Leg het kaartje ${label}`}
      className={`group relative flex ${SLOT_HEIGHT} shrink-0 items-center justify-center rounded-xl transition-all duration-200 ${
        isOver ? "w-20" : "w-12 hover:w-16"
      }`}
      style={{
        background:
          "linear-gradient(180deg, rgba(48, 24, 8, 0.44), rgba(48, 24, 8, 0.24))",
        boxShadow: isOver
          ? "inset 0 2px 8px rgba(0,0,0,0.5), 0 0 0 2px #f4c24d, 0 0 24px rgba(244,194,77,0.55)"
          : "inset 0 2px 7px rgba(0,0,0,0.5), inset 0 -1px 0 rgba(255,255,255,0.22), 0 1px 0 rgba(255,255,255,0.2)",
        outline: "1.5px dashed rgba(255,255,255,0.55)",
        outlineOffset: "-5px",
      }}
    >
      <span
        className={`flex size-7 items-center justify-center rounded-full text-stone-900 shadow-md transition-transform group-hover:scale-110 ${
          isOver ? "scale-125 bg-gold" : "bg-white/90"
        }`}
      >
        <Plus className="size-4" aria-hidden />
      </span>
    </button>
  );
}

/** Het kaartje van de speler aan de beurt, nog met de achterkant omhoog, op de gekozen plek. */
function PlacedCard({ name, color }: { name: string; color: string }) {
  return (
    <div
      role="img"
      aria-label={`${name} legde het kaartje hier, nog niet omgedraaid`}
      className="rounded-md ring-2"
      style={{ ["--tw-ring-color" as string]: color }}
    >
      <CardBack />
    </div>
  );
}

/** Een token dat iemand op een plek heeft gelegd om te stelen (zonder het jaar te verklappen). */
function StealToken({ name, color }: { name: string; color: string }) {
  return (
    <div
      role="img"
      aria-label={`${name} legde een token hier`}
      className={`flex ${SLOT_HEIGHT} w-12 shrink-0 items-center justify-center`}
    >
      <span
        className="inline-flex rounded-full p-[3px] shadow-[0_6px_10px_rgba(0,0,0,0.45)]"
        style={{ background: color }}
      >
        <TokenCoin className="size-10" />
      </span>
    </div>
  );
}

/** Het bovenste kaartje van de stapel: sleepbaar zolang er een plek gekozen mag worden. */
function MysteryCard({ disabled }: { disabled: boolean }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: "mystery",
    disabled,
  });
  return (
    <button
      type="button"
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      aria-label={
        disabled
          ? "Raadkaartje"
          : "Raadkaartje. Sleep het naar de tijdlijn, of kies een plek met de plus-knoppen."
      }
      className={`relative touch-none ${disabled ? "cursor-default" : "cursor-grab active:cursor-grabbing"} ${
        isDragging ? "opacity-30" : ""
      }`}
    >
      <CardBack label="Welk jaar?" />
    </button>
  );
}

/** Het bovenste kaartje draait om en laat artiest, titel en jaar zien. */
function FlipCard({ result }: { result: Result }) {
  return (
    <motion.div
      initial={{ rotateY: 180 }}
      animate={{ rotateY: 0 }}
      transition={{ duration: 0.55, ease: "easeOut" }}
      style={{ transformStyle: "preserve-3d" }}
      className="relative size-32 sm:size-40"
    >
      <div
        style={{ backfaceVisibility: "hidden" }}
        className={`absolute inset-0 ${result.winnerId === null ? "opacity-80 grayscale" : ""}`}
      >
        <SongCard song={result.song} highlight={result.winnerId !== null} />
      </div>
      <div
        style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        className="absolute inset-0"
      >
        <CardBack />
      </div>
    </motion.div>
  );
}

/** Eén stapel: onder het bovenste kaartje zie je de randen van de rest. Bij het begin wordt hij geschud. */
function Deck({
  remaining,
  shuffling,
  children,
}: {
  remaining: number;
  shuffling: boolean;
  children: ReactNode;
}) {
  const layers = Math.min(6, Math.max(remaining, 0));
  return (
    <div
      className="relative size-32 drop-shadow-[6px_12px_10px_rgba(0,0,0,0.4)] sm:size-40"
      style={{ perspective: 900 }}
    >
      {Array.from({ length: layers }, (_, i) => {
        const dir = i % 2 ? 1 : -1;
        return (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: vaste, identieke lagen
            key={i}
            aria-hidden
            className="absolute inset-0"
            style={{
              transform: `translate(${(layers - i) * 1.6}px, ${(layers - i) * 1.9}px) rotate(${((i % 3) - 1) * 0.9}deg)`,
            }}
          >
            <motion.div
              className="size-full rounded-md bg-[#15131c] ring-1 ring-white/10"
              style={{ boxShadow: "0 1.5px 0 #d9d2c0" }}
              animate={
                shuffling
                  ? { x: [0, dir * 46, dir * -22, 0], rotate: [0, dir * 8, 0] }
                  : { x: 0, rotate: 0 }
              }
              transition={{ duration: 0.9, delay: i * 0.06, ease: "easeInOut" }}
            />
          </div>
        );
      })}
      <div className="absolute inset-0">{children}</div>
    </div>
  );
}

/** Tokens als munten: ze poppen erin en vliegen weg als je er een uitgeeft. */
function Coins({ count }: { count: number }) {
  return (
    <span className="ml-1 inline-flex gap-0.5 align-middle">
      <AnimatePresence initial={false}>
        {Array.from({ length: count }, (_, n) => (
          <motion.span
            // biome-ignore lint/suspicious/noArrayIndexKey: vaste, identieke munten
            key={n}
            initial={{ scale: 0, y: -8 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 1.9, y: -20, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 16 }}
            className="inline-flex"
          >
            <TokenCoin />
          </motion.span>
        ))}
      </AnimatePresence>
    </span>
  );
}

function Scoreboard({
  view,
  onBuy,
}: {
  view: GameView;
  onBuy: (playerId: number) => void;
}) {
  const { state: g, me } = view;
  return (
    <ul className="flex flex-wrap items-center justify-center gap-2">
      {g.players.map((p, i) => {
        const isActive = i === g.active && g.phase !== "finished";
        const canBuy =
          g.tokensEnabled &&
          g.phase !== "finished" &&
          p.tokens >= BUY_COST &&
          g.deckCount > 0 &&
          (me === null || me === p.id);
        return (
          <li
            key={p.id}
            aria-current={isActive ? "true" : undefined}
            className={`flex flex-wrap items-center gap-x-1.5 rounded-full px-4 py-1.5 text-sm font-semibold ${
              isActive
                ? "bg-gold text-black"
                : "bg-white/10 text-white ring-1 ring-white/25"
            }`}
          >
            <span
              aria-hidden
              className="inline-block size-2.5 rounded-full ring-1 ring-black/40"
              style={{ background: playerColor(p.id) }}
            />
            <span>
              {p.name}
              {me === p.id ? " (jij)" : ""} · {p.timeline.length}/{g.target}
            </span>
            {g.tokensEnabled ? (
              <>
                <span>· {p.tokens} tokens</span>
                <Coins count={p.tokens} />
              </>
            ) : null}
            {p.remote && !p.connected ? (
              <span className="inline-flex items-center gap-1 text-xs">
                <WifiOff className="size-3.5" aria-hidden />
                offline
              </span>
            ) : null}
            {canBuy ? (
              <button
                type="button"
                onClick={() => onBuy(p.id)}
                className="ml-1 min-h-8 rounded-full bg-gold px-3 text-xs font-bold text-black hover:brightness-110"
              >
                Kaartje kopen ({BUY_COST})
              </button>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

/** De kaartjes van de andere spelers liggen gewoon op tafel, voor hun plek. */
function OtherTimelines({ view }: { view: GameView }) {
  const { state: g, me } = view;
  const others = g.players.filter((_, i) => i !== g.active);
  return (
    <div
      className="grid w-full gap-x-6 gap-y-3"
      style={{
        gridTemplateColumns: `repeat(${Math.min(others.length, 3)}, minmax(0, 1fr))`,
      }}
    >
      {others.map((p) => (
        <div key={p.id} className="min-w-0">
          <p className="mx-auto mb-1.5 w-fit rounded-full bg-stone-950/75 px-3 py-0.5 text-xs font-semibold text-white">
            <span
              aria-hidden
              className="mr-1.5 inline-block size-2 rounded-full"
              style={{ background: playerColor(p.id) }}
            />
            {p.name}
            {me === p.id ? " (jij)" : ""} · {p.timeline.length}/{g.target}
          </p>
          <div className="overflow-x-auto pb-2">
            <ul
              className="mx-auto flex w-max items-center gap-1.5 px-1"
              aria-label={`Tijdlijn van ${p.name}`}
            >
              {p.timeline.map((song) => (
                <motion.li
                  key={song.id}
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 220, damping: 20 }}
                >
                  <CompactCard song={song} />
                </motion.li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Het tafelblad is een ellips (rounded-[50%/20%]): aan de uiteinden loopt de rand naar beneden
 * en schuin weg. De stoelen volgen die kromming: de buitenste staan dichter bij de rand en
 * een beetje gedraaid, loodrecht op de rand, zoals je ze bij een echte ovale tafel zet.
 */
const RY = 0.2; // verticale straal van de ronding, als deel van de tafelhoogte
const TABLE_SHARE = 0.84; // tafelhoogte als deel van de ruimte om de tafel heen
const ASPECT = 0.55; // gemiddelde hoogte gedeeld door breedte van de tafel

function chairSpot(p: number) {
  const u = (p - 0.5) / 0.5; // -1 (uiterst links) tot 1 (uiterst rechts)
  const root = Math.sqrt(1 - u * u);
  return {
    key: p,
    left: `calc(${p * 100}% - 3.5rem)`,
    drop: RY * (1 - root) * 100 * TABLE_SHARE,
    angle: (Math.atan((RY * ASPECT * 2 * u) / root) * 180) / Math.PI,
  };
}

const CHAIR_SPOTS = [0.2, 0.4, 0.6, 0.8].map(chairSpot);

/** Stoelen die half onder de tafel geschoven staan (alleen op grotere schermen). */
function Chairs() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 hidden md:block"
    >
      {CHAIR_SPOTS.map((s) => (
        <Fragment key={s.key}>
          <Chair
            className="absolute"
            style={{
              left: s.left,
              top: `calc(2px + ${s.drop}%)`,
              transform: `rotate(${s.angle}deg)`,
            }}
          />
          <Chair
            flip
            className="absolute"
            style={{
              left: s.left,
              bottom: `calc(2px + ${s.drop}%)`,
              transform: `rotate(${-s.angle}deg)`,
            }}
          />
        </Fragment>
      ))}
    </div>
  );
}

export function Table({ view }: { view: GameView }) {
  const { state: g, me, act, exit, code, lost } = view;
  const player = g.players[g.active];

  const [dragging, setDragging] = useState(false);
  const { stampName, pulse, pulseKey, shuffling } = useTableEffects(view);
  // Alleen het tafelscherm (of een gedeeld apparaat) speelt de muziek.
  const musicSource = useMusic((s) => s.source);
  const musicActive = me === null && musicSource === "spotify";
  useHostMusic(musicActive, g.currentId, g.phase === "finished");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 120, tolerance: 8 },
    }),
    useSensor(KeyboardSensor),
  );

  // Wie mag nu iets doen? Een gedeeld apparaat of het tafelscherm (me === null) mag alles.
  const isMine = (id: number) => me === null || me === id;
  const placing = g.phase === "placing";
  const stealer =
    g.phase === "steal"
      ? g.players.find((p) => p.id === g.stealQueue[0])
      : undefined;
  const myTurnToPlace = placing && isMine(player.id);
  const myTurnToSteal = Boolean(stealer) && isMine(stealer?.id ?? -1);
  const showSlots =
    myTurnToPlace || (g.phase === "steal" && g.stealing && myTurnToSteal);
  const onSlot = (index: number) =>
    act(myTurnToPlace ? { type: "place", index } : { type: "stealAt", index });
  const taken = new Map(g.placements.map((p) => [p.index, p.playerId]));
  const winner = g.players.find((p) => p.id === g.winnerId);
  const lastCard =
    g.players.some((p) => p.timeline.length >= g.target) || g.deckCount === 0;

  function handleBuy(playerId: number) {
    act({ type: "buy", playerId });
    toast.success(
      `${g.players.find((p) => p.id === playerId)?.name} wisselt ${BUY_COST} tokens in voor een kaartje.`,
    );
  }

  function handleDragEnd(event: DragEndEvent) {
    setDragging(false);
    const id = event.over?.id;
    if (showSlots && typeof id === "string" && id.startsWith("slot-")) {
      onSlot(Number(id.replace("slot-", "")));
    }
  }

  const mysteryDisabled = !showSlots;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={() => setDragging(true)}
      onDragCancel={() => setDragging(false)}
      onDragEnd={handleDragEnd}
    >
      <main className="floor relative flex flex-1 flex-col items-center gap-3 overflow-hidden px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] sm:px-6">
        <FabricDefs />
        <Plant className="pointer-events-none absolute -right-10 top-28 hidden size-48 min-[1700px]:block" />
        <Plant className="pointer-events-none absolute -left-12 bottom-16 hidden size-52 min-[1700px]:block" />
        <Ambient pulse={pulse} pulseKey={pulseKey} />

        <header className="relative z-30 flex w-full max-w-[1500px] flex-col items-center gap-3 rounded-2xl bg-stone-950/85 p-3 text-white shadow-lg backdrop-blur">
          <div className="flex w-full flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-black tracking-tight">Hitster</h1>
              {code ? (
                <span className="rounded-full bg-white/10 px-3 py-0.5 text-sm font-bold tracking-widest ring-1 ring-white/25">
                  <span className="sr-only">Spelcode </span>
                  {code}
                </span>
              ) : null}
            </div>
            <div className="flex items-center gap-1">
              <RulesButton autoOpenOnce />
              <FullscreenToggle />
              <SoundToggle />
              <button
                type="button"
                onClick={exit}
                className="flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm text-white/85 hover:bg-white/10"
              >
                <LogOut className="size-4" aria-hidden />
                {me !== null ? "Verlaten" : "Stoppen"}
              </button>
            </div>
          </div>
          <Scoreboard view={view} onBuy={handleBuy} />
        </header>

        {lost ? (
          <output className="relative z-30 flex items-center gap-2 rounded-xl bg-red-950/90 px-4 py-2 text-sm font-semibold text-white">
            <WifiOff className="size-4" aria-hidden />
            Verbinding verbroken. Opnieuw verbinden…
          </output>
        ) : null}

        {/* De kamer: vloerkleed met daarop de ovale houten eettafel, van bovenaf */}
        <div className="relative flex w-full max-w-[1500px] flex-1 flex-col">
          <div className="relative flex flex-1 flex-col px-2 py-6 md:px-6 md:py-[4.5rem]">
            <div
              aria-hidden
              className="rug absolute -inset-x-3 inset-y-0 rounded-[2.5rem] md:rounded-[4.5rem]"
            />
            <Chairs />

            <div className="relative z-10 flex flex-1 flex-col">
              <div
                aria-hidden
                className="wood-edge pointer-events-none absolute inset-x-0 -bottom-[11px] top-[10px] rounded-[2rem] sm:rounded-[50%/20%]"
              />
              <section
                aria-label="Speeltafel"
                className="wood-top relative flex flex-1 flex-col justify-between gap-6 rounded-[2rem] p-4 sm:rounded-[50%/20%] sm:px-24 sm:py-12"
              >
                <OtherTimelines view={view} />

                <div className="flex flex-col items-center gap-4">
                  <Deck remaining={g.deckCount} shuffling={shuffling}>
                    {!shuffling &&
                    (placing || g.phase === "steal") &&
                    g.currentId ? (
                      <motion.div
                        key={g.currentId}
                        initial={{ y: -50, x: -60, rotate: -8, opacity: 0 }}
                        animate={{ y: 0, x: 0, rotate: 0, opacity: 1 }}
                        transition={{
                          type: "spring",
                          stiffness: 180,
                          damping: 18,
                        }}
                      >
                        <MysteryCard disabled={mysteryDisabled} />
                      </motion.div>
                    ) : null}
                    {g.phase === "reveal" && g.result ? (
                      <FlipCard key={g.result.song.id} result={g.result} />
                    ) : null}
                  </Deck>

                  {musicActive ? <MusicControls /> : null}

                  <div
                    className="flex min-h-12 flex-col items-center gap-3 text-center"
                    aria-live="polite"
                  >
                    {placing ? (
                      <>
                        <p className={`${PLATE} font-semibold`}>
                          {myTurnToPlace
                            ? me === null
                              ? `${player.name}, waar hoort dit nummer?`
                              : "Jij bent aan de beurt: waar hoort dit nummer?"
                            : `${player.name} kiest een plek voor dit nummer.`}
                          <span className="block text-sm font-normal text-white/80">
                            {myTurnToPlace
                              ? "Sleep het kaartje naar de tijdlijn of tik op een plus-knop. "
                              : "Luister goed. Misschien wil je straks HITSTER! roepen. "}
                            ({g.deckCount + 1} kaartjes in de stapel)
                          </span>
                        </p>
                        {myTurnToPlace && g.tokensEnabled ? (
                          <button
                            type="button"
                            onClick={() => act({ type: "skip" })}
                            disabled={player.tokens < 1 || g.deckCount === 0}
                            className={GHOST_BUTTON}
                          >
                            <SkipForward className="size-4" aria-hidden />
                            Ander nummer (1 token)
                          </button>
                        ) : null}
                      </>
                    ) : null}

                    {stealer ? (
                      <div className="flex flex-col items-center gap-3">
                        <p className={`${PLATE} font-semibold`}>
                          {myTurnToSteal
                            ? me === null
                              ? `${stealer.name}, wil je stelen?`
                              : "Wil jij stelen?"
                            : `${stealer.name} bedenkt of er gestolen wordt…`}
                          <span className="block text-sm font-normal text-white/80">
                            Kost 1 token. Je kiest een andere plek. Heeft{" "}
                            {player.name} het fout, dan krijg jij het kaartje
                            als jouw plek klopt.
                          </span>
                        </p>
                        {myTurnToSteal ? (
                          g.stealing ? (
                            <p className={`${PLATE} text-sm text-gold`}>
                              Kies nu een plek in de tijdlijn van {player.name}.
                            </p>
                          ) : (
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => act({ type: "beginSteal" })}
                                className="min-h-12 rounded-xl bg-gold px-6 text-lg font-black text-black hover:brightness-110"
                              >
                                HITSTER! (1 token)
                              </button>
                              <button
                                type="button"
                                onClick={() => act({ type: "pass" })}
                                className="min-h-12 rounded-xl bg-stone-950/80 px-5 font-semibold text-white hover:bg-stone-950"
                              >
                                Pas
                              </button>
                            </div>
                          )
                        ) : null}
                      </div>
                    ) : null}

                    {g.phase === "reveal" && g.result ? (
                      <>
                        <p className={`${PLATE} font-semibold`}>
                          {resultMessage(g.result, g.players, player.id)}
                        </p>
                        {isMine(player.id) ? (
                          <div className="flex flex-wrap items-center justify-center gap-2">
                            {g.tokensEnabled ? (
                              <button
                                type="button"
                                onClick={() => act({ type: "claimBonus" })}
                                disabled={
                                  g.bonusClaimed || player.tokens >= MAX_TOKENS
                                }
                                className={GHOST_BUTTON}
                              >
                                {g.bonusClaimed
                                  ? "Token ontvangen"
                                  : "Artiest en titel goed geraden? +1 token"}
                              </button>
                            ) : null}
                            <button
                              type="button"
                              onClick={() => act({ type: "next" })}
                              className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-gold px-6 py-2 font-bold text-black hover:brightness-110"
                            >
                              {lastCard
                                ? "Bekijk de uitslag"
                                : "Volgende beurt"}
                              <ArrowRight className="size-5" aria-hidden />
                            </button>
                          </div>
                        ) : (
                          <p className="text-sm text-white/90">
                            <span className={PLATE}>
                              Wachten tot {player.name} verdergaat.
                            </span>
                          </p>
                        )}
                      </>
                    ) : null}
                  </div>
                </div>

                {/* Tijdlijn van de speler die aan de beurt is */}
                <div>
                  <p className="mx-auto mb-2 w-fit rounded-full bg-stone-950/75 px-4 py-1 text-sm font-semibold uppercase tracking-wide text-white">
                    <span
                      aria-hidden
                      className="mr-2 inline-block size-2.5 rounded-full"
                      style={{ background: playerColor(player.id) }}
                    />
                    Tijdlijn van {player.name}
                    {me === player.id ? " (jij)" : ""}
                  </p>
                  <div className="w-full overflow-x-auto pb-3 pt-2">
                    <ul className="mx-auto flex w-max items-center gap-2 px-2">
                      {Array.from(
                        { length: player.timeline.length + 1 },
                        (_, i) => {
                          const song = player.timeline[i];
                          const takenBy = taken.get(i);
                          const takenPlayer =
                            takenBy === undefined
                              ? undefined
                              : g.players.find((p) => p.id === takenBy);
                          return (
                            <Fragment key={song?.id ?? "end"}>
                              {g.phase === "steal" && takenPlayer ? (
                                <li>
                                  {takenPlayer.id === player.id ? (
                                    <PlacedCard
                                      name={takenPlayer.name}
                                      color={playerColor(takenPlayer.id)}
                                    />
                                  ) : (
                                    <StealToken
                                      name={takenPlayer.name}
                                      color={playerColor(takenPlayer.id)}
                                    />
                                  )}
                                </li>
                              ) : showSlots ? (
                                <li>
                                  <Slot
                                    index={i}
                                    label={describeSlot(player.timeline, i)}
                                    onPlace={onSlot}
                                  />
                                </li>
                              ) : null}
                              {song ? (
                                <motion.li
                                  initial={{ scale: 0.6, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  transition={{
                                    type: "spring",
                                    stiffness: 220,
                                    damping: 20,
                                  }}
                                >
                                  <SongCard
                                    song={song}
                                    highlight={
                                      g.phase === "reveal" &&
                                      g.result?.winnerId === player.id &&
                                      g.result.song.id === song.id
                                    }
                                  />
                                </motion.li>
                              ) : null}
                            </Fragment>
                          );
                        },
                      )}
                    </ul>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>

      {/* Het sleepkaartje blijft precies onder je vinger. */}
      <DragOverlay dropAnimation={null}>
        {dragging ? (
          <div className="rotate-3 scale-105">
            <CardBack label="Welk jaar?" />
          </div>
        ) : null}
      </DragOverlay>

      <HitsterStamp name={stampName} />

      <AnimatePresence>
        {g.phase === "finished" && winner ? (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="winner-title"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4"
          >
            <div className="w-full max-w-sm rounded-3xl bg-stone-900 p-8 text-center text-white ring-2 ring-gold">
              <Trophy className="mx-auto size-14 text-gold" aria-hidden />
              <h2 id="winner-title" className="mt-3 text-3xl font-black">
                {winner.name} wint!
              </h2>
              <p className="mt-2 text-white/80">
                Met {winner.timeline.length} kaartjes in de tijdlijn.
              </p>
              <button
                type="button"
                onClick={exit}
                // biome-ignore lint/a11y/noAutofocus: focus hoort in de dialoog
                autoFocus
                className="mt-6 min-h-12 w-full rounded-xl bg-gold px-6 font-bold text-black hover:brightness-110"
              >
                {me !== null ? "Naar het beginscherm" : "Nieuw spel"}
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </DndContext>
  );
}
