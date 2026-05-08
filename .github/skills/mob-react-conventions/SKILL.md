---
name: mob-react-conventions
description: Kodekonvensjoner, mønstre og stilregler for React-mikrofrontender i NAV Utbetalingsportalen (sokos-react-template). Bruk til kodegjennomgang, skriving av ny kode, og verifisering av at koden følger teamets standarder.
license: MIT
compatibility: React with Vite, TypeScript, pnpm
metadata:
  domain: frontend
  tags: react typescript vite pnpm biome css-modules bem aksel swr axios zod msw playwright nav utbetalingsportalen mikrofrontend nais nanostores
---

# mob-react-conventions

Konvensjoner for React-mikrofrontender i NAV Utbetalingsportalen. Kanonisk referanse: [navikt/sokos-react-template](https://github.com/navikt/sokos-react-template).

Når du blir bedt om å **gjennomgå kode**: gå gjennom alle reglene og rapporter brudd med filsti, linjereferanse og konkret rettelse.
Når du blir bedt om å **skrive ny kode**: følg alle reglene uten unntak.

---

## 1. Pakkebehandler og runtime

- **Pakkebehandler**: `pnpm` (>=10.16.0). Aldri `npm install` eller `yarn`.
- **Node**: >=24.13.0.
- **Lock-fil**: Alltid commit `pnpm-lock.yaml`. Aldri commit `package-lock.json` eller `yarn.lock`.

---

## 2. Bygg og verktøy

- **Bundler**: Vite med `@vitejs/plugin-react` og `vite-plugin-css-injected-by-js`.
- **Output**: Én `bundle.js` (ESM, `preserveEntrySignatures: "exports-only"`), external: `react`, `react-dom`.
- **Base-path**: `/mikrofrontend` (justeres til appens route ved deploy).
- **TypeScript**: strict mode, `target: "ESNext"`, `moduleResolution: "Bundler"`, `noEmit: true`.
- **Linter/Formatter**: Biome — aldri ESLint eller Prettier. Kjør `pnpm biome:fix`.
- **CSS-linter**: stylelint med `stylelint-config-standard` + `@navikt/aksel-stylelint/recommended`.
- **Git-hooks**: Husky + lint-staged (Biome på `*.{js,ts,tsx,json}`, stylelint på `*.css`).

---

## 3. TypeScript-regler

Håndhevet via `biome.json`:

| Regel | Nivå | Betydning |
|---|---|---|
| `noExplicitAny` | `error` | Aldri `any` — bruk spesifikke typer, generics, eller `unknown` |
| `noConsole` | `error` | Ingen `console.*` — supprer med `// biome-ignore lint/suspicious/noConsole: <grunn>` |
| `useImportType` | `warn` | Bruk `import type { Foo }` for type-only imports |

Ytterligere regler:
- Strict null checks — håndter `undefined`/`null` eksplisitt.
- Kun funksjonelle komponenter — ingen klassekomponenter.
- **Default export** for side- og komponentfunksjoner; **named exports** for hooks, utilities og typer.

---

## 4. Fil- og mappestruktur

```
src/
  api/
    apiService.ts          # SWR-hooks — én fil per domene/feature
    config/
      apiConfig.ts         # axios-instansfabrikk og fetcher-funksjoner
  pages/
    FooPage.tsx            # Sidekomponent (PascalCase)
    FooPage.module.css     # Co-lokalisert CSS-modul — samme navn som komponenten
  types/
    Foo.ts                 # TypeScript-typer avledet fra Zod-schemas
    schema/
      FooSchema.ts         # Zod-schemas
  util/
    environment.ts         # Miljødeteksjon
    grafanaFaro.ts         # Grafana Faro-initialisering
mock/
  handlers.ts              # MSW request-handlers
  browser.ts               # MSW browser-worker oppsett
playwright-tests/
  accessibility.spec.ts    # axe-core a11y-tester
```

Regler:
- Sidekomponenter → `src/pages/` med tilhørende `PageName.module.css`.
- API-hooks → `src/api/apiService.ts` (eller domene-scoped søsterfil).
- Zod-schemas → `src/types/schema/`. TypeScript-typer → `src/types/` avledet fra schemas.
- Utilities → `src/util/`.

---

## 5. CSS-konvensjoner

- **CSS Modules** for komponent-scopede stiler — filen heter `ComponentName.module.css`.
- **BEM-navngiving** inni moduler: `block`, `block__element`, `block--modifier`.
  - Eksempel: `.template-header`, `.template-body`, `.template-header__title`.
- **Aksel design tokens** for alle farger, spacing og shadows: `var(--a-surface-alt-1-subtle)`, `var(--a-gray-100)`.
  - Aldri hardkode hex/rgb-verdier.
- **Ingen inline styles** på JSX-elementer.
- Globale stiler kun i `src/index.css`. Importer Aksel CSS der: `@import url("@navikt/ds-css");`.
- Bruk bracket-notasjon for bindestrek-klassenavn: `styles["template-header"]`.

```css
/* ✅ Riktig */
.template-body {
  background-color: var(--a-surface-alt-1-subtle);
  padding: 2.5rem;
}

/* ❌ Feil */
.templateBody {
  background-color: #e6f0ff;
  padding: 40px;
}
```

---

## 6. UI-komponentbibliotek

- **Bruk alltid NAV Aksel** (`@navikt/ds-react`) for UI: `Heading`, `BodyLong`, `Table`, `Loader`, `Button`, etc.
- **Ikoner**: `@navikt/aksel-icons`.
- **Aldri** andre komponentbiblioteker (MUI, Ant Design, Chakra, shadcn, etc.).

```tsx
// ✅ Riktig
import { Heading, BodyLong, Table } from "@navikt/ds-react";
import { ChevronDownIcon } from "@navikt/aksel-icons";

// ❌ Feil
import { Button } from "@mui/material";
```

---

## 7. API-lag

### Axios-konfig (`src/api/config/apiConfig.ts`)

```ts
const config = (baseUri: string): CreateAxiosDefaults => ({
  baseURL: baseUri,
  timeout: 30000,              // alltid 30s
  withCredentials: true,       // alltid true
  headers: {
    Pragma: "no-cache",
    "Cache-Control": "no-cache",
    "Content-Type": "application/json",
  },
  validateStatus: (status) => status < 400,
});
```

Interceptors skal håndtere:
- `400` → `throw new HttpStatusCodeError(status)`
- `401` / `403` → `Promise.reject(error)` (platformen håndterer autentisering)
- Andre feil → `throw new ApiError("Issues with connection to backend")`

Eksporter generiske fetchers:
- `axiosFetcher<T>(baseUri, url)` — GET
- `axiosPostFetcher<T, U>(baseUri, url, body?)` — POST

### SWR-hooks (`src/api/apiService.ts`)

```ts
const BASE_URI = {
  BACKEND_API: "/mikrofrontend-api/api/v1",
};

function swrConfig<T>(fetcher: (uri: string) => Promise<T>) {
  return {
    fetcher,
    suspense: true,
    revalidateOnFocus: false,
    refreshInterval: 600000,   // 10 minutter
  };
}

export function useGetEmployee() {
  const { data, error, isValidating } = useSWRImmutable<EmployeeList>(
    `/employee`,
    swrConfig<EmployeeList>((url) =>
      axiosFetcher<EmployeeList>(BASE_URI.BACKEND_API, url),
    ),
  );
  const isLoading = (!error && !data) || isValidating;
  return { data, error, isLoading };
}
```

Regler:
- Bruk `useSWRImmutable` (ikke plain `useSWR`) for reads.
- Hook-navngiving: `useGet<Resource>` for reads, `usePost<Resource>` for mutations.
- Return-form: `{ data, error, isLoading }`.
- Base-URIer i ett `BASE_URI`-objekt øverst i filen.

### Feiltyper (`src/types/Error.ts`)

```ts
export class ApiError extends Error {}
export class HttpStatusCodeError extends Error {}
```

---

## 8. Datavalidering med Zod

Alle API-responstyper **må** ha ett Zod-schema. TypeScript-typer **avledes** fra schemas — skriv dem aldri manuelt.

```ts
// src/types/schema/EmployeeSchema.ts
import { z } from "zod";

export const EmployeeSchema = z.object({
  id: z.number(),
  name: z.string(),
  profession: z.string(),
});
export const EmployeeListSchema = z.array(EmployeeSchema);

// src/types/Employee.ts
import type { z } from "zod";
import type { EmployeeListSchema, EmployeeSchema } from "./schema/EmployeeSchema";

export type Employee = z.infer<typeof EmployeeSchema>;
export type EmployeeList = z.infer<typeof EmployeeListSchema>;
```

---

## 9. Mocking med MSW

- Bruk **MSW v2** (`msw/browser`) — ikke manuelle fetch-mocks.
- Handlers i `mock/handlers.ts`, worker-oppsett i `mock/browser.ts`.
- MSW aktiveres kun når `import.meta.env.MODE === "mock"`.
- Mock-ruter **må** speile virkelige API-stier eksakt.

```ts
// mock/handlers.ts
import { HttpResponse, http } from "msw";

export const handlers = [
  http.get("/mikrofrontend-api/api/v1/employee", () => {
    return HttpResponse.json([...], { status: 200 });
  }),
];
```

---

## 10. Testing med Playwright

- **Kun E2E** — Playwright med `@playwright/test`.
- **Ingen unit-testramme** (Jest/Vitest) — ikke legg til uten teamdiskusjon.
- Alle sider **må** ha en axe-core tilgjengelighetsteste som validerer null violations.

```ts
// playwright-tests/accessibility.spec.ts
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("Axe a11y", () => {
  test("should not have any automatically detectable accessibility issues", async ({ page }) => {
    await page.goto("/mikrofrontend");
    await page.waitForLoadState("networkidle");

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});
```

Konfig: `fullyParallel: true`, `retries: 2` (CI), `workers: 4` (CI), `forbidOnly: !!process.env.CI`.

---

## 11. Observability

- **Grafana Faro** (`@grafana/faro-web-sdk`) — initialiseres én gang i `src/util/grafanaFaro.ts`.
- Kalles fra `App.tsx` i et `useEffect([], [])`.
- **Ikke initialiser** i `mock` eller `backend` dev-modus.
- Telemetri-URLer:
  - produksjon → `https://telemetry.nav.no/collect`
  - utvikling → `https://telemetry.ekstern.dev.nav.no/collect`
  - lokalt → `http://localhost:12347`

---

## 12. Miljødeteksjon

- Bruk `getEnvironment()` fra `src/util/environment.ts` — aldri inline URL-sjekker.
- Deteksjon basert på `window.location.href`:
  - `"production"` → matcher `intern.nav.no` eller `ansatt.nav.no`
  - `"development"` → matcher `intern.dev.nav.no` eller `ansatt.dev.nav.no`
  - `"local"` → fallback

---

## 13. Sikkerhet og personvern

Dette er et kritisk finanssystem. Disse reglene er absolutte:

- ❌ **Ikke logg PII** (fødselsnummer, navn, adresse) — logg heller sakId eller referansenummer.
- ❌ **Ikke hardkod secrets** — secrets håndteres utelukkende via NAIS.
- ✅ Tilgangskontroll håndteres av portalen via AD-grupper — ikke implementer egne tilgangssperrer.

---

## 14. Språk og URL-konvensjoner

- Grensesnitt på **norsk bokmål**.
- URL-paths: norske ord translitterert til latinske tegn — ingen æ/ø/å.
  - Æ→AE, Ø→OE, Å→AA (f.eks. `/oppgjorsrapporter`, ikke `/oppgjørsrapporter`).
- Overholder **WCAG 2.1 AA** for tilgjengelighet.

---

## 15. Arkitektur: Utbetalingsportalen

Utbetalingsportalen er en **Astro-basert container** som laster inn React-mikrofrontender som client-side bundles. Brukerne er økonomimedarbeidere og NAV Kontaktsenter — dette er et kritisk finanssystem.

```
sokos-utbetalingsportalen  (Astro-portal)
├── src/config/appConfig.ts → registrering av alle mikrofrontends
├── MicrofrontendCSR.astro  → laster bundle.js dynamisk
└── src/pages/<route>/      → én Astro-side per mikrofrontend

sokos-up-<appnavn>          (React-mikrofrontend — dette repoet)
└── bundle.js               → ESM-bundle uten React/ReactDOM (eksternalisert)
```

### Hvordan mikrofrontenden lastes

Portalen laster `bundle.js` fra:
- **Lokalt**: `http://localhost:3000/<naisAppName>/bundle.js`
- **Dev/Prod**: `https://<portalens-hostname>/<naisAppName>/bundle.js`

`react` og `react-dom` leveres av portalens **importmap** og er **ikke** bundlet. Vite-konfigurasjonen eksternaliserer dem: `external: ["react", "react-dom"]`.

⚠️ React major-versjon i mikrofrontenden **må** matche portalens versjon.

---

## 16. Delt state mellom mikrofrontender (Nanostores)

For å sende data til/fra andre mikrofrontender, bruk `@nanostores/persistent` med `sessionStorage`.

```bash
pnpm add @nanostores/react @nanostores/persistent
```

```ts
// src/stores/shared.ts
import { persistentAtom, setPersistentEngine } from "@nanostores/persistent";

if (typeof window !== "undefined") {
  setPersistentEngine(sessionStorage, {
    addEventListener() {},
    removeEventListener() {},
    perKey: false,
  });
}

export const selectedId = persistentAtom<string | null>(
  "utbetalingsportalen:<appnavn>:selectedId", // unik nøkkel per app
  null,
  {
    encode: JSON.stringify,
    decode: (value) => { try { return JSON.parse(value); } catch { return null; } },
  },
);
```

Regler:
- Bruk `useStore(atom)` fra `@nanostores/react` for reaktivitet i komponenter.
- Nøkkelformat: `utbetalingsportalen:<appnavn>:<key>` — unngår kollisjoner på tvers av mikrofrontender.
- Rydd opp (`set(null)`) etter bruk dersom verdien ikke skal gjenbrukes.

---

## 17. Registrering i Utbetalingsportalen

For å legge til mikrofrontenden i portalen (gjøres i `sokos-utbetalingsportalen`-repoet):

### appConfig.ts

```ts
{
  app: "MIN-APP",                          // store bokstaver, unik nøkkel
  title: "Min App",                        // visningsnavn i menyer
  description: "Kort beskrivelse",
  adGroupDevelopment: "<uuid>",            // 0000-CA-SOKOS-MF-MIN-APP-READ
  adGroupProduction: "<uuid>",             // eller PLACEHOLDER_AD_GROUP hvis kun dev
  route: "/min-app",                       // URL-path i portalen (ingen æ/ø/å)
  naisAppName: "sokos-up-min-app",         // NAIS app-navn
}
```

AD-gruppe-navngiving: `0000-CA-SOKOS-MF-<APPNAVN>-<ROLLE>`.
NAIS app-navn konvensjon: `sokos-up-<appnavn>`.

### Astro-side i portalen

```astro
---
// src/pages/min-app/[...min-app].astro  (med routing)
import MicrofrontendCSR from "@components/microfrontend/MicrofrontendCSR.astro";
---
<MicrofrontendCSR appName="min-app" />
```

`appName` = lowercase-versjon av `app`-feltet i `appConfig.ts`.

---

## Review-sjekkliste

Rapporter brudd med filsti, linjereferanse og forslag til rettelse.

- [ ] pnpm brukt eksklusivt; `pnpm-lock.yaml` committed; ingen `package-lock.json`/`yarn.lock`
- [ ] Ingen `any`-typer; ingen bare `console.*`-kall (uten biome-ignore-kommentar)
- [ ] `import type` brukt for type-only imports
- [ ] CSS Modules med BEM-klassenavn; Aksel tokens brukt; ingen inline styles; ingen hardkodede farger
- [ ] Kun NAV Aksel-komponenter og -ikoner brukt
- [ ] `react` og `react-dom` er eksternalisert i Vite-konfig (ikke bundlet)
- [ ] API-hooks bruker `useSWRImmutable` + `swrConfig`; navngitt `useGet*`/`usePost*`; returnerer `{ data, error, isLoading }`
- [ ] Axios-konfig: 30s timeout, `withCredentials: true`, korrekte headers og interceptors
- [ ] Alle API-responstyper har Zod-schema; typer avledet med `z.infer`
- [ ] MSW-handlers speiler virkelige API-stier; MSW kun aktiv i mock-modus
- [ ] Playwright-tester finnes; axe-tilgjengelighetsteste for alle sider
- [ ] Grafana Faro initialiseres kun i ikke-mock/ikke-backend-modus
- [ ] Ingen PII i logger — kun sakId/referansenummer
- [ ] Filer i riktige mapper: `pages/`, `api/`, `types/schema/`, `util/`
- [ ] Sidekomponenter co-lokalisert med sin `.module.css`
- [ ] Kun funksjonelle komponenter; default export for komponenter; named exports for hooks/utilities
- [ ] URL-paths uten norske tegn (æ/ø/å translitterert)
