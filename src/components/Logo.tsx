"use client";

import { useId } from "react";
import { type MarkKind, markSvg, wordmarkSvg } from "@/lib/logoSvg";

/** Elke tekening heeft eigen id's nodig, anders delen twee logo's op één pagina hun verlopen. */
function useSvgId(): string {
  return `m${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
}

/** Het merkteken: neonkompas met afspeelknop en geluidsgolf, of de munt-variant. */
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

/** Het woord Spot-On in dikke oranje letters. */
export function Wordmark({ className }: { className?: string }) {
  const id = useSvgId();
  return (
    <svg
      viewBox="28 0 184 52"
      aria-hidden
      className={className}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: vaste, eigen tekening zonder invoer van gebruikers
      dangerouslySetInnerHTML={{ __html: wordmarkSvg(id) }}
    />
  );
}
