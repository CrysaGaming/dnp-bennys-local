# AGENTS.md – Benny's Portal (DNP Roleplay)

Anleitung für KI-Agenten (Claude Code, Codex & Co.) in diesem Repo. Gilt für jede Änderung.

## Projekt

Internes Mitarbeiterportal der RP-Werkstatt „Benny's“ auf dem GTA-RP-Server DNP (FiveM). Nur Mitarbeiter loggen sich ein. Accounts legt der Chef an, es gibt keine Selbstregistrierung.

**Quellen der Wahrheit**, in dieser Reihenfolge:
1. Spec: `docs/superpowers/specs/2026-11-05-bennys-portal-design.md`
2. Pläne: `docs/superpowers/plans/2026-11-05-00-uebersicht.md` und die Plan-Dateien `01` bis `06`
3. Dieser Text

Widerspricht Code der Spec, gilt die Spec. Weicht ein Plan von der Spec ab: nachfragen, nicht raten.

## Stack (exakt gepinnt)

| Paket | Version |
|---|---|
| Node | 26 (lokal `v26.1.0`, Docker `node:26-alpine`) |
| next | 16.4.5 (App Router, `src/proxy.ts` statt `middleware.ts`) |
| react / react-dom | 19.3.1 |
| tailwindcss | 4.3.4 (CSS-first, Tokens in `src/app/globals.css`) |
| shadcn (CLI) | 4.23.0 |
| prisma / @prisma/client / @prisma/adapter-pg | 7.10.1 |
| better-auth | 1.7.17 (Plugins `username`, `admin`, `nextCookies`) |
| zod | 4.6.7 |
| motion | 14.9.1 |
| next-themes | 0.4.6 |
| vitest | 5.1.0 |
| @playwright/test | 1.64.1 |

- Neue Pakete immer mit `--save-exact` installieren.
- **Nie** `prisma@latest` verwenden: Der Tag zeigt auf `8.0.0-rc.30`.
- Den generierten Prisma-Client aus `@/generated/prisma/client` importieren.

## Befehle

```bash
npm run dev            # Entwicklungsserver
npm run typecheck      # tsc --noEmit
npm run lint           # ESLint
npm run test:unit      # Vitest: Projekte unit + ui
npm run test:int       # Vitest: integration gegen Test-DB (Port 5433)
npm run test:e2e       # Playwright gegen Produktions-Build
npm run db:up          # Postgres-Container (dev 5432, test 5433)
npm run db:migrate     # prisma migrate dev
npm run db:seed        # Seed gegen Dev-DB
npm run db:test:reset  # Test-DB zurücksetzen
```

Vor jedem „fertig“: `npm run typecheck && npm run lint && npm run test:unit && npm run test:int`. Bei UI-Änderungen zusätzlich den passenden E2E-Test laufen lassen.

## Struktur

```
src/
  app/(auth)/login/        Login-Szene (immer dunkel)
  app/(portal)/…           geschützte Seiten
  app/api/                 auth, health, status, files
  components/ui/           shadcn (nicht von Hand umbauen)
  components/layout/       Header, Sidebar, Footer, nav-config.ts
  components/brand/        BrandLogo, logo-data.ts (generiert)
  components/music/        MusicProvider
  features/<modul>/        schemas.ts · service.ts · actions.ts · queries.ts · components/
  lib/                     prisma, auth, dal, action, permissions, format, errors, audit, storage
prisma/                    schema.prisma, migrations/, seed.ts
tests/                     integration/, e2e/, helpers/, setup/
docs/                      Spec, Pläne, Logo-Entwürfe, Deploy-Checkliste
```

## Muster für Fachlogik

- **Service-Funktionen** in `features/<modul>/service.ts` bekommen `ctx: SessionContext` als ersten Parameter. Sie validieren mit zod, prüfen Rechte selbst und schreiben in einer Prisma-Transaktion. Danach folgt `writeAudit(tx, { action: "<modul>.<aktion>", … })`.
- **Server Actions** (`actions.ts`, `"use server"`) sind dünn: `runAction((ctx) => service(ctx, input), { revalidate })`. Sie liefern `ActionResult<T>`.
- **Seiten** holen den Kontext mit `requireSession()` bzw. `requirePagePermission(p)`. Der Proxy prüft nur den Cookie und ist **keine** Sicherheitsgrenze.
- **Fehler** nur über die Klassen aus `src/lib/errors.ts`. Die deutschen Meldungen erzeugt `toActionError`.
- **Bestand** nur über `bookStock`, **Treue** nur über `bookLoyalty`, **Preise** nur über `calcOrderTotals`. Diese Funktionen nicht umgehen.
- Doppelte Werte über Unique-Constraints abfangen (`P2002` → `ConflictError`), nicht nur per Vorabprüfung.

## Fachregeln (aus der Spec)

- UI-Texte Deutsch, Code-Bezeichner Englisch.
- Zahlen deutsch formatiert: `$12.500`, `1,5 kg`. Nur über `src/lib/format.ts`.
- Geld: `Int` in ganzen Dollar. Gewicht: `Int` in Gramm (Eingabe in kg, Punkt oder Komma als Dezimaltrenner).
- Zeiten in UTC speichern, in `Europe/Berlin` anzeigen.
- Rechte hängen am Rang (`Rank.permissions`). Die Abhängigkeiten stehen in `PERMISSION_META.implies`.
- Der Admin-Rang (`isSystem`) ist geschützt. Der letzte aktive Admin kann nicht gesperrt oder herabgestuft werden.
- Man verwaltet nur Ränge und Mitarbeiter **unter** dem eigenen Level und vergibt nur Rechte, die man selbst hat.
- Kein Hard-Delete. Ausnahmen: `Resource` und Kunden ohne Aufträge und Treue-Buchungen.
- Animationen nur über `transform` und `opacity`. `prefers-reduced-motion` und die User-Einstellung „Bewegungen reduzieren“ schalten sie auf Fades um.
- Musik startet nie ohne Nutzeraktion. Ein abgelehntes `play()` ist ein Zustand (`blocked`), kein Fehler.

## Sicherheit – öffentliches Repo

- Keine Secrets, Passwörter oder RP-internen Werte (Funk-Kanal, Funk-Passwort, Admin-Zugang) in Code, Seed, Tests, Commits oder Doku. Sie kommen aus Umgebungsvariablen (`SEED_*`, siehe `.env.example`).
- In Tests nur Platzhalter wie `1234` und `0000`.
- `.env*` wird nie committet, außer `.env.example`. Der pre-commit-Hook (secretlint) muss grün sein und wird nie mit `--no-verify` umgangen.
- Keine Rockstar-Assets (Logos, Artworks, Schriften). Bilder nur aus `public/login/CREDITS.md`, Logos nur aus `docs/brand/logo-entwuerfe/`.

## Tests

- Arbeitsweise: TDD. Erst ein roter Test, dann minimaler Code, dann grün.
- `src/**/*.test.ts` sind Unit-Tests (Node), `src/**/*.test.tsx` UI-Tests (jsdom), `tests/integration/**` laufen gegen die echte Test-DB (`resetDb()` vor jedem Test).
- Testdaten nur über `tests/helpers/factories.ts` (`makeCtx`, `createCustomer`, …).
- E2E: `tests/e2e/`, Admin-Storage-State aus `global-setup.ts`.

## Git

- Arbeit pro Phase auf einem Branch `phase-<nr>-<name>`, Merge nach `main` erst mit grünem Testlauf.
- Conventional Commits mit deutschem Text, z. B. `feat(kunden): Kennzeichen normalisieren`.
- Migrationen nie nachträglich ändern, sondern immer eine neue anlegen. Zusatz-SQL (CHECKs, Partial-Indizes) per `prisma migrate dev --create-only` ergänzen.
- Deployment (Coolify) macht der Projektinhaber manuell. Agenten deployen nicht.

## Nicht tun

- `middleware.ts` anlegen (Next 16 nutzt `src/proxy.ts`).
- DB-Abfragen im Proxy.
- Rechte nur in der UI prüfen.
- `localStorage` für Daten nutzen, die Nutzer teilen oder die bleiben müssen. Es ist nur für Komfort-Einstellungen gedacht, Zugriff immer in `try/catch`.
- `src/components/brand/logo-data.ts` von Hand ändern. Stattdessen `node scripts/extract-logos.mjs` ausführen.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
