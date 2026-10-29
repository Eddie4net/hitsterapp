import { writeFileSync } from "node:fs";
import { iconSvg, markSvg, wordmarkSvg } from "../src/lib/logoSvg.ts";

writeFileSync("public/icon.svg", iconSvg());
const html = `<!doctype html><meta charset="utf-8"><body style="margin:0;background:#c9a97f;display:flex;gap:40px;align-items:center;justify-content:center;flex-wrap:wrap;padding:30px;font-family:system-ui">
<svg viewBox="0 0 200 200" width="360" height="360">${markSvg("a", "disc")}</svg>
<svg viewBox="0 0 200 200" width="360" height="360">${markSvg("b", "coin")}</svg>
<div style="display:flex;gap:18px;align-items:center">
 <svg viewBox="0 0 200 200" width="128" height="128">${markSvg("c", "disc")}</svg>
 <svg viewBox="0 0 200 200" width="40" height="40">${markSvg("d", "coin")}</svg>
 <svg viewBox="0 0 200 200" width="20" height="20">${markSvg("e", "coin")}</svg>
</div>
<svg viewBox="0 0 240 52" width="480" height="104" style="background:#140a2c;border-radius:12px">${wordmarkSvg("w")}</svg>
</body>`;
writeFileSync("public/dev-logo-preview.html", html);
console.log("klaar");
