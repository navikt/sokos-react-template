# sokos-react-template

Brukes som utgangspunkt for å opprette nye mikrofrontends i Utbetalingsportalen.

NB! Navngi følgende: `sokos-up-appNavn`, f.eks: `sokos-up-venteregister`

## Tilpass repo-et

1. Kjør `chmod 755 setupTemplate.sh`
2. Kjør:

   ```bash
   ./setupTemplate.sh
   ```

3. Kun spesifiser navnet på applikasjonen som skal stå etter sokos-up-`appNavn`. Hvis du ønsker `sokos-up-venteregister` så skriv inn bare `venteregister`.
4. Slett `setupTemplate.sh` hvis du er ferdig med endre navn på prosjektet
5. Templaten kommer med [Playwright](https://playwright.dev/) installert. Endre følgende filer: [playwright.config.ts](playwright.config.ts) og [accessibility.spec.ts](playwright-tests/accessibility.spec.ts). Playwright testene kan kjøres med kommandoen `pnpm exec playwright test`
6. Sett riktig namespace og team i nais manifestene, de ligger i mappen under `nais/<cluster>`
7. Velg riktig ingress til appen i nais.yaml. Ingressen bør være `https://utbetalingsportalen.intern.dev.nav.no/appNavn`
8. Repoet må legges til i [Nais Console](https://console.nav.cloud.nais.io/). Det finner du ved å gå inn på team Økonomi og repositories nest nederst til venstre.

## Kom i gang

1. Installere [Node.js](https://nodejs.dev/en/)
2. Installer [pnpm](https://pnpm.io/)
3. Installere dependencies `pnpm install && cd server && pnpm install`
4. Start appen med to følgende måter:

- Mot [Mock Service Worker](https://mswjs.io/) `mock`-server -> `pnpm run dev`
- Mot en backend kjørende lokalt på maskinen  -> `pnpm run dev:backend`
  - Gå til [vite.config.ts](/vite.config.ts), endre til riktig url som skal gå mot backend.

```javascript
...(mode === "backend" && {
        "/mikrofrontend-api/api/v1": {
          target: "http://localhost:8080",
          rewrite: (path: string) => path.replace(/^\/mikrofrontend-api/, ""),
          changeOrigin: true,
          secure: false,
        },
      }),
```

5. Bruker du ikke routing? Appen nås på <http://localhost:5173>
6. Bruker du routing? Appen nås på <http://localhost:5173/mikrofrontend>

## Oppdatere pnpm-versjon

`packageManager`-feltet i `package.json` (både rot og `server/`) er låst til en spesifikk pnpm-versjon med SHA-512-hash. Dette beskytter mot supply chain-angrep ved å sikre at Corepack alltid laster ned nøyaktig samme tarball.

For å bumpe pnpm trygt, bruk det innebygde scriptet:

```bash
pnpm run pnpm:resolve
```

Scriptet:

1. Henter alle pnpm-versjoner fra npm-registeret.
2. Filtrerer bort versjoner som er nyere enn `minimumReleaseAge` (7 dager) — dette gir tid til at supply chain-angrep oppdages.
3. Laster ned tarballen og verifiserer SHA-512 uavhengig av det npm-manifestet hevder.
4. Skriver ut en ferdig `"packageManager": "..."`-streng samt en oppdatert `engines.pnpm`-verdi du kan lime inn.

> **Husk:** Oppdater `engines.pnpm` i **både** rot-`package.json` og `server/package.json` til samme versjon som `packageManager`. Dette gjør at `engineStrict` avviser uoverensstemmende lokale pnpm-installasjoner.

### VIKTIG — verifiser før du pusher til GitHub

Selv om scriptet er hardent, er ingen kjede sterkere enn det svakeste leddet. **Før du committer og pusher endringer:**

1. Bekreft versjonen på pnpms offisielle release-side: `https://github.com/pnpm/pnpm/releases/tag/v<versjon>`
2. Sammenlign integritetshashen med npms publiserte verdi: `https://registry.npmjs.org/pnpm/<versjon>`
3. Sjekk at versjonen ikke er trukket tilbake (yanked).
4. Oppdater `engines.pnpm` i **begge** `package.json`-filer til `">=<versjon>"`.
5. Kjør `pnpm install` lokalt og bekreft at det går gjennom uten feil.
6. Lim inn samme `packageManager`-streng i **både** rot-`package.json` og `server/package.json`.
7. Åpne en PR og la CI kjøre før du merger.

## Ønsker du routing?

Templaten har ikke routing. Men om du ønsker å ha routing gjør du følgende:

1. `pnpm i react-router`
2. Erstatter følgende innhold i [App.tsx](/src/App.tsx)

```typescript
return <TemplatePage />;
```

med

```typescript
return <BrowserRouter basename="/mikrofrontend">
    <Routes>
        <Route path="/" element={<TemplatePage />} />
        <Route path="/anotherpage" element={<AnotherPage />} />
    </Routes>
  </BrowserRouter>
```

## Design

Det finnes et utkast til en designguide kan man basere seg på: [Kjerneoppsett Utbetalingsportalen](https://navno-my.sharepoint.com/:o:/g/personal/julie_utgard_nav_no/EtV6P-sYimZNsACTYqZmSbsBLeSlsvc6PP2svso_H09dZA?e=KSY5SO)
