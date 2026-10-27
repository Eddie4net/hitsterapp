# Hitster

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

## Muziek met Spotify

De app speelt de nummers van je eigen Spotify-playlist af op het tafelscherm. Dat gaat zo:

1. Maak in het [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) een app. Vink bij "Which API/SDKs are you planning to use?" **Web API** en **Web Playback SDK** aan.
2. Zet bij **Settings, Redirect URIs** de link van je site met `/callback` erachter, zonder slash aan het eind. De app laat de exacte link zien op het scherm Muziek. Bijvoorbeeld:
   - `https://hitsterapp.vercel.app/callback`
   - voor lokaal testen: `http://127.0.0.1:3000/callback` (Spotify accepteert **geen** `localhost`; open de app lokaal via `http://127.0.0.1:3000`)
3. Plak je **Client ID** in de app (scherm Muziek), of zet hem als `NEXT_PUBLIC_SPOTIFY_CLIENT_ID` in Vercel. De "Client secret" heb je niet nodig. De app logt in met PKCE, zonder geheime sleutel.
4. Kies een playlist of plak een playlistlink.

Wat je moet weten over de beperkingen van Spotify (stand oktober 2026):

- **Ontwikkelmodus** (standaard voor een nieuwe app): de eigenaar van de app heeft Premium nodig, er mogen maximaal 5 accounts inloggen (voeg ze toe bij *Users management*), en je kunt **alleen de nummers van eigen of gezamenlijke playlists ophalen**. Een playlist van iemand anders of van Spotify geeft een 403. Kopieer die nummers dan naar een eigen playlist.
- **Afspelen** gebeurt met de Spotify Web Playback SDK op het tafelscherm en vraagt **Premium** van de speler die host. Het werkt het best in Chrome of Edge op een laptop. Spelers op een telefoon hoeven niet in te loggen. Spotify staat commercieel gebruik van de SDK niet toe zonder toestemming.
- **Jaartallen:** Spotify geeft het jaar van de uitgave waar het nummer op staat, en bij heruitgaven is dat vaak veel later dan de hit. Daarom zoekt de app het oorspronkelijke jaar op bij MusicBrainz (`/api/year`) en gebruikt het eerdere jaar. Voor de eerste kaartjes gebeurt dat vóór de start, de rest op de achtergrond tijdens het spel.

## Hoe het netwerk werkt

- De host (tafelscherm) is de enige bron van waarheid. Telefoons sturen een bedoeling ("leg het kaartje hier"), de host controleert of die speler nu mag en voert het uit (`src/net/intents.ts`).
- Telefoons krijgen een openbare weergave (`src/net/publicState.ts`) zonder het jaartal van het kaartje dat nog geraden moet worden.
- Een telefoon die wegvalt, meldt zich vanzelf opnieuw aan en krijgt dezelfde speler terug.

## Nog te doen

- Jaartallen controleren (Spotify geeft vaak het jaar van een heruitgave).
