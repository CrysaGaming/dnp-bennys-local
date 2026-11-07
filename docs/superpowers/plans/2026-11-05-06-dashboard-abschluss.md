# Benny's Portal – Plan 06: Dashboard und Abschluss (Phase 10)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dashboard mit echten Kennzahlen, Audit-Log-Ansicht, Security-Header und ein lokal geprüftes Produktions-Image samt Deploy-Checkliste. Das Deployment selbst macht der Projektinhaber manuell.

**Architecture:** Dashboard-Abfragen in `src/features/dashboard/queries.ts`, Tagesgrenzen in `Europe/Berlin`. Das Audit-Log nutzt Keyset-Paginierung über `(createdAt, id)`.

**Tech Stack:** wie Übersicht; shadcn `chart` (Recharts).

**Spec:** `docs/superpowers/specs/2026-11-05-bennys-portal-design.md` (Abschnitte 4.3, 5.1, 5.6, 8, 13)

## Global Constraints

Gelten wie in `2026-11-05-00-uebersicht.md`.

## Review Focus

Kein Punkt aus der Übersicht. Zusätzlich abgedeckt: Umsatz kurz nach Mitternacht (Berliner Zeit) zählt zum neuen Tag, nicht nach UTC (Task 10.1).

---

### Task 10.1: Dashboard-Abfragen

**Files:**
- Create: `src/features/dashboard/days.ts`, `src/features/dashboard/days.test.ts`, `src/features/dashboard/queries.ts`, `tests/integration/dashboard.test.ts`

**Interfaces:**
- Produces:
  - `berlinDayStart(d: Date): Date`, `lastNDaysBerlin(n: number, now: Date): Array<{ start: Date; end: Date; label: string }>` (Label `"05.11."`)
  - `getDashboardStats(): Promise<{ openOrders: number; revenueToday: number; onDuty: { count: number; total: number }; lowStockParts: number }>` (`openOrders` = `OPEN` + `IN_PROGRESS`; `revenueToday` = Summe der heute bezahlten Rechnungen, `paidAt` Berliner Tag; `total` = aktive Mitarbeiter)
  - `getRevenueLast7Days(now: Date): Promise<Array<{ label: string; revenue: number }>>`
  - `getOnDutyList(now: Date): Promise<Array<{ employeeId: string; name: string; image: string | null; rankColor: string; minutes: number }>>`
  - `getRecentOrders(limit: number): Promise<Array<{ number: number; customer: string; plate: string | null; status: OrderStatus; total: number; createdAt: Date }>>`

- [ ] **Step 1: Failing Tests**

```ts
// days.test.ts
expect(berlinDayStart(new Date("2026-11-05T23:30:00Z")).toISOString()).toBe("2026-11-05T23:00:00.000Z"); // 00:30 am 06.11.
expect(lastNDaysBerlin(7, new Date("2026-11-05T12:00:00Z")).map((d) => d.label))
  .toEqual(["30.10.", "31.10.", "01.11.", "02.11.", "03.11.", "04.11.", "05.11."]);
```
`dashboard.test.ts`:
- Rechnung bezahlt `2026-11-05T23:30:00Z` ($500) und `2026-11-05T22:30:00Z` ($300); `now = 2026-11-06T10:00:00Z` → `revenueToday` 500
- `openOrders` zählt `OPEN` und `IN_PROGRESS`, nicht `DONE` oder `CANCELLED`
- `lowStockParts` zählt Teile mit `stock < minStock`
- `getRevenueLast7Days` liefert 7 Einträge, fehlende Tage mit 0

- [ ] **Step 2: Ausführen** → FAIL
- [ ] **Step 3: Implementieren** – Tagesgrenzen über `Intl.DateTimeFormat` mit `timeZone: "Europe/Berlin"`, Summen per Prisma `aggregate` bzw. `groupBy`.
- [ ] **Step 4: Ausführen** → PASS
- [ ] **Step 5: Commit** – `feat(dashboard): Kennzahlen-Abfragen`

### Task 10.2: Dashboard-Oberfläche

**Files:**
- Create: `src/features/dashboard/components/kpi-card.tsx`, `src/features/dashboard/components/count-up.tsx`, `src/features/dashboard/components/count-up.test.tsx`, `src/features/dashboard/components/revenue-chart.tsx`, `src/features/dashboard/components/on-duty-list.tsx`, `src/features/dashboard/components/recent-orders.tsx`, `tests/e2e/dashboard.spec.ts`
- Modify: `src/app/(portal)/dashboard/page.tsx`, shadcn `add chart`

**Interfaces:**
- Consumes: Abfragen aus Task 10.1, `formatMoney`, `formatDuration`

- [ ] **Step 1: Failing Tests**
  - `count-up.test.tsx`: `<CountUp value={1200} format={formatMoney} />` zeigt nach Ablauf (fake timers, 800 ms) „$1.200“; bei reduzierter Bewegung sofort „$1.200“
  - `dashboard.spec.ts`: Factory legt 2 offene Aufträge und ein knappes Teil an → Karten „Offene Aufträge“ = 2 und „Lager“ = „1 knapp“ sichtbar; Tabelle „Letzte Aufträge“ zeigt die Auftragsnummern
- [ ] **Step 2: Ausführen** → FAIL
- [ ] **Step 3: Implementieren** nach Spec 5.1 und 4.3:
  - KPI-Karten mit Hover-Lift.
  - Umsatz-Chart 7 Tage im Sunset-Verlauf.
  - Liste „Gerade im Dienst“ mit Avatar und Dauer.
  - „Letzte Aufträge“: 10 Einträge, Link zur Detailseite.
- [ ] **Step 4: Ausführen** → PASS
- [ ] **Step 5: Commit** – `feat(dashboard): Dashboard mit KPIs, Chart und Listen`

### Task 10.3: Audit-Log-Ansicht

**Files:**
- Create: `src/features/audit/queries.ts`, `src/features/audit/cursor.ts`, `src/features/audit/cursor.test.ts`, `src/app/(portal)/audit/page.tsx`, `src/features/audit/components/audit-table.tsx`, `tests/integration/audit-view.test.ts`
- Modify: `src/components/layout/nav-config.ts` (Verwaltung: „Audit-Log“ `/audit`, Icon `ScrollText`, Recht `AUDIT_VIEW`), `src/components/layout/nav-config.test.ts`

**Interfaces:**
- Produces:
  - `encodeCursor(c: { createdAt: Date; id: string }): string`, `decodeCursor(s: string): { createdAt: Date; id: string } | null` (base64url-JSON, ungültig → `null`)
  - `listAudit(ctx, q: { entity?: string; actorId?: string; from?: Date; to?: Date; cursor?: string; limit?: number }): Promise<{ rows: AuditRow[]; nextCursor: string | null }>` (`AUDIT_VIEW`, Standard-Limit 50, sortiert nach `createdAt desc, id desc`)

- [ ] **Step 1: Failing Tests**
  - `cursor.test.ts`: Hin- und Rückweg ergibt dieselben Werte; `decodeCursor("kaputt")` → `null`
  - `audit-view.test.ts`: 120 Einträge → Seite 1 hat 50 und einen `nextCursor`, Seite 3 hat 20 und `nextCursor: null`; keine Überschneidung zwischen den Seiten; Filter `entity: "Resource"` liefert nur solche; ohne `AUDIT_VIEW` → `ForbiddenError`
  - `nav-config.test.ts` ergänzen: Admin sieht in „Verwaltung“ die Einträge `["Firma", "Audit-Log"]`
- [ ] **Step 2: Ausführen** → FAIL
- [ ] **Step 3: Implementieren**
  - Tabellenspalten: Zeit, Person, Aktion, Objekt, Details. Die Details zeigen vorher/nachher als ausklappbaren JSON-Diff.
  - „Weitere laden“ über `?cursor=`.
- [ ] **Step 4: Ausführen** → PASS
- [ ] **Step 5: Commit** – `feat(audit): Audit-Log-Ansicht`

### Task 10.4: Security-Header

**Files:**
- Modify: `next.config.ts`
- Create: `tests/e2e/security-headers.spec.ts`

**Interfaces:**
- Produces: Header auf allen Antworten:
  - `Content-Security-Policy` mit `default-src 'self'; img-src 'self' data: blob:; media-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `X-Content-Type-Options: nosniff`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`

- [ ] **Step 1: Failing E2E** – `const res = await request.get("/login"); expect(res.headers()["content-security-policy"]).toContain("frame-ancestors 'none'"); expect(res.headers()["content-security-policy"]).toContain("media-src 'self'"); expect(res.headers()["referrer-policy"]).toBe("strict-origin-when-cross-origin");`
- [ ] **Step 2: Ausführen** → FAIL
- [ ] **Step 3: Implementieren** über `headers()` in `next.config.ts`
- [ ] **Step 4: Ausführen** – Run: `npm run test:e2e` → alle PASS. Mit offener DevTools-Konsole auf Login, Dashboard und Logo-Vorschau prüfen: keine CSP-Verstöße (Fonts laufen über `next/font` lokal, das passt zu `font-src 'self'`).
- [ ] **Step 5: Commit** – `feat(security): Security-Header`

### Task 10.5: Deploy-Vorbereitung

**Files:**
- Create: `docs/deploy/coolify.md`, `LICENSES/third-party.md`
- Modify: `Dockerfile`, `docker-entrypoint.sh` (falls nötig), `README.md`

**Interfaces:**
- Consumes: Spec 13 komplett

- [ ] **Step 1: Image lokal komplett prüfen**

Run: `npm run db:test:reset && docker build -t bennys-portal:local .`
Run: `docker run --rm -d --name bennys-local -p 3200:3000 -e DATABASE_URL=postgresql://bennys:bennys@host.docker.internal:5433/bennys_test -e BETTER_AUTH_SECRET=lokaler-test-secret-mit-32-zeichen! -e BETTER_AUTH_URL=http://localhost:3200 -e SEED_ADMIN_USERNAME=admin -e SEED_ADMIN_PASSWORD=Start-Passwort-123 -e SEED_RADIO_CHANNEL=1234 -e SEED_RADIO_PASSWORD=0000 -e UPLOAD_DIR=/app/uploads bennys-portal:local`
Expected: `docker logs bennys-local` zeigt Migration, Seed und Server-Start; `curl -s localhost:3200/api/health` → `{"status":"ok","db":"ok"}`; im Browser Login mit `admin`, Passwortwechsel, Dashboard sichtbar, Avatar-Upload klappt. Danach `docker stop bennys-local`.

- [ ] **Step 2: Checkliste schreiben** – `docs/deploy/coolify.md` aus Spec 13.1–13.6 als abhakbare Liste:
  - Projekt anlegen, PostgreSQL mit Backups, Application aus Public Repository mit Build Pack Dockerfile und Port 3000.
  - Domain und DNS-A-Record, Umgebungsvariablen (Tabelle 13.3, nur Runtime), Persistent Storage `/app/uploads`, Health Check `/api/health`.
  - Webhook für Auto-Deploy, Restore-Test.
  - Hinweis zum öffentlichen Repo (13.5).
- [ ] **Step 3: Lizenzen** – `LICENSES/third-party.md` mit den vollen Texten von MIT (Tabler Icons), ISC (Lucide) und dem Hinweis auf die SIL OFL 1.1 (Anton, Pacifico, Geist) sowie die Unsplash- und Pexels-Lizenz für die Bilder (Verweis auf `public/login/CREDITS.md`).
- [ ] **Step 4: README** – kurz: Zweck, lokale Einrichtung (`npm ci`, `.env` aus `.env.example`, `npm run db:up`, `npm run db:migrate`, `npm run db:seed`, `npm run dev`), Tests, Verweis auf Spec, Pläne und Deploy-Checkliste.
- [ ] **Step 5: Commit** – `docs: Deploy-Checkliste, Lizenzen und README`

### Task 10.6: Gesamtprüfung

**Files:** keine neuen

- [x] **Step 1: Alles ausführen** – Run: `npm run typecheck && npm run lint && npm run test:unit && npm run test:int && npm run test:e2e`
Expected: alles grün

Ergebnis 2026-11-06: Typecheck grün, Lint grün (eine Warnung von der TanStack-Regel), 197 Unit/ui, 157 Integration, 48 E2E. E2E läuft seit Phase 9 in einem Worker – zwei Specs schrieben dieselbe Singleton-Zeile des Treue-Sets parallel.
Nachlauf 2026-11-07 nach den zwei Fixes aus Step 3: Typecheck grün, Lint grün (dieselbe Warnung),
203 Unit/ui (50 Dateien), 157 Integration, 50 E2E – alles grün.
- [x] **Step 2: Spec-Abgleich** – Erfolgskriterien aus Spec 1 einzeln im Browser prüfen (Login, Redirect, Header-Daten, serverseitige Rechte, Musik mit Nutzeraktion und Mute, Light/Dark, reduzierte Bewegung) und das Ergebnis im PR-Text festhalten.
  Ergebnis 2026-11-06. Was automated trägt: Login und Redirect (Umleitung auf `/settings?pw=1`, fehlendes Profil gibt eine Meldung statt Stillschweigen – `auth.spec.ts`, `login-notice.test.ts`, `dal.test.ts`). Header-Daten und Status (`shell.spec.ts` Breite, `status.spec.ts` API mit Session). Serverseitige Rechte – jede Fachfunktion prüft selbst, die Tests laufen ohne UI-Rechte (`ranks.test.ts`, `employees.test.ts`, `inventory.test.ts`, `orders.test.ts`, `invoices.test.ts`, `audit-view.test.ts`). Musik startet nie ohne Nutzeraktion und ein abgelehntes `play()` ist der Zustand `blocked` (`first-interaction.test.ts`, `login-scene.spec.ts`, `dashboard-music.spec.ts`, Autoplay-Test mit eigenem Profil). Reduzierte Bewegung: CSS-Regel für `[data-reduced-motion]` plus Tests, Hydration bleibt gleich (`template.test.tsx`, `login-scene.spec.ts`). Light/Dark: Umschalter ohne Client-Differenz geprüft (`theme-toggle.test.tsx`). Der **Login-Schirm ist visiert** (Screenshot über den MCP-Chrome): dunkler Overlay über `intro.webp`, Benny's-Logo in der Scriptschrift, „DRÜCKE EINE TASTE ODER KLICKE“ in Geist Mono, Buchstabenabstand wie in Spec 6.1 – passt. Das Aussehen des Dashboards in Light und Dark ist noch nicht visiert, weil ich im MCP-Browser nicht reinkam: der von Hand gestartete Server auf 3100 liest `.env` (Dev-DB mit `debug1` und `seedadmin`), der Login mit den Test-Platzhaltern wurde abgelehnt. Für die Dashboard-Bilder und den Lighthouse-Wert brauchst du einen Lauf mit echter Session.
  Der Dashboard-Lighthouse-Wert steht weiterhin aus: ohne Session leitet `/dashboard` auf `/login`, und der Audit-Lauf im Browser brachte das Dokument nicht auf `/dashboard`.
  Ergebnis 2026-11-07: Dashboard in Dark und Light ist jetzt visiert (Screenshot über den MCP-Chrome mit
  echter Sitzung: dunkler Hintergrund nahe `oklch` 0, Karten mit `border-border`, Accent Pink, Scriptschrift
  im Logo, Sidebar mit den sieben Gruppen; dieselbe Seite hell: Hintergrund fast weiß, Karten weiß, Text dunkel,
  Umschalter oben im Header). Die Konsole auf `/login` (ohne Sitzung) und `/dashboard` (mit Sitzung) war leer –
  bis der Zod-Befund in Step 3 behoben war; danach wieder leer.
- [x] **Step 3: Lighthouse** – `/login` und `/dashboard` (Mobile): Performance ≥ 85, Accessibility ≥ 90.
  Lauf 2026-11-07 mit echtem Chrome (chrome-launcher, `--headless=new`, Fenster 412×823), Mobile-Emulation
  412×823 bei DPR 1,75, Throttling 150 ms RTT und 4× CPU, Lighthouse 13.6. Der `NO_FCP`-Fehler vom
  letzten Lauf erschien nicht.

  - `/login` (ohne Sitzung): Performance **100**, Accessibility **100**. FCP 1,23 s, SI 1,49 s, TBT 62 ms,
    TTI 3,49 s, LCP 1,23 s, CLS 0.
  - `/dashboard` (mit Sitzung, Login über `/api/auth/sign-in/username`, Cookie per CDP gesetzt):
    Performance **98**, Accessibility **100**. FCP 1,71 s, SI 2,35 s, TBT 112 ms, TTI 4,08 s, LCP 1,71 s, CLS 0.

  Zwei Befunde aus dem Lauf, beide behoben (Commit `fix: Befunde aus der Gesamtprüfung`):

  1. **`aria-prohibited-attr` im Dashboard-Chart.** `aria-label` auf einem `div` ohne Rolle wird von axe
     verworfen – der Name kam bei 96 durch, aber der Chart war für Screenreader nicht benannt.
     Root Cause: `ChartContainer` in `revenue-chart.tsx` trug `aria-label` ohne Rolle.
     TDD: erst `src/features/dashboard/components/revenue-chart.test.tsx` (rot – `getByRole("img")` findet
     nichts), dann `role="img"` am Container, grün. Dazu `tests/e2e/dashboard.spec.ts` mit derselben
     Erwartung (rot gegen den alten Build, grün nach dem Fix).
     Nach dem Fix: Accessibility **100** und Agentic Browsing **100** (vorher 96 und 50).
  2. **CSP-Verstoß auf `/login` (`kEvalViolation`).** Der Client-Bundle rief `Function("")`: Zod v4 prüft
     beim ersten Parsen, ob es kompilieren darf. Die CSP (`script-src 'self' 'unsafe-inline'`, Spec 13.6)
     lässt das nicht zu.
     Root Cause: Zod v4 kompiliert Validator mit `new Function` und prüft das beim ersten Parsen mit der
     Probe `Function("")`. Die CSP verbietet die Ausführung im Browser.
     Fix: `src/lib/zod.ts` setzt `z.config({ jitless: true })` – die Kompilierung bleibt aus – und die
     Fachmodule importieren `z` daraus (`import { z } from "@/lib/zod"`).
     TDD: erst `src/lib/zod.test.ts` (rot – das Parsen erreicht `new Function`), dann der Fix, grün.
     Playwright sieht CSP-Verstöße nicht in der Konsole (DevTools zeigt sie nur im Issues-Panel), darum zählt
     der Test die `Function`-Aufrufe im Browser – rot mit 1, grün mit 0.
     Nach dem Fix ist die Konsole auf `/login` wieder leer.

  Fallstrick für den `/login`-Wert: mit Sitzung leitet `/login` auf `/dashboard` um, und Lighthouse bewertet
  dann das Dokument nach dem Redirect (Performance 73, `mainDocumentUrl = /dashboard`). Für `/login` muss die
  Sitzung leer sein.

  Der Lauf läuft jetzt mit `scripts/audit.mjs` (echter Chrome über chrome-launcher, `--headless=new`, Fenster
  412×823, Mobile-Emulation, simulates Throttling). Zwei Fehler darin waren die eigentliche Ursache für den
  ausbleibenden Dashboard-Wert:
  1. `lighthouse(url, opts, flags)` – die Signatur ist `lighthouse(url, flags, config)`. Mit der falschen
     Reihenfolge kam `No artifacts were defined on the config`, und der LHR liegt in Lighthouse 13.6 unter
     `res.lhr` (nicht `res.lighthouse`). Jetzt: `chrome-remote-interface` als Dev-Dependency, `defaultConfig`
     als drittes Argument.
  2. Der Playwright-Storage-State reicht nicht: der Cookie liegt im Jar, aber der Dokument-Request von
     Lighthouse kommt ohne ihn an – die Antwort ist die Umleitung auf `/login`. Die Session wird jetzt über
     den echten Login (`/api/auth/sign-in/username`) geholt und per `Network.setCookie` auf Browserebene
     gesetzt. Die Zugangsdaten kommen aus `.env` (`SEED_ADMIN_USERNAME`, `SEED_ADMIN_PASSWORD`), nicht aus dem
     Repo.
  `reportLine` markiert die Umleitung – das ist der Test, der diesen Fall fängt (`lighthouse-report.test.ts`).
  Beim Nachlauf lief ein von Hand gestarteter Server auf 3100 (ohne die Playwright-Umgebung, darum ohne
  `BETTER_AUTH_URL`) – `reuseExistingServer` nahm ihn und jede Seite leitete auf `/login` um. Vor dem Lauf muss
  Port 3100 frei sein.
- [x] **Step 4: Commit** (falls Korrekturen nötig waren) – `fix: Befunde aus der Gesamtprüfung`
  Commits 2026-11-07: `fix(dashboard): Chart-Container braucht eine Rolle für den aria-label`,
  `fix(csp): Zod im jitless-Modus – die CSP erlaubt keine neue Function`,
  `fix(scripts): audit.mjs läuft jetzt – falsche Argumentreihenfolge und Session auf Browserebene`,
  `chore: chrome-remote-interface für die Lighthouse-Läufe`.
