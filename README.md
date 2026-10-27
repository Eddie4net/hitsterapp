# Hitsterapp

Een webversie van het kaartspel Hitster: leg muziekkaartjes in de juiste volgorde op de tafel. Gebouwd met Next.js, Tailwind, Motion en Zustand.

## Zo speel je

- **Tafelscherm + telefoons (aanbevolen):** open de app op een groot scherm (laptop, tablet, tv) en kies "Tafelscherm + telefoons". Iedereen scant de QR-code met de eigen telefoon en kiest een naam. De tafel houdt de spelstatus bij en speelt (straks) de muziek; de telefoons sturen alleen hun keuzes.
- **Op één apparaat:** je geeft één telefoon of tablet door.
- **Meedoen:** voer de viercijferige letter-code in, of scan de QR-code van het tafelscherm.

De regels volgen de officiële Hitster-regels (10 kaartjes om te winnen, 2 tokens, overslaan, HITSTER! stelen, 3 tokens inwisselen voor een kaartje, maximaal 5 tokens).

## Ontwikkelen

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # regels en netwerklaag
npm run build
```

## Spelen met telefoons (Supabase Realtime)

Telefoons en het tafelscherm praten via Supabase Realtime (Broadcast, geen database nodig). Zonder instelling werkt alleen een testmodus tussen tabbladen in dezelfde browser.

1. Maak een gratis project op supabase.com.
2. Kopieer de project-URL en de anon key (Project Settings, API).
3. Zet ze in `.env.local` (zie `.env.example`) en in de omgevingsvariabelen van je Vercel-project:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Lukt verbinden niet, controleer dan in het Supabase-dashboard bij Realtime of publieke kanalen zijn toegestaan.

## Hoe het netwerk werkt

- De host (tafelscherm) is de enige bron van waarheid. Telefoons sturen een bedoeling ("leg het kaartje hier"), de host controleert of die speler nu mag en voert het uit (`src/net/intents.ts`).
- Telefoons krijgen een openbare weergave (`src/net/publicState.ts`) zonder het jaartal van het kaartje dat nog geraden moet worden.
- Een telefoon die wegvalt, meldt zich vanzelf opnieuw aan en krijgt dezelfde speler terug.

## Nog te doen

- Spotify-koppeling en echt afspelen op het tafelscherm.
- Jaartallen controleren (Spotify geeft vaak het jaar van een heruitgave).
