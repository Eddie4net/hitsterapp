# Scripts voor de afbeeldingen

De houtstructuur van de tafel, het pluizige tapijt, de stoel, het logo en het app-icoon zijn
gemaakt met code, niet met een foto. Deze scripts maken ze opnieuw als je iets wilt aanpassen.

| Bestand | Maakt |
|---|---|
| `generate-textures.js` | `public/textures/wood-top.jpg`, `wood-edge.jpg` en `rug.jpg` (draait in de browser) |
| `chair-svg.mts` | de bron van `public/chair-top.png` (de beige stoel) |
| `logo-assets.mts` | `public/icon.svg` en een voorbeeldpagina van het logo (bron: `src/lib/logoSvg.ts`) |

## Texturen opnieuw maken

De generator draait in de browser (daar zit een canvas) en stuurt het resultaat naar een kleine,
tijdelijke route die het opslaat.

1. Zet `dev-save-route.ts.txt` tijdelijk als `src/app/api/dev-save/route.ts` (zonder `.txt`).
   Die route werkt alleen in ontwikkelmodus.
2. Start de app (`npm run dev`), open hem in de browser en voer in de console uit:
   ```js
   await new Promise((ok) => { const s = document.createElement("script"); s.src = "/dev-gen.js"; s.onload = ok; document.head.appendChild(s); });
   await window.hitsterGen.all();
   ```
   (Kopieer daarvoor `generate-textures.js` tijdelijk naar `public/dev-gen.js`.)
3. Verwijder `route.ts` en `public/dev-gen.js` daarna weer. Commit ze niet.

## Stoel en icoon

- Stoel: `node scripts/chair-svg.mts` schrijft `public/dev-chair.svg`. Open dat in de browser,
  teken het op een canvas van 480 x 400 en sla het op als `public/chair-top.png`.
- Icoon: `node scripts/logo-assets.mts` schrijft `public/icon.svg`. De PNG-versies
  (`icon-192.png`, `icon-512.png`, `apple-icon.png`) maak je op dezelfde manier vanuit die svg.
