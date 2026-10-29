"use client";

import { useId } from "react";
import { type MarkKind, markSvg, wordmarkSvg } from "@/lib/logoSvg";

/** Elke tekening heeft eigen id's nodig, anders delen twee logo's op één pagina hun verlopen. */
function useSvgId(): string {
  return `m${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
}

/** Het merkteken: vinylplaat met regenboogrand en een H met geluidsgolf, of de munt-variant. */
export function LogoMark({
  kind = "disc",
  className,
}: {
  kind?: MarkKind;
  className?: string;
}) {
  const id = useSvgId();
  return (
    <svg
      viewBox="0 0 200 200"
      aria-hidden
      className={className}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: vaste, eigen tekening zonder invoer van gebruikers
      dangerouslySetInnerHTML={{ __html: markSvg(id, kind) }}
    />
  );
}

/** Het woord HITSTER in dikke letters met een kleurverloop. */
export function Wordmark({ className }: { className?: string }) {
  const id = useSvgId();
  return (
    <svg
      viewBox="0 0 240 44"
      aria-hidden
      className={className}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: vaste, eigen tekening zonder invoer van gebruikers
      dangerouslySetInnerHTML={{ __html: wordmarkSvg(id) }}
    />
  );
}
