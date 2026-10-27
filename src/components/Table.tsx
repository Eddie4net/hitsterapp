"use client";

import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { ArrowRight, Plus, RotateCcw, SkipForward, Trophy } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Fragment, useEffect } from "react";
import { toast } from "sonner";
import { describeSlot, MAX_TOKENS } from "@/game/rules";
import { useGameStore } from "@/game/store";
import type { Result } from "@/game/types";
import { playCue } from "@/lib/feedback";
import { CardBack, SongCard } from "./SongCard";
import { SoundToggle } from "./SoundToggle";

const SLOT_HEIGHT = "h-32 sm:h-40";

/** Donker doorschijnend vlak: houdt tekst op het houten blad goed leesbaar. */
const PLATE =
  "rounded-2xl bg-stone-950/75 px-4 py-2 text-white shadow-lg backdrop-blur-sm";

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
      className={`flex ${SLOT_HEIGHT} w-10 shrink-0 items-center justify-center rounded-lg border-2 border-dashed bg-black/30 transition-all ${
        isOver
          ? "w-16 border-white bg-white/30 text-white"
          : "border-white/80 text-white hover:w-14 hover:bg-black/45"
      }`}
    >
      <Plus className="size-5" aria-hidden />
    </button>
  );
}

/** Toont dat iemand al voor deze plek heeft gekozen (zonder het jaar te verklappen). */
function TakenMarker({ name }: { name: string }) {
  return (
    <div
      role="img"
      aria-label={`${name} legde het kaartje hier`}
      className={`flex ${SLOT_HEIGHT} w-10 shrink-0 items-center justify-center rounded-lg bg-stone-950/80 text-gold ring-1 ring-gold/70`}
    >
      <span className="text-lg font-black" aria-hidden>
        {name.slice(0, 1).toUpperCase()}
      </span>
    </div>
  );
}

function MysteryCard({ disabled }: { disabled: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: "mystery", disabled });
  return (
    <button
      type="button"
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      aria-label="Raadkaartje. Sleep het naar de tijdlijn, of kies een plek met de plus-knoppen."
      style={
        transform
          ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
          : undefined
      }
      className={`relative touch-none ${disabled ? "cursor-default" : "cursor-grab active:cursor-grabbing"} ${
        isDragging ? "z-50 scale-105 rotate-3" : ""
      }`}
    >
      <CardBack label="Welk jaar?" />
    </button>
  );
}

function Scoreboard() {
  const { players, active, target, phase } = useGameStore();
  return (
    <ul className="flex flex-wrap items-center justify-center gap-2">
      {players.map((p, i) => {
        const isActive = i === active && phase !== "finished";
        return (
          <li
            key={p.id}
            aria-current={isActive ? "true" : undefined}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold ${
              isActive
                ? "bg-gold text-black"
                : "bg-white/10 text-white ring-1 ring-white/25"
            }`}
          >
            {p.name} · {p.timeline.length}/{target} · {p.tokens} tokens
          </li>
        );
      })}
    </ul>
  );
}

function OtherTimelines() {
  const { players, active } = useGameStore();
  const others = players.filter((_, i) => i !== active);
  return (
    <div className="flex flex-wrap justify-center gap-2 text-xs">
      {others.map((p) => (
        <p
          key={p.id}
          className="rounded-full bg-stone-950/70 px-3 py-1 text-white"
        >
          <span className="font-semibold">{p.name}:</span>{" "}
          <span className="tabular-nums">
            {p.timeline.map((s) => s.year).join(" · ")}
          </span>
        </p>
      ))}
    </div>
  );
}

/** Stoelen die onder de rand van de tafel vandaan komen (alleen decoratie). */
function Chairs() {
  const spots = ["left-[16%]", "left-[44%]", "left-[72%]"];
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 hidden md:block"
    >
      {spots.map((left) => (
        <Fragment key={left}>
          <div
            className={`chair absolute top-1 h-14 w-28 rounded-2xl ${left}`}
          />
          <div
            className={`chair absolute bottom-1 h-14 w-28 rounded-2xl ${left}`}
          />
        </Fragment>
      ))}
    </div>
  );
}

function resultMessage(
  result: Result,
  players: { id: number; name: string }[],
  activeId: number,
): string {
  const { song, winnerId } = result;
  const where = `${song.title} komt uit ${song.year}.`;
  if (winnerId === activeId) return `Goed! ${where}`;
  const winner = players.find((p) => p.id === winnerId);
  if (winner) return `${winner.name} steelt het kaartje! ${where}`;
  return `Niemand had het goed. ${where}`;
}

export function Table() {
  const {
    phase,
    players,
    active,
    current,
    deck,
    result,
    winnerId,
    target,
    placements,
    stealQueue,
    stealing,
    bonusClaimed,
    place,
    stealAt,
    beginSteal,
    pass,
    skip,
    claimBonus,
    next,
    reset,
  } = useGameStore();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 120, tolerance: 8 },
    }),
    useSensor(KeyboardSensor),
  );

  const player = players[active];
  const placing = phase === "placing";
  const stealer =
    phase === "steal" ? players.find((p) => p.id === stealQueue[0]) : undefined;
  const showSlots = placing || (phase === "steal" && stealing);
  const onSlot = placing ? place : stealAt;
  const taken = new Map(placements.map((p) => [p.index, p.playerId]));

  // Laat altijd zien wat er gebeurde, met geluid en tekst. Alleen bij een
  // nieuw resultaat, niet bij elke wijziging van de spelers.
  // biome-ignore lint/correctness/useExhaustiveDependencies: bewust alleen `result`
  useEffect(() => {
    if (!result) return;
    const message = resultMessage(result, players, player.id);
    if (result.winnerId === player.id) {
      toast.success(message);
      playCue("correct");
    } else if (result.winnerId !== null) {
      toast.success(message);
      playCue("steal");
    } else {
      toast.error(message);
      playCue("wrong");
    }
  }, [result]);

  const winner = players.find((p) => p.id === winnerId);
  useEffect(() => {
    if (phase === "finished") playCue("win");
  }, [phase]);

  function handleDragEnd(event: DragEndEvent) {
    const id = event.over?.id;
    if (showSlots && typeof id === "string" && id.startsWith("slot-")) {
      onSlot(Number(id.replace("slot-", "")));
    }
  }

  const lastCard =
    players.some((p) => p.timeline.length >= target) || deck.length === 0;

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <main className="floor flex flex-1 flex-col items-center gap-3 px-3 py-4 sm:px-6">
        <header className="flex w-full max-w-5xl flex-col items-center gap-3 rounded-2xl bg-stone-950/85 p-3 text-white shadow-lg backdrop-blur">
          <div className="flex w-full items-center justify-between">
            <h1 className="text-xl font-black tracking-tight">Hitsterapp</h1>
            <div className="flex items-center gap-1">
              <SoundToggle />
              <button
                type="button"
                onClick={reset}
                className="flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm text-white/85 hover:bg-white/10"
              >
                <RotateCcw className="size-4" aria-hidden />
                Stoppen
              </button>
            </div>
          </div>
          <Scoreboard />
        </header>

        {/* De kamer: vloerkleed met daarop de ovale houten eettafel, van bovenaf */}
        <div className="relative flex w-full max-w-5xl flex-1 flex-col px-2 py-6 md:px-10 md:py-16">
          <div aria-hidden className="rug absolute inset-0 rounded-3xl" />
          <Chairs />

          <section
            aria-label="Speeltafel"
            className="wood-top relative z-10 flex flex-1 flex-col justify-between gap-6 rounded-[2rem] p-4 sm:rounded-[50%/22%] sm:px-16 sm:py-12"
          >
            <OtherTimelines />

            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-6">
                {/* Stapel */}
                <div className="relative size-32 sm:size-40" aria-hidden>
                  <div className="absolute inset-0 translate-x-2 translate-y-2 rounded-lg bg-black/55" />
                  <div className="absolute inset-0 translate-x-1 translate-y-1 rounded-lg bg-black/65" />
                  <div className="absolute inset-0">
                    <CardBack />
                  </div>
                </div>

                <div className="relative">
                  <AnimatePresence mode="wait">
                    {(placing || phase === "steal") && current ? (
                      <motion.div
                        key={current.id}
                        initial={{ y: -60, x: -80, rotate: -10, opacity: 0 }}
                        animate={{ y: 0, x: 0, rotate: 0, opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{
                          type: "spring",
                          stiffness: 180,
                          damping: 18,
                        }}
                      >
                        <MysteryCard disabled={!showSlots} />
                      </motion.div>
                    ) : null}
                    {phase === "reveal" && result ? (
                      <motion.div
                        key={`reveal-${result.song.id}`}
                        initial={{ rotateY: 90, opacity: 0 }}
                        animate={{ rotateY: 0, opacity: 1 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        style={{ perspective: 800 }}
                        className={
                          result.winnerId === null ? "opacity-80 grayscale" : ""
                        }
                      >
                        <SongCard
                          song={result.song}
                          highlight={result.winnerId !== null}
                        />
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              </div>

              <div
                className="flex min-h-12 flex-col items-center gap-3 text-center"
                aria-live="polite"
              >
                {placing ? (
                  <>
                    <p className={`${PLATE} font-semibold`}>
                      {player.name}, waar hoort dit nummer?
                      <span className="block text-sm font-normal text-white/80">
                        Sleep het kaartje naar de tijdlijn of tik op een
                        plus-knop. ({deck.length + 1} kaartjes in de stapel)
                      </span>
                    </p>
                    <button
                      type="button"
                      onClick={skip}
                      disabled={player.tokens < 1 || deck.length === 0}
                      className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-stone-950/80 px-4 text-sm font-semibold text-white hover:bg-stone-950 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <SkipForward className="size-4" aria-hidden />
                      Ander nummer (1 token)
                    </button>
                  </>
                ) : null}

                {stealer ? (
                  <div className="flex flex-col items-center gap-3">
                    <p className={`${PLATE} font-semibold`}>
                      {stealer.name}, wil je stelen?
                      <span className="block text-sm font-normal text-white/80">
                        Kost 1 token. Je kiest een andere plek. Heeft{" "}
                        {player.name} het fout, dan krijg jij het kaartje als
                        jouw plek klopt.
                      </span>
                    </p>
                    {stealing ? (
                      <p className={`${PLATE} text-sm text-gold`}>
                        Kies nu een plek in de tijdlijn van {player.name}.
                      </p>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={beginSteal}
                          className="min-h-11 rounded-xl bg-gold px-5 font-bold text-black hover:brightness-110"
                        >
                          Steel (1 token)
                        </button>
                        <button
                          type="button"
                          onClick={pass}
                          className="min-h-11 rounded-xl bg-stone-950/80 px-5 font-semibold text-white hover:bg-stone-950"
                        >
                          Pas
                        </button>
                      </div>
                    )}
                  </div>
                ) : null}

                {phase === "reveal" && result ? (
                  <>
                    <p className={`${PLATE} font-semibold`}>
                      {resultMessage(result, players, player.id)}
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={claimBonus}
                        disabled={bonusClaimed || player.tokens >= MAX_TOKENS}
                        className="min-h-11 rounded-xl bg-stone-950/80 px-4 text-sm font-semibold text-white hover:bg-stone-950 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {bonusClaimed
                          ? "Token ontvangen"
                          : "Artiest en titel goed geraden? +1 token"}
                      </button>
                      <button
                        type="button"
                        onClick={next}
                        className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-gold px-6 py-2 font-bold text-black hover:brightness-110"
                      >
                        {lastCard ? "Bekijk de uitslag" : "Volgende beurt"}
                        <ArrowRight className="size-5" aria-hidden />
                      </button>
                    </div>
                  </>
                ) : null}
              </div>
            </div>

            {/* Tijdlijn van de speler die aan de beurt is */}
            <div>
              <p className="mx-auto mb-2 w-fit rounded-full bg-stone-950/75 px-4 py-1 text-sm font-semibold uppercase tracking-wide text-white">
                Tijdlijn van {player.name}
              </p>
              <div className="w-full overflow-x-auto pb-3">
                <ul className="mx-auto flex w-max items-center gap-2 px-2">
                  {Array.from(
                    { length: player.timeline.length + 1 },
                    (_, i) => {
                      const song = player.timeline[i];
                      const takenBy = taken.get(i);
                      const takenName =
                        takenBy === undefined
                          ? undefined
                          : players.find((p) => p.id === takenBy)?.name;
                      return (
                        <Fragment key={song?.id ?? "end"}>
                          {phase === "steal" && takenName ? (
                            <li>
                              <TakenMarker name={takenName} />
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
                                  phase === "reveal" &&
                                  result?.winnerId === player.id &&
                                  result.song.id === song.id
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
      </main>

      <AnimatePresence>
        {phase === "finished" && winner ? (
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
                onClick={reset}
                // biome-ignore lint/a11y/noAutofocus: focus hoort in de dialoog
                autoFocus
                className="mt-6 min-h-12 w-full rounded-xl bg-gold px-6 font-bold text-black hover:brightness-110"
              >
                Nieuw spel
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </DndContext>
  );
}
