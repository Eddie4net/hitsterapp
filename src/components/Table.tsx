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
      className={`flex h-36 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-dashed transition-all sm:h-44 ${
        isOver
          ? "w-16 border-gold bg-gold/30 text-gold"
          : "border-white/30 text-white/60 hover:w-14 hover:border-gold hover:text-gold"
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
      className="flex h-36 w-10 shrink-0 flex-col items-center justify-center gap-1 rounded-xl bg-gold/20 text-gold ring-1 ring-gold/60 sm:h-44"
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
                : "bg-white/10 text-white ring-1 ring-white/20"
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
    <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-white/80">
      {others.map((p) => (
        <p key={p.id}>
          <span className="font-semibold text-white">{p.name}:</span>{" "}
          <span className="tabular-nums">
            {p.timeline.map((s) => s.year).join(" · ")}
          </span>
        </p>
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
      <main className="flex flex-1 flex-col items-center gap-4 bg-[radial-gradient(ellipse_at_top,#14503c,#0b1210_70%)] px-3 py-4 sm:px-6">
        <header className="flex w-full max-w-5xl flex-col items-center gap-3">
          <div className="flex w-full items-center justify-between">
            <h1 className="text-xl font-black tracking-tight">Hitsterapp</h1>
            <div className="flex items-center gap-1">
              <SoundToggle />
              <button
                type="button"
                onClick={reset}
                className="flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm text-white/80 hover:bg-white/10"
              >
                <RotateCcw className="size-4" aria-hidden />
                Stoppen
              </button>
            </div>
          </div>
          <Scoreboard />
        </header>

        {/* De tafel: groen vilt met een houten rand */}
        <section
          aria-label="Speeltafel"
          className="relative flex w-full max-w-5xl flex-1 flex-col justify-between gap-6 rounded-[2rem] border-[14px] border-wood bg-felt p-4 shadow-[inset_0_0_80px_rgba(0,0,0,0.55),0_30px_60px_rgba(0,0,0,0.6)] ring-2 ring-wood-light sm:rounded-[50%/22%] sm:p-10"
        >
          <OtherTimelines />

          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-6">
              {/* Stapel */}
              <div className="relative h-36 w-28 sm:h-44 sm:w-32" aria-hidden>
                <div className="absolute inset-0 translate-x-2 translate-y-2 rounded-xl bg-black/50" />
                <div className="absolute inset-0 translate-x-1 translate-y-1 rounded-xl bg-black/60" />
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
                  <p className="font-semibold">
                    {player.name}, waar hoort dit nummer?
                    <span className="block text-sm font-normal text-white/70">
                      Sleep het kaartje naar de tijdlijn of tik op een
                      plus-knop. ({deck.length + 1} kaartjes in de stapel)
                    </span>
                  </p>
                  <button
                    type="button"
                    onClick={skip}
                    disabled={player.tokens < 1 || deck.length === 0}
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/30 px-4 text-sm font-semibold hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <SkipForward className="size-4" aria-hidden />
                    Ander nummer (1 token)
                  </button>
                </>
              ) : null}

              {stealer ? (
                <div className="flex flex-col items-center gap-3">
                  <p className="font-semibold">
                    {stealer.name}, wil je stelen?
                    <span className="block text-sm font-normal text-white/70">
                      Kost 1 token. Je kiest een andere plek. Heeft{" "}
                      {player.name} het fout, dan krijg jij het kaartje als jouw
                      plek klopt.
                    </span>
                  </p>
                  {stealing ? (
                    <p className="text-sm text-gold">
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
                        className="min-h-11 rounded-xl border border-white/30 px-5 font-semibold hover:bg-white/10"
                      >
                        Pas
                      </button>
                    </div>
                  )}
                </div>
              ) : null}

              {phase === "reveal" && result ? (
                <>
                  <p className="font-semibold">
                    {resultMessage(result, players, player.id)}
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={claimBonus}
                      disabled={bonusClaimed || player.tokens >= MAX_TOKENS}
                      className="min-h-11 rounded-xl border border-white/30 px-4 text-sm font-semibold hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
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
            <p className="mb-2 text-center text-sm font-semibold uppercase tracking-wide text-white/70">
              Tijdlijn van {player.name}
            </p>
            <div className="w-full overflow-x-auto pb-3">
              <ul className="mx-auto flex w-max items-center gap-2 px-2">
                {Array.from({ length: player.timeline.length + 1 }, (_, i) => {
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
                          layout
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
                })}
              </ul>
            </div>
          </div>
        </section>
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
            <div className="w-full max-w-sm rounded-3xl bg-felt p-8 text-center ring-2 ring-gold">
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
