# Benny's Portal

Internes Mitarbeiterportal der RP-Werkstatt „Benny's“ auf dem GTA-RP-Server DNP (FiveM).
Es loggen sich nur Mitarbeiter ein – Accounts legt der Chef an, es gibt keine
Selbstregistrierung.

## Stack (exakt gepinnt)

| Bereich | Version |
|---|---|
| Node | 26 |
| Next.js (App Router) | 16.4.5 |
| React / React-DOM | 19.3.1 |
| Tailwind CSS (CSS-first, `@theme`) | 4.3.4 |
| shadcn/ui | 4.23.0 |
| Prisma + `@prisma/adapter-pg` | 7.10.1 |
| PostgreSQL | 17 (Docker Compose) |
| Better Auth (`username`, `admin`, `nextCookies`) | 1.7.17 |
| zod | 4.6.7 |
| motion | 14.9.1 |
| next-themes | 0.4.6 |
| Vitest | 5.1.0 |
| Playwright | 1.64.1 |

Zwei Besonderheiten: `src/proxy.ts` ersetzt `middleware.ts`, und der Prisma-Client wird aus
`@/generated/prisma/client` importiert (er liegt in `src/generated/prisma`).

## Befehle

```bash
npm run dev            # Entwicklungsserver
npm run typecheck      # tsc --noEmit
npm run lint           # ESLint
npm run test:unit      # Vitest: Projekte unit + ui
npm run test:int       # Vitest: integration gegen Test-DB
npm run test:e2e       # Playwright gegen Produktions-Build
npm run db:up          # Postgres-Container (dev + test) – nutzt docker-compose.dev.yml
npm run db:migrate     # prisma migrate dev
npm run db:seed        # Seed gegen Dev-DB
npm run db:test:reset  # Test-DB zurücksetzen
```

Vor jedem „fertig“: `npm run typecheck && npm run lint && npm run test:unit && npm run test:int`.
Bei UI-Änderungen zusätzlich der passende E2E-Test.

## Struktur

Fachlogik liegt in `src/features/<modul>/` (`schemas.ts`, `service.ts`, `actions.ts`,
`queries.ts`, `components/`). Services bekommen einen `SessionContext`, validieren mit zod,
prüfen ihre Rechte selbst und schreiben in einer Prisma-Transaktion, gefolgt von einem
Audit-Eintrag. Gemeinsame Bausteine sind in `src/lib/` (prisma, auth, dal, action,
permissions, format, errors, audit, storage).

## Doku

- Spec (Quelle der Wahrheit): `docs/superpowers/specs/2026-11-05-bennys-portal-design.md`
- Pläne je Phase: `docs/superpowers/plans/`
- Logo-Entwürfe: `docs/brand/logo-entwuerfe/`
- Regeln für KI-Agenten: `AGENTS.md`
- Bilder der Login-Seite mit Fotograf und Quelle: `public/login/CREDITS.md`
- Lizenzen der Materialien: `LICENSES/third-party.md`
- Deploy-Checkliste: `docs/deploy/coolify.md`

Deployment über Coolify auf dem eigenen VPS macht der Projektinhaber manuell.

## Umgebung

`.env` aus `.env.example` kopieren, dann `npm run db:up`, `npm run db:migrate` und
`npm run db:seed`. Secrets und RP-interne Werte (Admin-Zugang, Funk-Kanal, Funk-Passwort)
stehen nur in Umgebungsvariablen und werden nicht committet. Das Repo ist öffentlich.
