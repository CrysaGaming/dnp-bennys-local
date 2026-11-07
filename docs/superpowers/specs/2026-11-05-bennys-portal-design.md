# Benny's Mitarbeiterportal (DNP) – Design & Plan

Stand: 2026-11-05 · Status: Entwurf zur Abstimmung

---

## 1. Ziel und Verständnis

### Was du gesagt hast

- Portal mit Login. Tech-Stack: Next.js, Tailwind, Prisma, shadcn/ui, TypeScript.
- Dashboard hinter dem Login mit modernem, stylischem Design.
- **Header:** links Logo und Firmenname. Rechts daneben Telefonnummer, Funkkanal und Status (offen/geschlossen). Ganz rechts ein Light/Dark-Toggle und ein User-Bereich (Profilbild und Name). Klick darauf öffnet ein Dropdown mit „Mein Profil“, „Meine Settings“ und „Logout“.
- **Sidebar** links mit der Navigation, **Main-Content** rechts daneben, unten ein schmaler **Footer**.
- **Login-Seite** im Stil von GTA V und GTA VI, modern, mit Animationen.
- **Hintergrundmusik** auf der Login-Seite: Suno-Song, mit einem Button zum Stummschalten.
- Zweck: internes Mitarbeiterportal der RP-Firma „Benny's“ auf dem GTA-RP-Server DNP (FiveM). Es loggen sich nur Mitarbeiter ein.
- Login mit Benutzername und Passwort. Accounts legt der Chef bzw. Admin an, es gibt keine Selbstregistrierung.
- Module in V1: Mitarbeiter & Ränge, Aufträge & Rechnungen, Lager & Preisliste, Dienstzeiten/Stempeluhr.
- Zusätzlich die Navigations-Kategorie **Kunden**:
  - Kunden anlegen mit Name, Rufnummer, Fahrzeug und Nummernschild.
  - Ein **Treuesystem**: Kunden bekommen beim Besuch Punkte oder Stempel und können sie bei einem späteren Besuch einlösen.
- Zusätzlich die Navigations-Kategorie **Ressourcen**:
  - Eine Datenbank aller Ressourcen mit Name, Gewicht und Export-Preis.
  - Oben im Main-Content ein Bereich „Ressource hinzufügen“.
  - Jede Ressource bekommt eine von drei Kategorien: Rohstoff, Zwischenprodukt oder Endprodukt.
  - Eine Filtermaske zum Filtern und Sortieren nach Kategorie sowie ein Suchfeld.
- Hintergrundbilder und Logo-Motive sollen aus freien Quellen im Web kommen (Abschnitt 12). Gewählt: die 4 empfohlenen Bilder. Das Logo wird als SVG entworfen.
- **Logo:** Alle drei Entwürfe kommen ins Portal. In den Firmeneinstellungen wählt man das Logo mit Vorschau aus. Standard: V2 „Vice City“ als Logo und V3 als Icon.
- **Header-Daten:**
  - Rufnummer: vorerst keine. Der Header zeigt „keine Rufnummer hinterlegt“, die Nummer wird später in den Firmeneinstellungen eingetragen.
  - Funk: Kanal und dahinter in runden Klammern das Funk-Passwort. Beides ist in den Firmeneinstellungen änderbar.
- **Ränge:** Zum Start gibt es nur einen Rang „Admin“ mit allen Rechten. Dazu kommt ein Ränge-Creator, in dem man Ränge selbst anlegt und Rechte per Checkboxen zuweist.
- **Musik:** auch im Dashboard.
- **Deployment:** über Coolify auf dem eigenen VPS (Projects → Add Resource → Public Git Repository).
- **Treuesystem:** eine eigene Einstellungsseite, auf der man alle Werte selbst einträgt und auswählt.
- Datenbank: PostgreSQL.

### Was ich annehme (bitte korrigieren)

| # | Annahme |
|---|---------|
| A1 | Firmenname, Logo, Telefonnummer und Funkkanal liegen in der DB und sind im Portal änderbar, nicht hart codiert. |
| A2 | Der Offen/Geschlossen-Status hat zwei Modi: **Auto** (offen, solange mindestens N Mitarbeiter eingestempelt sind) und **Manuell** (Chef schaltet um). Standard ist Auto. |
| A3 | Rechte hängen am **Rang**. Zum Start gibt es nur den Rang „Admin“, weitere Ränge entstehen im Ränge-Creator (bestätigt, 5.9). Die Better-Auth-Rolle `admin` darf zusätzlich immer alles. |
| A4 | Geld ist RP-Geld in ganzen Dollar (`Int`), ohne Cent. |
| A5 | Musik: Auf der Login-Seite startet sie nach dem Intro. Im Dashboard schaltet jeder User sie per Header-Button an oder aus. Standard ist aus, die Wahl wird pro User gespeichert (6.4). |
| A6 | Hosting über Coolify auf deinem VPS (bestätigt): App aus öffentlichem Git-Repo mit Dockerfile, PostgreSQL als Coolify-Datenbank im selben Projekt, Avatare in einem persistenten Volume. Details: Abschnitt 13. |
| A7 | UI-Sprache ist Deutsch. Zeiten werden in UTC gespeichert und in `Europe/Berlin` angezeigt. |
| A8 | „GTA-Stil“ heißt Anmutung (Farben, Typo, Loading-Screen-Gefühl). Es werden **keine** Original-Logos, -Artworks oder -Schriften von Rockstar verwendet. Auch das In-Game-Logo von „Benny's Original Motor Works“ wird nicht nachgebaut. |
| A9 | Das Treuesystem kennt zwei Modi: **Stempel** und **Punkte**. Alle Werte (Modus, Stempel pro Besuch, $ je Punkt, Mindestbetrag, Sperrzeit, Kartengröße) tragt ihr selbst auf der Seite „Treue-Einstellungen“ ein (bestätigt, 5.10). Bis zum ersten Speichern ist das Treuesystem aus, der Prämienkatalog startet leer. Ein „Besuch“ zählt, wenn die Rechnung als bezahlt markiert wird. |
| A10 | Ein Kunde kann mehrere Fahrzeuge haben. Ein Nummernschild gehört immer genau einem Fahrzeug. |
| A11 | Ressourcen: Gewicht gilt **pro Stück in kg** (bestätigt am 2026-11-05; Eingabe mit bis zu 3 Nachkommastellen, gespeichert in Gramm). Export-Preis gilt **pro Stück in $**. Die Kategorie ist Pflicht, genau eine von drei. Namen sind eindeutig, ohne Rücksicht auf Groß- und Kleinschreibung. |
| A12 | Ressourcen sind ein **Nachschlagewerk** für Server-Items (Gewicht und Exportwert), getrennt vom Werkstatt-**Lager** (Teile mit Bestand). Es gibt keine Verknüpfung zwischen beiden. |
| A13 | Zahlen werden einheitlich im deutschen Format angezeigt (Tausenderpunkt, Dezimalkomma), Dollar mit vorangestelltem `$`: `$12.500`, `1,5 kg`. |
| A14 | Die Logos enthalten den Schriftzug „Benny's“ fest. Ändert sich der Firmenname in den Einstellungen, bleibt das Logo gleich. Nur bei V3 steht der Name als Text daneben und ändert sich mit. |

### Erfolgskriterien

1. Ein Mitarbeiter loggt sich mit Benutzername und Passwort ein und landet im Dashboard.
2. Nicht eingeloggte Aufrufe von Portal-Seiten leiten auf `/login` um.
3. Der Header zeigt jederzeit den aktuellen Status, die Telefonnummer und den Funkkanal.
4. Jede Seite und jede Aktion prüft die Rechte serverseitig, nicht nur in der UI.
5. Die Login-Musik startet erst nach einer Nutzeraktion und lässt sich jederzeit stummschalten. Die Einstellung bleibt gespeichert.
6. Light und Dark Mode funktionieren auf allen Seiten. Die Login-Seite ist immer dunkel.
7. Mit `prefers-reduced-motion` laufen nur noch dezente Fades.

---

## 2. Tech-Stack

Versionen laut npm-Registry am 2026-11-05.

| Bereich | Wahl | Version | Hinweis |
|---|---|---|---|
| Framework | Next.js (App Router, RSC, Server Actions) | 16.4.x | `proxy.ts` ersetzt `middleware.ts` |
| UI-Runtime | React | 19.3.x | |
| Sprache | TypeScript, `strict: true` | 5.x | |
| Styling | Tailwind CSS (CSS-first, `@theme`) | 4.3.x | keine `tailwind.config.js` nötig |
| Komponenten | shadcn/ui (CLI `shadcn`) | 4.x | Komponenten liegen in `src/components/ui` |
| ORM | Prisma ORM + `@prisma/adapter-pg` | **7.10.x** | **Version auf `@7` pinnen**: der npm-Tag `latest` zeigt aktuell auf `8.0.0-rc.30` |
| DB | PostgreSQL | 17 | lokal per Docker Compose |
| Auth | Better Auth (Plugins `username`, `admin`, `nextCookies`) | 1.7.x | Prisma-Adapter, kein Self-Signup |
| Theme | next-themes | 0.4.x | `attribute="class"` |
| Animation | motion (ehem. Framer Motion) | 14.x | plus CSS-Keyframes für Loops |
| Validierung | zod | 4.x | Formulare und Server Actions |
| Formulare | react-hook-form + shadcn `field` | 7.x | |
| Tabellen | @tanstack/react-table | – | Version beim Setup gegen das shadcn-Data-Table-Beispiel prüfen |
| Charts | shadcn `chart` (Recharts) | – | |
| Toasts | sonner | 2.x | |
| Icons | lucide-react | – | |
| Tests | Vitest (Logik), Playwright (E2E) | – | |

**Warum Better Auth statt Auth.js:** Better Auth bringt Login per Benutzername, eine Admin-API (User anlegen, sperren, Passwort zurücksetzen), Session-Verwaltung und Rate-Limiting fertig mit. Auth.js wird inzwischen vom Better-Auth-Team gepflegt und für neue Projekte nicht mehr empfohlen.

**Schriften (über `next/font`):**
- **Anton** (Google Fonts): Display-Schrift für Headlines und Banner. Wirkt kantig und erinnert an GTA.
- **Geist Sans**: Fließtext und UI.
- **Geist Mono**: Zahlen, Dollarbeträge, Telefonnummer und Funkkanal (`tabular-nums`).
- Optional **Pricedown** (Typodermic) lokal einbinden, aber nur, wenn die Lizenz Web-Embedding erlaubt.

---

## 3. Architektur

### 3.1 Ordnerstruktur

```
.
├─ Dockerfile                   # Produktions-Image für Coolify (Next.js standalone, 13.2)
├─ docker-entrypoint.sh         # migrate deploy → seed → server starten
├─ docker-compose.yml           # Deploy-Compose für Coolify (app + db) – Coolify erkennt nur diesen
│                             # Namen im Root. Die lokalen Datenbanken stehen in docker-compose.dev.yml
├─ prisma.config.ts             # Prisma 7: Schema-Pfad, Migrations, DATABASE_URL
├─ prisma/
│  ├─ schema.prisma
│  ├─ migrations/
│  └─ seed.ts                   # Ränge, Kategorien, Firmendaten, erster Admin
├─ public/
│  ├─ audio/strassen-im-blut.mp3
│  └─ login/bg-01.webp … bg-04.webp   # eigene Artworks/Screenshots
└─ src/
   ├─ proxy.ts                  # optimistischer Session-Cookie-Check
   ├─ app/
   │  ├─ layout.tsx             # Fonts, ThemeProvider, MusicProvider, Toaster
   │  ├─ globals.css            # Tailwind v4 + Design-Tokens
   │  ├─ icon.svg               # Favicon = V3 Emblem (Next.js-Konvention)
   │  ├─ (auth)/login/
   │  │  ├─ page.tsx
   │  │  └─ _components/        # intro-splash, background-slideshow, login-form,
   │  │                         # music-player, status-banner, loading-tips
   │  ├─ (portal)/
   │  │  ├─ layout.tsx          # requireSession(), SidebarProvider, Header, Footer
   │  │  ├─ dashboard/
   │  │  ├─ kunden/             # Liste, neu, [nummer], praemien, treue-einstellungen
   │  │  ├─ ressourcen/         # Ressourcen-Datenbank (eine Seite)
   │  │  ├─ auftraege/          # Liste, neu, [nummer]
   │  │  ├─ rechnungen/
   │  │  ├─ lager/
   │  │  ├─ preisliste/
   │  │  ├─ mitarbeiter/        # Liste, neu, [id]
   │  │  ├─ raenge/
   │  │  ├─ dienstzeiten/
   │  │  ├─ einstellungen/firma/
   │  │  ├─ profil/
   │  │  └─ settings/
   │  └─ api/
   │     ├─ auth/[...all]/route.ts   # Better-Auth-Handler
   │     ├─ status/route.ts          # Firmenstatus für den Header (Polling)
   │     ├─ health/route.ts          # Health-Check für Coolify (200 + DB-Ping)
   │     └─ files/[...path]/route.ts # Avatare ausliefern
   ├─ components/
   │  ├─ ui/                    # shadcn
   │  ├─ layout/                # app-header, app-sidebar, app-footer, nav-config.ts,
   │  │                         # company-status-badge, theme-toggle, music-toggle, user-menu, clock-button
   │  ├─ music/                 # music-provider (ein <audio> im Root-Layout), login-music-player
   │  └─ brand/                 # brand-logo.tsx: alle 3 Logos als React-SVG (voll/kompakt, hell/dunkel)
   ├─ features/                 # pro Modul: queries.ts, actions.ts, schemas.ts, components/
   │  ├─ employees/  ├─ ranks/  ├─ customers/  ├─ loyalty/
   │  ├─ orders/  ├─ invoices/  ├─ inventory/  ├─ pricelist/
   │  ├─ resources/  ├─ time/  └─ company/
   ├─ lib/
   │  ├─ prisma.ts              # Singleton mit PrismaPg-Adapter
   │  ├─ auth.ts                # Better-Auth-Server-Config
   │  ├─ auth-client.ts         # createAuthClient + usernameClient + adminClient
   │  ├─ dal.ts                 # requireSession(), requirePermission(), getCurrentEmployee()
   │  ├─ permissions.ts         # Permission-Helfer, Rang-Hierarchie
   │  ├─ company-status.ts      # isOpen()-Berechnung
   │  ├─ audit.ts               # writeAudit()
   │  ├─ storage.ts             # Avatar-Upload (lokal, später S3 möglich)
   │  └─ format.ts              # Dollar, Datum, Dauer
   └─ generated/prisma/         # Prisma-Client-Output (gitignored)
```

Jedes Modul unter `features/` hat dieselbe Form:
- `queries.ts`: lesende Funktionen für Server Components. Jede Funktion prüft die Rechte selbst.
- `actions.ts`: Server Actions mit zod-Validierung, Rechteprüfung, Transaktion und Audit-Eintrag.
- `schemas.ts`: zod-Schemas, geteilt von Formular und Action.

### 3.2 Auth-Ablauf

```
Browser ──► src/proxy.ts ──(kein Session-Cookie)──► Redirect /login
               │
               └─(Cookie da)──► (portal)/layout.tsx
                                 └─ requireSession()  ← echte Prüfung gegen DB
                                     ├─ keine Session / gesperrt ─► /login
                                     ├─ mustChangePassword ──────► /settings?pw=1 (nicht auf /settings selbst)
                                     └─ ok ─► Seite rendert, Queries prüfen Rechte
```

- **`proxy.ts`** prüft nur, ob der Session-Cookie existiert (`getSessionCookie` aus `better-auth/cookies`). Es gibt dort keine DB-Abfragen, weil der Proxy bei jedem Request und Prefetch läuft.
- Der Proxy leitet **nur** geschützte Routen auf `/login` um, **nie** von `/login` weg. Ein abgelaufenes Cookie würde sonst eine Redirect-Schleife erzeugen (`/login` → `/dashboard` → `/login` …). Ob jemand schon eingeloggt ist, prüft `login/page.tsx` serverseitig mit `auth.api.getSession()` und leitet dann auf `/dashboard`.
- **`dal.ts`** ist die eigentliche Sicherheitsgrenze:
  - `requireSession()` ruft `auth.api.getSession({ headers: await headers() })` auf und lädt Employee und Rang dazu (mit React `cache()` pro Request).
  - `requirePermission(p)` wirft einen Fehler bzw. leitet um, wenn der Rang das Recht `p` nicht hat. Die Better-Auth-Rolle `admin` darf alles.
- **Login** im Client über `authClient.signIn.username({ username, password })`.
- **Logout** über `authClient.signOut()`, danach `router.replace("/login")`.

Better-Auth-Config (Skizze):

```ts
// src/lib/auth.ts
export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: { enabled: true, disableSignUp: true, minPasswordLength: 10 },
  session: {
    expiresIn: 60 * 60 * 24 * 7,      // 7 Tage
    updateAge: 60 * 60 * 24,          // täglich verlängern
    cookieCache: { enabled: true, maxAge: 300 },
  },
  rateLimit: {
    enabled: true,
    customRules: { "/sign-in/username": { window: 60, max: 5 } },
  },
  plugins: [username(), admin(), nextCookies()], // nextCookies() muss das letzte Plugin sein
});
```

**E-Mail-Feld:** Better Auth verlangt eine E-Mail pro User. Mitarbeiter haben keine. Das Portal setzt deshalb intern `"<benutzername>@bennys.local"`. Dieser Wert wird nirgends angezeigt.

### 3.3 Mitarbeiter anlegen (kein Self-Signup)

1. Ein Rang mit `EMPLOYEES_MANAGE` öffnet „Mitarbeiter → Neu“.
2. Er gibt IC-Name, Benutzername, Rang, Dienstnummer und Telefon ein. Das Startpasswort erzeugt das System und zeigt es genau einmal an.
3. Die Server Action prüft:
   - das Recht `EMPLOYEES_MANAGE`,
   - dass der Ziel-Rang **unter** dem eigenen Rang liegt (Ausnahme: Admin).
4. Sie ruft serverseitig `auth.api.createUser(...)` auf (Admin-Plugin, umgeht `disableSignUp`), legt den `Employee` mit `mustChangePassword = true` an und schreibt einen Audit-Eintrag. Alles läuft in einer Transaktion bzw. mit Rollback bei Fehlern.
5. Beim ersten Login erzwingt das Portal die Passwortänderung.

**Kündigung:** Der User wird über das Admin-Plugin **gesperrt** (`banned`), dabei werden seine Sessions widerrufen. Der Employee bekommt den Status `TERMINATED`. Es wird nie hart gelöscht, damit die Historie (Aufträge, Stempelzeiten) erhalten bleibt.

**Erster Admin:** Das Seed-Skript ruft `auth.api.createUser` auf. Benutzername und Passwort kommen aus `SEED_ADMIN_USERNAME` und `SEED_ADMIN_PASSWORD` in der `.env`.

### 3.4 Firmenstatus (Header)

```ts
isOpen = settings.statusMode === "MANUAL"
  ? settings.manualOpen
  : onDutyCount >= settings.minOnDuty   // onDutyCount = TimeEntry mit clockOut = null
```

- Der Header rendert den Status serverseitig.
- Die Badge (Client Component) fragt `/api/status` alle 30 s ab, damit andere Nutzer Änderungen sehen.
- Ein- und Ausstempeln sowie Änderungen an den Firmeneinstellungen rufen `revalidatePath("/", "layout")` auf. Wer die Aktion auslöst, sieht die Änderung sofort.

### 3.5 Rechte

Rechte sind ein Postgres-Enum-Array am Rang (`Rank.permissions`).

**Start:** Es gibt nur einen Rang, **Admin** (Level 100), mit allen Rechten. Alle weiteren Ränge legt ihr selbst im Ränge-Creator an (5.9).

**Schutz des Admin-Rangs** (`Rank.isSystem = true`):
- Er kann nicht gelöscht oder umbenannt werden, und ihm lassen sich keine Rechte entziehen.
- Rechte, die in späteren Versionen dazukommen, bekommt er automatisch: Der Seed setzt sie bei jedem Deploy (13).
- Der letzte aktive Mitarbeiter mit Admin-Rang kann weder herabgestuft noch gesperrt werden. So sperrt sich niemand versehentlich aus.

Regeln:
- Ränge anlegen und ändern geht nur mit `RANKS_MANAGE` und nur für Ränge **unterhalb** des eigenen Levels.
- Jeder darf das Dashboard, das eigene Profil, die eigenen Settings und die eigenen Stempelzeiten sehen.
- Man darf nur Mitarbeiter mit **niedrigerem** Rang-Level bearbeiten.
- Man darf nur Rechte vergeben, die man selbst hat.
- Sidebar-Einträge ohne Recht werden ausgeblendet. Die Seite selbst prüft trotzdem serverseitig.
- Eine Prämie im Auftrag einlösen darf jeder mit `ORDERS_CREATE`. `LOYALTY_MANAGE` ist nur für den Prämienkatalog, die Treue-Einstellungen und manuelle Korrekturbuchungen nötig.

### 3.6 Treuesystem

**Einstellungen:** Alle Werte unten tragt ihr auf der Seite „Treue-Einstellungen“ ein (5.10). Die Zahlen in dieser Tabelle sind nur Vorschlagswerte, die das Formular beim ersten Öffnen vorbelegt. Bis zum ersten Speichern ist das Treuesystem aus.

**Prinzip:** Stempel und Punkte sind technisch dasselbe, eine ganze Zahl auf dem Treuekonto des Kunden. Jede Änderung ist eine Buchung im Treue-Journal (`LoyaltyTransaction`). `Customer.loyaltyBalance` ist nur der zwischengespeicherte Kontostand. Der Modus bestimmt, wie gutgeschrieben und wie angezeigt wird:

| | Stempel-Modus (Standard) | Punkte-Modus |
|---|---|---|
| Gutschrift pro Besuch | `stampsPerVisit` (Vorschlag 1) | `floor(Rechnungsbetrag / dollarsPerPoint)` (Vorschlag: 1 Punkt je $100) |
| Anzeige | Stempelkarte mit `cardSize` Feldern (Vorschlag 10) | Punktzahl und Fortschrittsbalken bis zur nächsten Prämie |
| Beispiel-Prämie | 10 Stempel → 20 % Rabatt | 50 Punkte → $1.000 Rabatt |

**Gutschrift (Besuch):** Läuft automatisch, wenn eine Rechnung auf `PAID` gesetzt wird, in derselben DB-Transaktion. Das System bucht `EARN` nur, wenn alle drei Bedingungen erfüllt sind:
1. Das Treuesystem ist aktiv.
2. Der Rechnungsbetrag ist mindestens `minVisitTotal` (Vorschlag $500).
3. Der Kunde hat in den letzten `cooldownHours` (Vorschlag 12 h) keine Gutschrift bekommen. Das bremst Schein-Aufträge unter Freunden.

Pro Rechnung gibt es höchstens eine Gutschrift (eindeutiger Index, siehe 7.4). Dabei wird auch `Customer.lastVisitAt` gesetzt.

**Einlösen (Folgebesuch):** Passiert immer in einem Auftrag, nicht losgelöst davon:
1. Im Auftrag (Status `OPEN` oder `IN_PROGRESS`) zeigt das Portal das Guthaben des Kunden und die Prämien, die er sich leisten kann.
2. Der Mitarbeiter wählt eine Prämie. Das System bucht `REDEEM` (−Kosten) und hängt die Prämie an den Auftrag. Pro Auftrag geht höchstens eine Prämie.
3. Bei der Prämienart „Gratis-Leistung“ fügt das System die verknüpfte Leistung aus der Preisliste in den Auftrag ein, falls sie fehlt.
4. Die Ersparnis steht als `loyaltyDiscount` im Auftrag und auf der Rechnung (Berechnung in 7.5).

Das Guthaben wird schon beim Einlösen abgezogen, nicht erst beim Bezahlen. So kann niemand dieselben Stempel in zwei offenen Aufträgen gleichzeitig ausgeben.

**Rückbuchungen (`REVERSAL`):**
- Prämie wird aus dem Auftrag entfernt oder der Auftrag wird storniert → +Kosten zurück aufs Konto.
- Bezahlte Rechnung wird auf `VOID` gesetzt → die Gutschrift aus dieser Rechnung wird abgezogen, höchstens bis das Konto bei 0 steht. Ein Konto wird nie negativ.

**Manuelle Korrektur (`ADJUSTMENT`):** Mit `LOYALTY_MANAGE` lassen sich Stempel oder Punkte von Hand gutschreiben oder abziehen, z. B. beim Übertrag alter Papier-Stempelkarten. Eine Notiz ist Pflicht, dazu kommt ein Audit-Eintrag.

**Moduswechsel:** Stempel ↔ Punkte lässt sich nur umschalten, solange kein Kunde ein Guthaben hat. Sonst würden aus 7 Stempeln plötzlich 7 Punkte. Die Einstellungsseite sperrt den Schalter dann und nennt den Grund.

---

## 4. Design-System

### 4.1 Stilidee

Zwei Welten, ein System:
- **GTA V (Los Santos):** dunkles Anthrazit, kantige Display-Typo, Loading-Screen-Gefühl, HUD-Grün für „offen“.
- **GTA VI (Vice City):** Sunset-Verlauf Pink → Orange → Violett, Neon-Glow, Palmen-Silhouetten, Grain.

Die **Login-Seite** zeigt beide Welten voll. Das **Dashboard** nutzt sie dezent: dunkle, ruhige Flächen und den Sunset-Verlauf nur als Akzent (aktiver Nav-Eintrag, Primär-Buttons, Header-Linie, KPI-Icons).

### 4.2 Farb-Tokens

Die Tokens stehen in `globals.css` als CSS-Variablen im shadcn-Format (`:root` und `.dark`, gemappt per `@theme inline`). Die Werte hier sind Hex-Werte; bei der Umsetzung werden sie in OKLCH umgerechnet.

| Token | Dark | Light | Verwendung |
|---|---|---|---|
| `--background` | `#0B0B10` | `#FAF8F5` | Seitenhintergrund |
| `--card` | `#12121A` | `#FFFFFF` | Karten, Sidebar |
| `--border` | `rgb(255 255 255 / 0.06)` | `#E7E2DA` | Linien |
| `--foreground` | `#F4F4F5` | `#18181B` | Text |
| `--muted-foreground` | `#A1A1AA` | `#71717A` | Sekundärtext |
| `--primary` | `#FF2E88` (Sunset Pink) | `#E11D74` | Primär-Aktionen |
| `--accent-orange` | `#FF8A3D` | `#EA6C1F` | Verlauf, Highlights |
| `--accent-violet` | `#7C3AED` | `#6D28D9` | Verlauf (Login) |
| `--accent-cyan` | `#22D3EE` | `#0891B2` | Neon-Details, Links |
| `--success` | `#22C55E` | `#16A34A` | Status „Geöffnet“ |
| `--destructive` | `#EF4444` | `#DC2626` | Status „Geschlossen“, Logout |

Verlauf: `--gradient-sunset: linear-gradient(90deg, #FF2E88, #FF8A3D)`.

Vor dem Abschluss die Kontraste prüfen (WCAG AA ≥ 4.5:1 für Text). Deshalb sind die Light-Mode-Akzente dunkler.

### 4.3 Oberflächen und Bewegung im Dashboard

- **Hintergrund (dark):** `--background` mit zwei sehr schwachen Radial-Glows (Pink oben links, Violett unten rechts, je ca. 6 % Deckkraft).
- **Karten:** `bg-card/70 backdrop-blur border` mit `rounded-xl`. Bei Hover hebt sich die Karte leicht an (`translate-y-[-2px]`, weicher Schatten).
- **Zahlen:** Geist Mono mit `tabular-nums`, deutsches Format (A13): `$12.500`, `1,5 kg`. Alle Formatierer liegen in `lib/format.ts` (`Intl.NumberFormat("de-DE")`).
- **Animationen:** kurz (150–250 ms) und `ease-out`:
  - Der aktive Sidebar-Indikator gleitet per `motion` `layoutId` zum neuen Eintrag.
  - Beim Seitenwechsel blendet der Content ein (Fade + 4 px Slide).
  - KPI-Zahlen zählen beim ersten Rendern hoch.
- **Theme-Wechsel:** kreisförmige Einblendung ab dem Toggle über die View Transitions API (`document.startViewTransition`). Ohne Browser-Support wechselt das Theme sofort.
- **Reduced Motion:** Bei `prefers-reduced-motion: reduce` sind alle Bewegungen aus, es bleiben nur Opacity-Fades.

---

## 5. Dashboard-Layout

### 5.1 Wireframe (Desktop)

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│ [Logo] BENNY'S │ Tel keine Rufnummer hinterlegt │ Funk 1234 (0000) │ ● GEÖFFNET  [♪][☾] (Av) Max ▾ │
│ ═══════════════ Sunset-Linie (1px, Pink → Orange → transparent) ═══════════════════ │
├────────────────┬─────────────────────────────────────────────────────────────────┤
│ ÜBERSICHT      │  Dashboard                                                      │
│ ▌ Dashboard    │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│ KUNDEN         │  │ Offene   │ │ Umsatz   │ │ Im Dienst│ │ Lager    │            │
│   Kundenkartei │  │ Aufträge │ │ heute    │ │ 3 / 12   │ │ 4 knapp  │            │
│   Treueprämien │  └──────────┘ └──────────┘ └──────────┘ └──────────┘            │
│   Treue-Einst. │  ┌───────────────────────────────┐ ┌──────────────────┐         │
│ BETRIEB        │  │ Umsatz letzte 7 Tage (Chart)  │ │ Gerade im Dienst │         │
│   Aufträge     │  │                               │ │ (Av) Max  2:14 h │         │
│   Rechnungen   │  └───────────────────────────────┘ └──────────────────┘         │
│   Lager        │  ┌─────────────────────────────────────────────────────┐        │
│   Preisliste   │  │ Letzte Aufträge (Tabelle: Nr, Kunde, Fahrzeug, …)   │        │
│ RESSOURCEN     │  └─────────────────────────────────────────────────────┘        │
│   Datenbank    │                                                                 │
│ TEAM           │                                                                 │
│   Mitarbeiter  │                                                                 │
│   Ränge        │                                                                 │
│   Dienstzeiten │                                                                 │
│ VERWALTUNG     │                                                                 │
│   Firma        │                                                                 │
│ ┌────────────┐ │                                                                 │
│ │ ⏱ 01:23:45 │ │                                                                 │
│ │ Ausstempeln│ │                                                                 │
│ └────────────┘ │                                                                 │
├────────────────┴─────────────────────────────────────────────────────────────────┤
│ © 2026 Benny's · DNP Roleplay                                  v0.1.0 · Europe/Berlin │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Header (`app-header.tsx`)

- Sticky, `h-16`, `bg-background/70 backdrop-blur-xl`. Unten eine 1-px-Linie mit dem Sunset-Verlauf.
- **Linke Gruppe** (`flex items-center gap-4`):
  1. Logo in der gewählten Variante (5.11), als Kompakt-Version, ca. 40 px hoch, passend zum Theme. Standard ist V2. Bei V3 steht daneben der Firmenname in Anton, uppercase.
  2. Vertikaler Separator.
  3. Telefon: Icon `Phone` und Nummer in Geist Mono. Klick kopiert die Nummer, danach erscheint ein Toast „Kopiert“. Ist keine Nummer hinterlegt, steht dort gedimmt „keine Rufnummer hinterlegt“ (nicht klickbar).
  4. Funk: Icon `Radio`, dann der Kanal und in runden Klammern das Funk-Passwort, z. B. „Funk 1234 (0000)“. Tooltip: „Kanal 1234 · Passwort 0000“. Klick kopiert den Kanal. Fehlt das Passwort, entfallen die Klammern. Die echten Werte kommen aus den Firmeneinstellungen (Startwerte per Seed, 7.6).
  5. Status-Badge als Pill:
     - **Geöffnet:** grüner Punkt mit `animate-ping`-Ring, Text „GEÖFFNET“.
     - **Geschlossen:** roter Punkt ohne Animation, Text „GESCHLOSSEN“.
     - Tooltip: „Automatisch: 3 Mitarbeiter im Dienst“ bzw. „Manuell gesetzt von …“.
- **Rechte Gruppe** (`ml-auto flex items-center gap-2`):
  1. **Musik-Button:** Icon-Button mit drei kleinen Equalizer-Balken, die sich nur bewegen, wenn Musik läuft. Klick schaltet die Musik an oder aus und speichert die Wahl. Hover oder Fokus öffnet ein Popover mit dem Titel „Straßen im Blut“ und einem Lautstärke-Slider. Details: 6.4.
  2. **Theme-Toggle:** shadcn `Button` (ghost, icon). Sonne und Mond tauschen per Rotation und Scale. Verwendet next-themes mit `defaultTheme="dark"` und `enableSystem`.
  3. **User-Menü:** shadcn `DropdownMenu`.
     - Trigger: Avatar (Bild oder Initialen, Ring in der Rang-Farbe), Name, darunter der Rang (`text-xs text-muted-foreground`), `ChevronDown`.
     - Einträge: „Mein Profil“ (`User`) → `/profil` · „Meine Settings“ (`Settings`) → `/settings` · Separator · „Logout“ (`LogOut`, destructive).
- **Mobile (< 768 px):**
  - Telefon, Funk und Status rücken in ein kompaktes Popover hinter der Status-Badge.
  - Links sitzt ein Burger-Button für die Sidebar.
  - Als Logo steht immer V3 (Emblem), weil V1 und V2 zu breit sind.
  - Vom User-Menü bleibt nur der Avatar sichtbar.

### 5.3 Sidebar (`app-sidebar.tsx`)

- Basis ist die shadcn-Komponente `Sidebar`:
  - Modus `collapsible="icon"`, Shortcut Ctrl/Cmd + B.
  - Der Zustand liegt im Cookie (shadcn-Standard).
  - Auf Mobile wird die Sidebar zum `Sheet`.
- Die Navigation kommt aus `nav-config.ts`. Jeder Eintrag hat `title`, `href`, `icon` und optional `permission`. Gruppen in dieser Reihenfolge:
  1. **Übersicht:** Dashboard (`LayoutDashboard`)
  2. **Kunden:** Kundenkartei (`Contact`), Treueprämien (`Gift`), Treue-Einstellungen (`SlidersHorizontal`)
  3. **Betrieb:** Aufträge (`ClipboardList`), Rechnungen (`Receipt`), Lager (`Package`), Preisliste (`Tags`)
  4. **Ressourcen:** Datenbank (`Boxes`)
  5. **Team:** Mitarbeiter (`Users`), Ränge (`Shield`), Dienstzeiten (`Clock`)
  6. **Verwaltung:** Firma (`Building2`)
- Aktiver Eintrag: Hintergrund `bg-primary/10` und links ein 3-px-Balken mit dem Sunset-Verlauf. Der Balken gleitet per `layoutId` zum neuen Eintrag.
- **Footer der Sidebar:** Stempel-Karte mit laufendem Timer und dem Button „Einstempeln“ bzw. „Ausstempeln“. Im eingeklappten Modus bleibt nur ein Icon-Button mit grünem oder grauem Punkt.

### 5.4 Main-Content

- Oben Breadcrumb und Seitentitel in Anton. Rechts davon Seiten-Aktionen (z. B. „Neuer Auftrag“).
- Inhalt mit `max-w-screen-2xl`, `p-4 md:p-6`, Karten im Grid.
- Ladezustände über `loading.tsx` mit Skeletons, Fehler über `error.tsx` mit freundlichem Text und „Erneut versuchen“.

### 5.5 Footer (`app-footer.tsx`)

- `h-10`, `text-xs text-muted-foreground`, obere Border.
- Links: `© {Jahr} {Firmenname} · DNP Roleplay`.
- Rechts: App-Version (aus `package.json`) und die Zeitzone.

### 5.6 Seiten

| Route | Inhalt | Recht |
|---|---|---|
| `/dashboard` | KPI-Karten (offene Aufträge, Umsatz heute, Mitarbeiter im Dienst, Teile unter Mindestbestand), Umsatz-Chart 7 Tage, „Gerade im Dienst“, letzte Aufträge | alle |
| `/kunden` | Kundenkartei: Kundennummer, Name, Rufnummer, Kennzeichen (als Chips), Treuestand (Mini-Stempelleiste z. B. 7/10 oder Punktzahl), letzter Besuch. Suche über Name, Rufnummer und Kennzeichen | `CUSTOMERS_VIEW` |
| `/kunden/neu` | Formular: Name, Rufnummer, Notiz und beliebig viele Fahrzeuge (Modell, Nummernschild, Farbe; „+ Fahrzeug hinzufügen“). Warnt, wenn Rufnummer oder Kennzeichen schon existieren | `CUSTOMERS_EDIT` |
| `/kunden/[nummer]` | Kundenkarte (siehe 5.7), Tabs „Fahrzeuge“, „Aufträge“, „Treue-Verlauf“; Button „Neuer Auftrag“ mit vorausgewähltem Kunden; manuelle Treue-Buchung (nur mit `LOYALTY_MANAGE`) | `CUSTOMERS_VIEW` (ändern: `CUSTOMERS_EDIT`) |
| `/kunden/praemien` | Prämienkatalog: Name, Kosten, Art, Wert, aktiv; Prämien anlegen, ändern, deaktivieren. Startet leer | ansehen: alle; ändern: `LOYALTY_MANAGE` |
| `/kunden/treue-einstellungen` | Eigene Einstellungsseite fürs Treuesystem (siehe 5.10) | ansehen: alle; ändern: `LOYALTY_MANAGE` |
| `/auftraege` | Tabelle mit Filter nach Status, Typ und Mitarbeiter; Suche nach Kennzeichen oder Kunde | `ORDERS_VIEW` |
| `/auftraege/neu` | Kunde per Name, Rufnummer oder Kennzeichen suchen bzw. neu anlegen, Fahrzeug wählen, Positionen aus der Preisliste, Rabatt, Treueprämie einlösen, Notiz | `ORDERS_CREATE` |
| `/auftraege/[nummer]` | Details, Status ändern, zuweisen, „Rechnung erstellen“ | `ORDERS_VIEW` (fremde bearbeiten: `ORDERS_MANAGE`) |
| `/rechnungen` | Liste, als bezahlt markieren (bar/Bank), stornieren | `INVOICES_MANAGE` |
| `/lager` | Teile mit Bestand und Mindestbestand (knappe Teile rot markiert), Zugang/Korrektur buchen, Bewegungshistorie | `INVENTORY_VIEW` / `INVENTORY_MANAGE` |
| `/preisliste` | Kategorien und Leistungen, Preise, verknüpftes Lagerteil, aktiv/inaktiv | ansehen: alle; ändern: `PRICELIST_MANAGE` |
| `/ressourcen` | Ressourcen-Datenbank: oben „Ressource hinzufügen“, darunter Suche, Kategorie-Filter, sortierbare Tabelle (siehe 5.8) | ansehen: `RESOURCES_VIEW`; anlegen, ändern, löschen: `RESOURCES_MANAGE` |
| `/mitarbeiter` | Liste mit Rang-Badge, Status und Stunden dieser Woche; anlegen, bearbeiten, sperren | `EMPLOYEES_VIEW` / `EMPLOYEES_MANAGE` |
| `/raenge` | Ränge-Creator: Ränge anlegen, bearbeiten, löschen; Rechte per Checkboxen (siehe 5.9) | `RANKS_MANAGE` |
| `/dienstzeiten` | eigene Zeiten; mit Recht alle; Wochensumme, Lohn-Vorschau (Stunden × Stundenlohn), Korrekturen | eigene: alle; alle: `TIMES_VIEW_ALL` / `TIMES_MANAGE` |
| `/einstellungen/firma` | Name, Logo-Auswahl mit Vorschau (5.11), Rufnummer, Funkkanal, Funk-Passwort, Statusmodus, Mindestbesetzung | `COMPANY_MANAGE` |
| `/profil` | Avatar-Upload, IC-Name, Telefon, Rang (nur lesen), eigene Statistik | alle |
| `/settings` | Passwort ändern, Theme-Vorgabe, „Bewegungen reduzieren“, Musik im Dashboard an/aus und Lautstärke, aktive Sessions mit „Überall abmelden“ | alle |

### 5.7 Kundenkarte und Stempelkarte

```
┌──────────────────────────────────────────────────────────────────────┐
│  KUNDE #0042                                     [Neuer Auftrag ▸]   │
│  Carlos Ramirez          Tel 555-0123 (Kopieren)                     │
│  Fahrzeuge: [ 8BEN42 · Sultan RS ]  [ VICE86 · Infernus ]            │
├──────────────────────────────────────────────────────────────────────┤
│  TREUEKARTE                                           7 / 10 Stempel │
│  ┌────┐┌────┐┌────┐┌────┐┌────┐┌────┐┌────┐┌────┐┌────┐┌────┐      │
│  │ ✦  ││ ✦  ││ ✦  ││ ✦  ││ ✦  ││ ✦  ││ ✦  ││    ││    ││ ★  │      │
│  └────┘└────┘└────┘└────┘└────┘└────┘└────┘└────┘└────┘└────┘      │
│  Noch 3 Stempel bis „20 % Rabatt“ · Letzter Besuch: 03.11.2026       │
│  Einlösbar: [Gratis-Wäsche · 5]      Noch nicht: 20 % Rabatt · 10    │
└──────────────────────────────────────────────────────────────────────┘
```

- **Stempel-Modus:** `cardSize` Felder im Raster. Gefüllte Felder zeigen ein Stempel-Icon im Sunset-Verlauf, leicht gedreht (zufällig, aber stabil pro Feld: ±8°). Das letzte Feld zeigt ein Geschenk-Icon (`Gift`, im Wireframe ★).
- Hat der Kunde mehr Stempel als Felder (z. B. 13 bei 10 Feldern), zeigt die Karte „1 volle Karte + 3“.
- **Neuer Stempel:** Beim ersten Anzeigen nach einer Gutschrift „knallt“ der Stempel aufs Feld (Scale 1.6 → 1, Rotation, kurzer Schatten-Impuls, 300 ms). Bei Reduced Motion blendet er nur ein.
- **Punkte-Modus:** große Zahl in Geist Mono und ein Fortschrittsbalken (Sunset-Verlauf) bis zur nächsten Prämie.
- Einlösbare Prämien sind hervorgehoben. „Einlösen“ führt zu `/auftraege/neu?kunde=<nummer>&praemie=<id>`, eingelöst wird dann im Auftrag (siehe 3.6).

### 5.8 Ressourcen-Datenbank (`/ressourcen`)

**Zweck:** ein zentrales Nachschlagewerk aller Ressourcen auf dem Server mit Name, Gewicht, Export-Preis und Kategorie (A11, A12).

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ RESSOURCEN                                                     128 Einträge │
├──────────────────────────────────────────────────────────────────────────────┤
│ RESSOURCE HINZUFÜGEN                                                         │
│ Name                     Gewicht (kg)     Export-Preis ($)                   │
│ [Eisenerz_____________]  [2,5_______]     [45__________]                     │
│ Kategorie  [■ Rohstoff]  [□ Zwischenprodukt]  [□ Endprodukt]   [+ Hinzufügen] │
├──────────────────────────────────────────────────────────────────────────────┤
│ [🔍 Suchen …                ]   Kategorie:  ☑ Rohstoff (54)                   │
│                                             ☑ Zwischenprodukt (41)           │
│                                             ☑ Endprodukt (33)    [Zurücksetzen] │
├──────────────────────────────────────────────────────────────────────────────┤
│ Name ▲            │ Kategorie          │ Gewicht │ Export-Preis │  $ / kg │ ⋯ │
│ Eisenerz          │ ● Rohstoff         │  2,5 kg │          $45 │     $18 │ ⋯ │
│ Stahlbarren       │ ● Zwischenprodukt  │  1,5 kg │         $180 │    $120 │ ⋯ │
│ Motorblock        │ ● Endprodukt       │   25 kg │       $2.400 │     $96 │ ⋯ │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Bereich „Ressource hinzufügen“** (oben im Main-Content, nur mit `RESOURCES_MANAGE` sichtbar):
- Felder in einer Zeile (Mobile: untereinander): Name, Gewicht in kg, Export-Preis in $, Kategorie.
- **Kategorie:** drei Felder im Checkbox-Look, von denen immer genau eines aktiv ist. Ein Klick auf ein anderes Feld wechselt die Auswahl. Technisch ist das eine Einfachauswahl (shadcn `ToggleGroup type="single"` bzw. `RadioGroup`), damit nie zwei Kategorien gleichzeitig gesetzt sein können. Vorbelegt ist die zuletzt genutzte Kategorie, damit Serien schnell eingetragen sind.
- Validierung (zod, geteilt mit der Server Action):
  - Name: 2–60 Zeichen, getrimmt. Schon vorhanden (Groß- und Kleinschreibung egal) → Fehler am Feld „Diese Ressource gibt es schon“.
  - Gewicht: 0 bis 10.000 kg, höchstens 3 Nachkommastellen, Komma oder Punkt als Dezimaltrenner erlaubt.
  - Export-Preis: ganze Dollar, 0 bis 10.000.000.
- **Schnelleingabe:** Enter speichert. Danach:
  - leert sich das Formular, der Fokus springt zurück ins Namensfeld,
  - ein Toast meldet „Eisenerz hinzugefügt“,
  - die neue Zeile leuchtet in der Tabelle kurz auf (Hintergrund-Fade in `primary/15`, 1,2 s).

**Filtermaske:**
- **Suchfeld:** sucht im Namen, ohne Rücksicht auf Groß- und Kleinschreibung, mit 250 ms Verzögerung beim Tippen. Shortcut `/` setzt den Fokus ins Suchfeld.
- **Kategorie-Filter:** drei echte Checkboxen, mehrere gleichzeitig wählbar, jede mit Anzahl der Treffer. Ist keine angehakt, gilt der Filter als aus und alle Kategorien erscheinen.
- **Sortierung:** Klick auf die Spaltenköpfe Name, Kategorie, Gewicht, Export-Preis oder $/kg. Ein zweiter Klick dreht die Richtung um. Standard: Name aufsteigend.
- **Zurücksetzen** leert Suche, Filter und Sortierung.
- Suche, Filter und Sortierung stehen in der URL (`/ressourcen?q=erz&kat=RAW,FINAL&sort=exportPrice.desc`). So bleibt der Zustand beim Neuladen erhalten und lässt sich als Link teilen.

**Tabelle:**
- Spalten: Name, Kategorie (Badge), Gewicht, Export-Preis, **$/kg** und Aktionen.
- $/kg = Export-Preis ÷ Gewicht, gerundet auf ganze Dollar. Die Spalte wird berechnet, nicht gespeichert, und zeigt, welche Ressource sich pro Kilo am meisten lohnt. Bei Gewicht 0 steht „–“.
- Kategorie-Farben: Rohstoff = Orange (`--accent-orange`), Zwischenprodukt = Cyan (`--accent-cyan`), Endprodukt = Pink (`--primary`).
- Aktionen (`⋯`-Menü, nur mit `RESOURCES_MANAGE`):
  - „Bearbeiten“ öffnet einen Dialog mit demselben Formular.
  - „Löschen“ fragt per `AlertDialog` nach und schreibt einen Audit-Eintrag.
- Leerer Zustand: „Keine Ressourcen gefunden“ mit Button „Filter zurücksetzen“ bzw. bei leerer Datenbank „Erste Ressource anlegen“.

**Technik:**
- Die Seite (Server Component) lädt alle Ressourcen auf einmal. Bei einigen hundert Einträgen ist das klein.
- Suche, Filter und Sortierung laufen dann im Client über `@tanstack/react-table`, ohne neue Server-Anfrage. Das fühlt sich sofort an.
- Ab ca. 2.000 Einträgen auf Server-Filterung mit Paginierung umstellen (gleiche URL-Parameter).

### 5.9 Ränge-Creator (`/raenge`)

```
┌──────────────────────────────────────────────────────────────────────┐
│ RÄNGE                                                [+ Neuer Rang]  │
├──────────────────────────────────────────────────────────────────────┤
│ ● Admin        Level 100   alle Rechte   1 Mitarbeiter   🔒 System   │
│ ● Meister      Level 30    12 Rechte     3 Mitarbeiter   [⋯]        │
└──────────────────────────────────────────────────────────────────────┘

Rang anlegen / bearbeiten (Sheet von rechts)
┌──────────────────────────────────────────────────────────────────────┐
│ Name [Meister_______]  Level [30] (1–99)  Farbe [■ ▾]  Lohn $ [ 900 ] │
│ Vorschau: ● MEISTER                                                  │
│                                                                      │
│ RECHTE                                      [Alle wählen] [Keine]    │
│ ▣ Kunden        ☑ Ansehen  ☑ Anlegen/Bearbeiten  ☐ Treue verwalten   │
│ ☑ Ressourcen    ☑ Ansehen  ☑ Verwalten                               │
│ ▣ Aufträge      ☑ Ansehen  ☑ Anlegen  ☐ Fremde Aufträge verwalten    │
│ ☑ Rechnungen    ☑ Verwalten                                          │
│ ▣ Lager         ☑ Ansehen  ☐ Verwalten                               │
│ ☐ Preisliste    ☐ Verwalten                                          │
│ ▣ Mitarbeiter   ☑ Ansehen  ☐ Verwalten                               │
│ ☐ Ränge         ☐ Verwalten                                          │
│ ▣ Dienstzeiten  ☑ Alle ansehen  ☐ Korrigieren                        │
│ ☐ Verwaltung    ☐ Firmeneinstellungen  ☐ Audit-Log ansehen           │
│                                    [Abbrechen]  [Rang speichern]     │
└──────────────────────────────────────────────────────────────────────┘
  ▣ = teilweise gewählt
```

- **Liste:** Name mit Farbpunkt, Level, Anzahl Rechte, Anzahl Mitarbeiter. Sortiert nach Level, höchster oben.
- **Felder:**
  - Name: 2–30 Zeichen, eindeutig.
  - Level: 1–99, eindeutig. Der Admin hat fest 100.
  - Farbe: Auswahl aus 8 Vorgaben (Brand-Farben und neutrale Töne) oder freier Hex-Wert.
  - Stundenlohn in $.
- **Rechte per Checkboxen**, gruppiert nach Bereich:
  - Die Gruppen-Checkbox links wählt alle Rechte der Gruppe an oder ab. Sind nur einige gewählt, zeigt sie „teilweise“ (`indeterminate`).
  - „Alle wählen“ und „Keine“ wirken auf alle Gruppen.
  - **Abhängigkeiten:** Ein „Verwalten“-Recht hakt das passende „Ansehen“ automatisch mit an. Wer „Ansehen“ abwählt, verliert auch „Verwalten“. Die Regeln stehen an einer Stelle in `lib/permissions.ts` (Label, Gruppe, `implies`), damit UI und Server dieselbe Logik nutzen.
  - Rechte, die der Bearbeiter selbst nicht hat, sind ausgegraut. Tooltip: „Dieses Recht hast du selbst nicht.“
- **Bearbeiten und Löschen** über das `⋯`-Menü:
  - Löschen geht nur, wenn dem Rang keine Mitarbeiter mehr zugeordnet sind. Sonst nennt der Dialog die Anzahl und verlinkt die gefilterte Mitarbeiterliste.
  - Der Admin-Rang hat statt des Menüs ein Schloss-Symbol (3.5).
- Jede Änderung schreibt einen Audit-Eintrag mit alten und neuen Rechten.

| Gruppe | Checkbox-Label → Recht |
|---|---|
| Kunden | Ansehen → `CUSTOMERS_VIEW` · Anlegen/Bearbeiten → `CUSTOMERS_EDIT` · Treue verwalten → `LOYALTY_MANAGE` |
| Ressourcen | Ansehen → `RESOURCES_VIEW` · Verwalten → `RESOURCES_MANAGE` |
| Aufträge | Ansehen → `ORDERS_VIEW` · Anlegen → `ORDERS_CREATE` · Fremde Aufträge verwalten → `ORDERS_MANAGE` |
| Rechnungen | Verwalten → `INVOICES_MANAGE` |
| Lager | Ansehen → `INVENTORY_VIEW` · Verwalten → `INVENTORY_MANAGE` |
| Preisliste | Verwalten → `PRICELIST_MANAGE` |
| Mitarbeiter | Ansehen → `EMPLOYEES_VIEW` · Verwalten → `EMPLOYEES_MANAGE` |
| Ränge | Verwalten → `RANKS_MANAGE` |
| Dienstzeiten | Alle ansehen → `TIMES_VIEW_ALL` · Korrigieren → `TIMES_MANAGE` |
| Verwaltung | Firmeneinstellungen → `COMPANY_MANAGE` · Audit-Log ansehen → `AUDIT_VIEW` |

Abhängigkeiten (`implies`): `CUSTOMERS_EDIT` → `CUSTOMERS_VIEW`; `LOYALTY_MANAGE` → `CUSTOMERS_VIEW`; `RESOURCES_MANAGE` → `RESOURCES_VIEW`; `ORDERS_CREATE` und `ORDERS_MANAGE` → `ORDERS_VIEW`; `INVENTORY_MANAGE` → `INVENTORY_VIEW`; `EMPLOYEES_MANAGE` → `EMPLOYEES_VIEW`; `TIMES_MANAGE` → `TIMES_VIEW_ALL`.

### 5.10 Treue-Einstellungen (`/kunden/treue-einstellungen`)

```
┌──────────────────────────────────────────────────────────────────────┐
│ TREUE-EINSTELLUNGEN                                                  │
│ ⚠ Das Treuesystem ist aus. Kunden sammeln gerade nichts.             │
├──────────────────────────────────────────────────────────────────────┤
│ Treuesystem aktiv                                  [ ○── ] aus       │
│ Modus                       (●) Stempel   ( ) Punkte                 │
│ Stempel pro Besuch          [ 1  ]                                   │
│ Felder auf der Stempelkarte [ 10 ]  (4–20)                           │
│ Mindestbetrag pro Besuch    $ [ 500 ]                                │
│ Sperrzeit                   [ 12 ] Stunden zwischen zwei Gutschriften│
│                                                                      │
│ VORSCHAU                                                             │
│ ┌────┐┌────┐┌────┐┌────┐┌────┐┌────┐┌────┐┌────┐┌────┐┌────┐         │
│ │ ✦  ││ ✦  ││ ✦  ││    ││    ││    ││    ││    ││    ││ ★  │         │
│ └────┘└────┘└────┘└────┘└────┘└────┘└────┘└────┘└────┘└────┘         │
│ Beispiel: Rechnung $1.200 → +1 Stempel                               │
│                                           [Änderungen speichern]     │
└──────────────────────────────────────────────────────────────────────┘
```

- **Felder:**
  - Schalter „Treuesystem aktiv“.
  - Modus als Auswahl Stempel oder Punkte. Gesperrt, solange ein Kunde Guthaben hat (Grund steht daneben, siehe 3.6).
  - Nur im Stempel-Modus sichtbar: Stempel pro Besuch, Felder auf der Stempelkarte (4–20).
  - Nur im Punkte-Modus sichtbar: $ je Punkt.
  - Immer sichtbar: Mindestbetrag pro Besuch ($), Sperrzeit in Stunden (0 = keine).
- Beim ersten Öffnen steht oben ein Hinweis-Banner, dass das Treuesystem aus ist. Die Felder sind mit den Vorschlagswerten aus 3.6 vorbelegt, gespeichert wird erst per Klick.
- **Live-Vorschau:** Die Stempelkarte bzw. der Punktebalken passt sich beim Tippen an. Dazu ein Rechenbeispiel, z. B. „Rechnung $1.200 → +1 Stempel“ oder „→ +12 Punkte“.
- Die Validierung entspricht den SQL-Checks in 7.4.
- Änderungen gelten nur für künftige Gutschriften. Bestehende Guthaben bleiben unverändert.
- Speichern schreibt einen Audit-Eintrag mit alten und neuen Werten.
- Ohne `LOYALTY_MANAGE` ist die Seite schreibgeschützt (Felder deaktiviert, kein Speichern-Button).

### 5.11 Logo-Auswahl (Firmeneinstellungen)

```
┌──────────────────────────────────────────────────────────────────────┐
│ LOGO                                                                 │
│ ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐       │
│ │ ◉ V2 Vice City   │ │ ○ V1 Los Santos  │ │ ○ V3 Emblem      │       │
│ │ [dunkel | hell ] │ │ [dunkel | hell ] │ │ [dunkel | hell ] │       │
│ │ Standard         │ │                  │ │ + Firmenname     │       │
│ └──────────────────┘ └──────────────────┘ └──────────────────┘       │
│                                                                      │
│ VORSCHAU                                      Ansicht: (●) Dunkel ( ) Hell │
│ ┌ Header ────────────────────────────────────────────────────────┐   │
│ │ [Logo kompakt] │ Tel … │ Funk … │ ● GEÖFFNET      [♪][☾] (Av) ▾│   │
│ └────────────────────────────────────────────────────────────────┘   │
│ ┌ Login ──────────────────────┐ ┌ Handy ───────┐ ┌ Favicon ──────┐   │
│ │  [Logo voll, auf Hinter-    │ │ ≡ [V3] ●     │ │ [V3] 16·32·48 │   │
│ │   grundbild mit Overlay]    │ │              │ │ (immer V3)    │   │
│ └─────────────────────────────┘ └──────────────┘ └───────────────┘   │
│                                                   [Logo übernehmen]  │
└──────────────────────────────────────────────────────────────────────┘
```

- **Auswahl:**
  - Drei Karten als Einfachauswahl (shadcn `RadioGroup` im Karten-Stil).
  - Jede Karte zeigt ihr Logo auf einer geteilten Fläche, links dunkel und rechts hell.
  - Die aktuell gespeicherte Variante trägt das Label „Aktiv“.
- **Vorschau:**
  - Sie ändert sich sofort beim Klick auf eine Karte, gespeichert wird aber noch nichts.
  - Gezeigt werden vier Stellen:
    - Header mit der Kompakt-Version,
    - Login-Seite mit der Vollversion auf dem ersten Hintergrundbild samt Verlaufs-Overlay,
    - Handy-Header (immer V3),
    - Favicon in 16, 32 und 48 px.
  - Ein Umschalter wechselt die Vorschau zwischen Dunkel und Hell.
- **Speichern:** „Logo übernehmen“ macht drei Dinge:
  - schreibt `CompanySettings.logoVariant`,
  - legt einen Audit-Eintrag an,
  - ruft `revalidatePath("/", "layout")` auf.

  Header und Login-Seite zeigen das neue Logo ab dem nächsten Seitenaufruf, für alle Nutzer.
- **Favicon und App-Icon** bleiben immer V3. Browser speichern Favicons lange zwischen, ein Wechsel käme bei vielen Nutzern erst spät an.
- Ohne `COMPANY_MANAGE` ist der Bereich schreibgeschützt.
- **Umsetzung:**
  - `components/brand/brand-logo.tsx` stellt `<BrandLogo variant="VICE_CITY" layout="full" | "compact" />` bereit.
  - Die SVG-Pfade stammen aus den Entwürfen in `docs/brand/logo-entwuerfe/`.
  - Hell und Dunkel steuern CSS-Variablen über die `.dark`-Klasse. Pro Variante gibt es deshalb nur eine Komponente statt zwei Dateien.
  - Den Neon-Glow von V2 gibt es nur im Dark Mode.
  - Barrierefreiheit: `role="img"` und `aria-label` mit dem Firmennamen.

---

## 6. Login-Seite im GTA-V/VI-Stil

### 6.1 Ablauf

1. **Intro-Splash** (schwarz, vollflächig):
   - Das gewählte Logo (5.11) als dunkle Silhouette, darunter „DRÜCKE EINE TASTE ODER KLICKE“ (pulsierend).
   - Diese Nutzeraktion ist nötig, weil Browser Musik ohne Nutzeraktion blockieren.
2. **Übergang nach der Aktion:**
   - Ein kurzer weißer Flash (120 ms), dann blendet die Szene ein.
   - Die Musik startet und wird über 2 s auf 35 % Lautstärke eingeblendet.
3. **Szene:**
   - Das Logo erscheint mit einem „Slam“: Scale 1.4 → 1, Blur 10 px → 0, kurzer Shake.
   - Danach gleitet die Login-Karte von unten herein. Die Felder erscheinen gestaffelt.
4. **Login:**
   - **Fehler:** Die Karte schüttelt sich. Ein breites rotes Banner „ZUGRIFF VERWEIGERT“ fährt durchs Bild (1.8 s, im Stil der GTA-Status-Banner, eigener Text).
   - **Erfolg:** Ein Banner in Sunset-Orange erscheint: „WILLKOMMEN ZURÜCK“ und darunter der Name. Die Musik wird über 0,8 s ausgeblendet (läuft weiter, wenn der User Dashboard-Musik an hat, siehe 6.4), dann folgt ein Fade auf Schwarz und `router.replace("/dashboard")`.

Wer schon eingeloggt ist (echte Session-Prüfung in `login/page.tsx`, siehe 3.2), wird direkt auf `/dashboard` umgeleitet und sieht das Intro nicht.

### 6.2 Ebenen (von hinten nach vorn)

| Ebene | Inhalt | Technik |
|---|---|---|
| 1 Hintergrund | 3–4 eigene Artworks oder Server-Screenshots (Werkstatt, Autos, Skyline). Ken-Burns-Effekt (Zoom 1 → 1.12 und leichter Pan, 9 s), Crossfade dazwischen. | `next/image` mit `priority` für das erste Bild, `motion` `AnimatePresence` |
| 2 Farbe | Vice-City-Verlauf (Violett → Pink → Orange) als `mix-blend-mode: soft-light`, langsam wandernd. | CSS `background-position`-Animation |
| 3 Atmosphäre | Palmen-Silhouetten (SVG) mit leichter Parallaxe zur Maus, Lichtstreifen (Scheinwerfer) quer durchs Bild, Film-Grain, Vignette, feine Scanlines. | SVG, CSS-Keyframes, Noise-PNG als Overlay |
| 4 Inhalt | Logo, Login-Karte, Banner | `motion` |
| 5 HUD | unten links der Musik-Player, unten rechts rotierende Tipps und ein kreisender Lade-Spinner | Client Components |

### 6.3 Login-Karte

```
     [ gewähltes Logo, Vollversion ]   ← Standard: V2 „Vice City“ mit Neon-Glow (5.11)

     ┌────────────────────────────────┐
     │ BENUTZERNAME                   │   ← Label: uppercase, tracking-widest, xs
     │ ▕ max.power                  ▏ │   ← kantig (rounded-none), Fokus: Verlaufsrand
     │ PASSWORT                       │
     │ ▕ ••••••••••            [👁] ▏ │
     │ [        EINLOGGEN  ▸        ] │   ← Verlaufs-Button mit Shine bei Hover
     └────────────────────────────────┘
       Glas-Panel: bg-black/55, backdrop-blur-md, 1 px Rand weiß/10, leicht schräge Kopfzeile

 [▮▮▮▮ ♪ Straßen im Blut   🔊]                     TIPP: Stempel dich ein, bevor … ◌
```

- Formular mit react-hook-form und zod: Benutzername 3–30 Zeichen, Passwort Pflichtfeld.
- Der Button zeigt beim Absenden einen Spinner und ist gesperrt, damit niemand doppelt klickt.
- Fehlertexte stehen im Klartext unter dem Formular (`aria-live="polite"`). Das Banner ist nur Deko und für Screenreader versteckt (`aria-hidden`).
- Die Login-Seite ist immer dunkel (`className="dark"` am Wrapper), egal welches Theme gewählt ist.
- Ladetipps (Beispiele, rotieren alle 6 s):
  - „Stempel dich ein, bevor du Aufträge annimmst.“
  - „Teile unter Mindestbestand siehst du rot im Lager.“
  - „Rechnungen erst nach Bezahlung als bezahlt markieren.“

### 6.4 Hintergrundmusik

**Quelle:** Der Link `https://suno.com/s/wNMNRQwfNRAQbhIU` leitet auf den Song „Straßen im Blut“ weiter (ID `53e09c22-9b51-4c63-bd94-f7401211b47f`).
- Die direkte CDN-Datei (`cdn1.suno.ai/<id>.mp3`) antwortete beim Test mit **403 Forbidden**. Hotlinking ist also nicht zuverlässig.
- Eine Suno-Share-Seite lässt sich nicht als Audioquelle einbetten.
- **Lösung:** Lade die MP3 in Suno herunter (Song → Download → MP3) und lege sie unter `public/audio/strassen-im-blut.mp3` ab. So kommt die Datei vom eigenen Server, lädt schnell und ist unabhängig von Suno.
- **Rechte:** Mit dem kostenlosen Suno-Plan sind Songs nur für nicht-kommerzielle Nutzung freigegeben. Für ein internes RP-Portal passt das. Bei kommerzieller Nutzung braucht der Song einen Pro- oder Premier-Plan.

**Komponente `music-player.tsx` (Client):**
- `<audio src="/audio/strassen-im-blut.mp3" loop preload="auto">` über `useRef`.
- `play()` erst im Intro-Klick-Handler (zählt als Nutzeraktion). Lehnt der Browser trotzdem ab (Promise-Reject), zeigt der Button „Musik an“.
- **Mute-Button:**
  - Icon `Volume2` bzw. `VolumeX`, daneben 4 animierte Equalizer-Balken. Im Mute-Zustand stehen die Balken still.
  - Tastaturkürzel **M**.
  - `aria-label="Musik stummschalten"` bzw. `"Musik einschalten"`, `aria-pressed`.
- Lautstärke-Slider (0–100 %) erscheint bei Hover oder Fokus.
- Die Mute-Einstellung liegt in `localStorage` (`bennys:login-muted`, Zugriff in `try/catch`). Ist Mute gespeichert, startet die Musik nach dem Intro nicht.
- Ein- und Ausblenden über `requestAnimationFrame`-Rampe (2 s rein, 0,8 s raus beim Login).
- Anzeige im Stil eines Radiosenders: „♪ Straßen im Blut“ als Laufschrift.

**Musik im Dashboard:**
- Ein `MusicProvider` im Root-Layout (`app/layout.tsx`) hält das **einzige** `<audio>`-Element. Das Root-Layout bleibt bei Seitenwechseln erhalten. Deshalb läuft die Musik beim Übergang Login → Dashboard und zwischen Dashboard-Seiten ohne Unterbrechung weiter.
- Die Einstellung gilt pro User und liegt in der DB (`UserPreference.dashboardMusic`, `musicVolume`). Standard: aus.
- **Nach dem Login:** Hat der User Dashboard-Musik an, läuft der Song nahtlos weiter. Sonst wird er wie in 6.1 ausgeblendet.
- **Header-Button** (5.2): Klick schaltet an oder aus und speichert die Wahl per Server Action. Lautstärke im Popover. Dieselben Einstellungen gibt es auch auf `/settings`.
- **Neuladen im Dashboard:** Der Browser blockiert Autoplay ohne Nutzeraktion. Ist die Musik an, startet sie deshalb beim ersten Klick oder Tastendruck irgendwo auf der Seite (einmaliger Listener). Bis dahin zeigt der Button „pausiert“.
- **Logout** stoppt die Musik.
- Login-Mute (`localStorage`) und Dashboard-Einstellung (DB) sind getrennt: Auf der Login-Seite ist noch kein User bekannt.
- Bei `prefers-reduced-motion` stehen die Equalizer-Balken still. Die Musik selbst bleibt davon unberührt.

### 6.5 Reduced Motion und Performance

- Bei `prefers-reduced-motion`:
  - kein Ken Burns, keine Parallaxe, kein Shake,
  - Banner und Karte blenden nur ein,
  - der Hintergrund bleibt ein Standbild.
- Hintergrundbilder als WebP, max. 1920 px breit, je ca. 250 KB. Nur das erste Bild mit `priority`, die anderen laden nach.
- Animationen nutzen nur `transform` und `opacity` (GPU), damit sie flüssig laufen.

### 6.6 Assets

- **Hintergrundbilder:** freie Fotos von Unsplash und Pexels, Auswahl mit Links und Lizenz in Abschnitt 12. Alternativ eigene Screenshots vom DNP-Server. Keine offiziellen Rockstar-Artworks oder -Logos.
- **Logo:** drei eigene SVG-Logos aus freien Schriften und Icons (12.3), wählbar in den Firmeneinstellungen (5.11). Standard: V2. Stockfotos sind fürs Logo nicht erlaubt bzw. ungeeignet.
- **Musik:** MP3 des Suno-Songs (bringst du mit, siehe 6.4).

---

## 7. Datenbank (Prisma 7 + PostgreSQL)

### 7.1 Setup

```ts
// prisma.config.ts
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations", seed: "tsx prisma/seed.ts" },
  datasource: { url: env("DATABASE_URL") },
});
```

```ts
// src/lib/prisma.ts
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

### 7.2 ER-Übersicht

```
User 1─1 Employee n─1 Rank
User 1─n Session, Account            (Better Auth)
User 1─1 UserPreference
User 1─n AuditLog (actor)

Employee 1─n TimeEntry
Employee 1─n Order (createdBy) · 1─n Order (assignedTo)
Employee 1─n Invoice (issuedBy) · 1─n StockMovement

Customer 1─n Vehicle · Customer 1─n Order · Customer 1─n LoyaltyTransaction
Vehicle  1─n Order
Order    1─n OrderItem · 1─1 Invoice · 1─n StockMovement
Order    n─1 LoyaltyReward (optional, eingelöste Prämie)
PriceCategory 1─n PriceListItem n─1 Part (optional)
OrderItem n─1 PriceListItem (optional, Preis als Snapshot)
LoyaltyReward n─1 PriceListItem (optional, bei Gratis-Leistung)
LoyaltyTransaction n─1 Order / Invoice / LoyaltyReward (je optional), n─1 Employee
Part 1─n StockMovement
Resource n─1 Employee (createdBy, optional) · sonst eigenständig

CompanySettings (Singleton, id = 1) · LoyaltySettings (Singleton, id = 1)
```

### 7.3 Schema

Die Better-Auth-Modelle (`User`, `Session`, `Account`, `Verification`) erzeugt `npx auth@latest generate`. Sie stehen hier zur Vollständigkeit. Bei Abweichungen gilt die generierte Fassung. Danach werden nur die Relationen zu den eigenen Modellen ergänzt.

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
}

// ───────────── Better Auth (generiert, plus username- und admin-Plugin) ─────────────

model User {
  id              String    @id
  name            String                       // IC-Name, wird im Header angezeigt
  email           String    @unique            // intern: <username>@bennys.local
  emailVerified   Boolean   @default(false)
  image           String?                      // Avatar-URL
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  username        String?   @unique            // username-Plugin
  displayUsername String?
  role            String?   @default("user")   // admin-Plugin: "admin" = System-Admin
  banned          Boolean?  @default(false)
  banReason       String?
  banExpires      DateTime?

  sessions   Session[]
  accounts   Account[]
  employee   Employee?
  preference UserPreference?
  auditLogs  AuditLog[]

  @@map("user")
}

model Session {
  id             String   @id
  expiresAt      DateTime
  token          String   @unique
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  ipAddress      String?
  userAgent      String?
  impersonatedBy String?
  userId         String
  user           User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("session")
}

model Account {
  id                    String    @id
  accountId             String
  providerId            String
  userId                String
  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  accessToken           String?
  refreshToken          String?
  idToken               String?
  accessTokenExpiresAt  DateTime?
  refreshTokenExpiresAt DateTime?
  scope                 String?
  password              String?   // Hash (scrypt, Better-Auth-Standard)
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt

  @@index([userId])
  @@map("account")
}

model Verification {
  id         String   @id
  identifier String
  value      String
  expiresAt  DateTime
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@index([identifier])
  @@map("verification")
}

// ───────────── Enums ─────────────

enum Permission {
  CUSTOMERS_VIEW
  CUSTOMERS_EDIT       // Kunden und Fahrzeuge anlegen/bearbeiten
  LOYALTY_MANAGE       // Prämienkatalog, Treue-Einstellungen, manuelle Buchungen
  RESOURCES_VIEW
  RESOURCES_MANAGE     // Ressourcen anlegen, ändern, löschen
  ORDERS_VIEW
  ORDERS_CREATE
  ORDERS_MANAGE        // fremde Aufträge bearbeiten, zuweisen, stornieren
  INVOICES_MANAGE
  INVENTORY_VIEW
  INVENTORY_MANAGE
  PRICELIST_MANAGE
  EMPLOYEES_VIEW
  EMPLOYEES_MANAGE
  RANKS_MANAGE
  TIMES_VIEW_ALL
  TIMES_MANAGE
  COMPANY_MANAGE
  AUDIT_VIEW
}

enum EmployeeStatus {
  ACTIVE
  ON_LEAVE
  TERMINATED
}

enum CompanyStatusMode {
  AUTO
  MANUAL
}

enum OrderType {
  REPAIR
  TUNING
  PAINT
  TOWING
  OTHER
}

enum OrderStatus {
  OPEN
  IN_PROGRESS
  DONE
  CANCELLED
}

enum InvoiceStatus {
  OPEN
  PAID
  VOID
}

enum PaymentMethod {
  CASH
  BANK
}

enum StockMovementReason {
  PURCHASE      // Zugang (Einkauf)
  ORDER_USAGE   // Verbrauch durch Auftrag
  CORRECTION    // Inventur-Korrektur
  LOSS          // Verlust, Schwund
}

enum ThemePreference {
  SYSTEM
  LIGHT
  DARK
}

enum LoyaltyMode {
  STAMPS        // Stempel pro Besuch
  POINTS        // Punkte nach Rechnungsbetrag
}

enum LoyaltyTxType {
  EARN          // Gutschrift durch Besuch (bezahlte Rechnung)
  REDEEM        // Einlösung einer Prämie im Auftrag
  REVERSAL      // Rückbuchung (Prämie entfernt, Storno, Rechnung VOID)
  ADJUSTMENT    // manuelle Korrektur mit Pflicht-Notiz
}

enum RewardType {
  PERCENT_DISCOUNT   // value = Prozent
  FIXED_DISCOUNT     // value = $
  FREE_SERVICE       // verknüpfte Leistung aus der Preisliste gratis
}

enum ResourceCategory {
  RAW            // Rohstoff
  INTERMEDIATE   // Zwischenprodukt
  FINAL          // Endprodukt
}

enum LogoVariant {
  LOS_SANTOS     // V1
  VICE_CITY      // V2 (Standard)
  EMBLEM         // V3 (+ Firmenname als Text)
}

// ───────────── Firma ─────────────

model CompanySettings {
  id           Int               @id @default(1)   // Singleton
  name         String            @default("Benny's")
  logoVariant   LogoVariant       @default(VICE_CITY) // gewähltes Logo (5.11); Favicon ist immer EMBLEM
  phone         String?                           // null → Header: „keine Rufnummer hinterlegt“
  radioChannel  String?                           // Funkkanal, z. B. "1234"
  radioPassword String?                           // Funk-Passwort; Header: „Funk 1234 (0000)“
  statusMode   CompanyStatusMode @default(AUTO)
  manualOpen   Boolean           @default(false)
  minOnDuty    Int               @default(1)        // Mindestbesetzung im Auto-Modus
  updatedAt    DateTime          @updatedAt

  @@map("company_settings")
}

// ───────────── Team ─────────────

model Rank {
  id          String       @id @default(cuid())
  name        String       @unique
  level       Int          @unique                  // 1 = niedrigster Rang, Admin = 100
  color       String       @default("#A1A1AA")      // Badge- und Avatar-Ring-Farbe
  hourlyWage  Int          @default(0)              // $ pro Stunde
  permissions Permission[]
  isSystem    Boolean      @default(false)          // true = Admin-Rang, geschützt (3.5)
  employees   Employee[]
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  @@map("rank")
}

model Employee {
  id                 String         @id @default(cuid())
  userId             String         @unique
  user               User           @relation(fields: [userId], references: [id], onDelete: Restrict)
  serviceNumber      Int            @unique          // Dienstnummer
  phone              String?                         // IC-Telefonnummer
  rankId             String
  rank               Rank           @relation(fields: [rankId], references: [id], onDelete: Restrict)
  status             EmployeeStatus @default(ACTIVE)
  mustChangePassword Boolean        @default(true)
  hiredAt            DateTime       @default(now())
  terminatedAt       DateTime?
  notes              String?
  createdAt          DateTime       @default(now())
  updatedAt          DateTime       @updatedAt

  timeEntries         TimeEntry[]          @relation("TimeEntryEmployee")
  timeEntriesEdited   TimeEntry[]          @relation("TimeEntryEditedBy")
  ordersCreated       Order[]              @relation("OrderCreatedBy")
  ordersAssigned      Order[]              @relation("OrderAssignedTo")
  invoicesIssued      Invoice[]
  stockMovements      StockMovement[]
  loyaltyTransactions LoyaltyTransaction[]
  resourcesCreated    Resource[]

  @@index([rankId])
  @@index([status])
  @@map("employee")
}

model UserPreference {
  userId        String          @id
  user          User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  theme          ThemePreference @default(SYSTEM)
  reducedMotion  Boolean         @default(false)
  dashboardMusic Boolean         @default(false)   // Musik im Dashboard an/aus (6.4)
  musicVolume    Int             @default(35)      // 0–100
  updatedAt     DateTime        @updatedAt

  @@map("user_preference")
}

model TimeEntry {
  id         String    @id @default(cuid())
  employeeId String
  employee   Employee  @relation("TimeEntryEmployee", fields: [employeeId], references: [id], onDelete: Restrict)
  clockIn    DateTime  @default(now())
  clockOut   DateTime?                               // null = gerade im Dienst
  note       String?
  editedById String?
  editedBy   Employee? @relation("TimeEntryEditedBy", fields: [editedById], references: [id], onDelete: SetNull)
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt

  @@index([employeeId, clockIn])
  @@index([clockOut])
  @@index([editedById])
  @@map("time_entry")
}

// ───────────── Kunden & Aufträge ─────────────

model Customer {
  id             String    @id @default(cuid())
  number         Int       @unique @default(autoincrement())   // Kundennummer, angezeigt als #0042
  name           String
  phone          String?                             // Rufnummer (IC)
  notes          String?
  loyaltyBalance Int       @default(0)               // Stempel bzw. Punkte (Cache des Treue-Journals)
  lastVisitAt    DateTime?                           // letzte Gutschrift durch Besuch
  vehicles       Vehicle[]
  orders         Order[]
  loyaltyTransactions LoyaltyTransaction[]
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  @@index([name])
  @@index([phone])
  @@map("customer")
}

model Vehicle {
  id         String    @id @default(cuid())
  plate      String    @unique                       // Nummernschild: getrimmt, Großbuchstaben, 1–8 Zeichen A–Z/0–9/Leerzeichen
  model      String
  color      String?
  customerId String?
  customer   Customer? @relation(fields: [customerId], references: [id], onDelete: SetNull)
  orders     Order[]
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt

  @@index([customerId])
  @@map("vehicle")
}

model Order {
  id              String          @id @default(cuid())
  number          Int             @unique @default(autoincrement())  // Auftragsnummer
  type            OrderType
  status          OrderStatus     @default(OPEN)
  customerId      String
  customer        Customer        @relation(fields: [customerId], references: [id], onDelete: Restrict)
  vehicleId       String?
  vehicle         Vehicle?        @relation(fields: [vehicleId], references: [id], onDelete: SetNull)
  createdById     String
  createdBy       Employee        @relation("OrderCreatedBy", fields: [createdById], references: [id], onDelete: Restrict)
  assignedToId    String?
  assignedTo      Employee?       @relation("OrderAssignedTo", fields: [assignedToId], references: [id], onDelete: SetNull)
  discountPercent Int             @default(0)        // 0–100
  subtotal        Int             @default(0)        // $; wird bei jeder Positionsänderung neu berechnet
  loyaltyRewardId String?                            // eingelöste Treueprämie (max. 1 pro Auftrag)
  loyaltyReward   LoyaltyReward?  @relation(fields: [loyaltyRewardId], references: [id], onDelete: SetNull)
  loyaltyDiscount Int             @default(0)        // $; Ersparnis durch die Prämie
  total           Int             @default(0)        // $; subtotal − Rabatt − loyaltyDiscount (siehe 7.5)
  notes           String?
  completedAt     DateTime?
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  items               OrderItem[]
  invoice             Invoice?
  stockMovements      StockMovement[]
  loyaltyTransactions LoyaltyTransaction[]

  @@index([status, createdAt])
  @@index([customerId])
  @@index([vehicleId])
  @@index([createdById])
  @@index([assignedToId])
  @@index([loyaltyRewardId])
  @@map("work_order")                                // "order" ist ein SQL-Schlüsselwort
}

model OrderItem {
  id              String         @id @default(cuid())
  orderId         String
  order           Order          @relation(fields: [orderId], references: [id], onDelete: Cascade)
  priceListItemId String?
  priceListItem   PriceListItem? @relation(fields: [priceListItemId], references: [id], onDelete: SetNull)
  description     String                             // Snapshot des Leistungsnamens
  quantity        Int            @default(1)
  unitPrice       Int                                // Snapshot des Preises in $

  @@index([orderId])
  @@index([priceListItemId])
  @@map("order_item")
}

model Invoice {
  id            String         @id @default(cuid())
  number        Int            @unique @default(autoincrement())     // Rechnungsnummer
  orderId       String         @unique
  order         Order          @relation(fields: [orderId], references: [id], onDelete: Restrict)
  amount        Int                                  // $; eingefroren = Order.total beim Erstellen
  status        InvoiceStatus  @default(OPEN)
  paymentMethod PaymentMethod?
  issuedById    String
  issuedBy      Employee       @relation(fields: [issuedById], references: [id], onDelete: Restrict)
  issuedAt      DateTime       @default(now())
  paidAt        DateTime?
  loyaltyTransactions LoyaltyTransaction[]

  @@index([status, issuedAt])
  @@index([issuedById])
  @@map("invoice")
}

// ───────────── Preisliste & Lager ─────────────

model PriceCategory {
  id        String          @id @default(cuid())
  name      String          @unique                  // z. B. Reparatur, Motor, Optik, Lack
  sortOrder Int             @default(0)
  items     PriceListItem[]

  @@map("price_category")
}

model PriceListItem {
  id           String        @id @default(cuid())
  name         String
  description  String?
  price        Int                                   // $
  categoryId   String
  category     PriceCategory @relation(fields: [categoryId], references: [id], onDelete: Restrict)
  partId       String?                               // verbrauchtes Lagerteil (optional)
  part         Part?         @relation(fields: [partId], references: [id], onDelete: SetNull)
  partQuantity Int           @default(1)
  active       Boolean       @default(true)
  sortOrder    Int           @default(0)
  orderItems   OrderItem[]
  loyaltyRewards LoyaltyReward[]
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt

  @@unique([categoryId, name])
  @@index([partId])
  @@map("price_list_item")
}

model Part {
  id            String          @id @default(cuid())
  name          String          @unique
  sku           String?         @unique
  unit          String          @default("Stk")
  stock         Int             @default(0)          // aktueller Bestand (Cache der Bewegungen)
  minStock      Int             @default(0)          // darunter: Warnung im Dashboard
  purchasePrice Int             @default(0)          // $ pro Einheit
  movements     StockMovement[]
  priceItems    PriceListItem[]
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt

  @@map("part")
}

model StockMovement {
  id         String              @id @default(cuid())
  partId     String
  part       Part                @relation(fields: [partId], references: [id], onDelete: Restrict)
  delta      Int                                     // + Zugang, − Abgang
  reason     StockMovementReason
  orderId    String?
  order      Order?              @relation(fields: [orderId], references: [id], onDelete: SetNull)
  employeeId String
  employee   Employee            @relation(fields: [employeeId], references: [id], onDelete: Restrict)
  note       String?
  createdAt  DateTime            @default(now())

  @@index([partId, createdAt])
  @@index([orderId])
  @@index([employeeId])
  @@map("stock_movement")
}

// ───────────── Treuesystem ─────────────

model LoyaltySettings {
  id              Int         @id @default(1)        // Singleton
  enabled         Boolean     @default(false)        // aus, bis die Treue-Einstellungen gespeichert sind
  mode            LoyaltyMode @default(STAMPS)
  stampsPerVisit  Int         @default(1)            // Stempel-Modus
  dollarsPerPoint Int         @default(100)          // Punkte-Modus: 1 Punkt je $100
  minVisitTotal   Int         @default(500)          // $; darunter zählt der Besuch nicht
  cooldownHours   Int         @default(12)           // max. eine Gutschrift pro Kunde in diesem Zeitraum
  cardSize        Int         @default(10)           // Felder der Stempelkarte (nur Anzeige)
  updatedAt       DateTime    @updatedAt

  @@map("loyalty_settings")
}

model LoyaltyReward {
  id              String         @id @default(cuid())
  name            String         @unique             // z. B. "20 % Rabatt", "Gratis-Wäsche"
  description     String?
  cost            Int                                // Stempel bzw. Punkte
  type            RewardType
  value           Int            @default(0)         // % bei PERCENT_DISCOUNT, $ bei FIXED_DISCOUNT
  priceListItemId String?                            // Pflicht bei FREE_SERVICE (geprüft per zod)
  priceListItem   PriceListItem? @relation(fields: [priceListItemId], references: [id], onDelete: SetNull)
  active          Boolean        @default(true)
  sortOrder       Int            @default(0)
  orders          Order[]
  transactions    LoyaltyTransaction[]
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  @@index([priceListItemId])
  @@map("loyalty_reward")
}

model LoyaltyTransaction {
  id           String         @id @default(cuid())
  customerId   String
  customer     Customer       @relation(fields: [customerId], references: [id], onDelete: Restrict)
  type         LoyaltyTxType
  amount       Int                                   // + Gutschrift, − Einlösung bzw. Abzug
  balanceAfter Int                                   // Kontostand nach dieser Buchung
  orderId      String?
  order        Order?         @relation(fields: [orderId], references: [id], onDelete: SetNull)
  invoiceId    String?
  invoice      Invoice?       @relation(fields: [invoiceId], references: [id], onDelete: SetNull)
  rewardId     String?
  reward       LoyaltyReward? @relation(fields: [rewardId], references: [id], onDelete: SetNull)
  employeeId   String                                // wer gebucht hat
  employee     Employee       @relation(fields: [employeeId], references: [id], onDelete: Restrict)
  note         String?                               // Pflicht bei ADJUSTMENT
  createdAt    DateTime       @default(now())

  @@index([customerId, createdAt])
  @@index([orderId])
  @@index([invoiceId])
  @@index([rewardId])
  @@index([employeeId])
  @@map("loyalty_transaction")
}

// ───────────── Ressourcen ─────────────

model Resource {
  id          String           @id @default(cuid())
  name        String                                 // eindeutig ohne Groß/Klein-Unterschied (SQL-Index, 7.4)
  category    ResourceCategory
  weightGrams Int                                    // Gewicht pro Stück in Gramm; UI zeigt kg
  exportPrice Int                                    // $ pro Stück
  note        String?
  createdById String?
  createdBy   Employee?        @relation(fields: [createdById], references: [id], onDelete: SetNull)
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt

  @@index([category])
  @@index([createdById])
  @@map("resource")
}

// ───────────── Audit ─────────────

model AuditLog {
  id        String   @id @default(cuid())
  actorId   String?
  actor     User?    @relation(fields: [actorId], references: [id], onDelete: SetNull)
  action    String                                   // z. B. "order.create", "employee.ban"
  entity    String                                   // z. B. "Order"
  entityId  String?
  data      Json?                                    // Vorher/Nachher oder relevante Felder
  createdAt DateTime @default(now())

  @@index([entity, entityId])
  @@index([actorId])
  @@index([createdAt])
  @@map("audit_log")
}
```

### 7.4 Zusätzliches SQL in der ersten Migration

Prisma kann diese Constraints nicht direkt ausdrücken. Deshalb die erste Migration mit `prisma migrate dev --create-only` erzeugen und dieses SQL von Hand anhängen:

```sql
-- Höchstens ein offener Stempel pro Mitarbeiter
CREATE UNIQUE INDEX time_entry_one_open_per_employee
  ON time_entry ("employeeId") WHERE "clockOut" IS NULL;

-- Plausibilität
ALTER TABLE time_entry ADD CONSTRAINT time_entry_out_after_in
  CHECK ("clockOut" IS NULL OR "clockOut" > "clockIn");
ALTER TABLE part ADD CONSTRAINT part_stock_non_negative CHECK (stock >= 0);
ALTER TABLE work_order ADD CONSTRAINT work_order_discount_range
  CHECK ("discountPercent" BETWEEN 0 AND 100);
ALTER TABLE order_item ADD CONSTRAINT order_item_qty_positive CHECK (quantity > 0);
ALTER TABLE company_settings ADD CONSTRAINT company_settings_singleton CHECK (id = 1);

-- Treuesystem
ALTER TABLE customer ADD CONSTRAINT customer_loyalty_non_negative CHECK ("loyaltyBalance" >= 0);
ALTER TABLE loyalty_settings ADD CONSTRAINT loyalty_settings_singleton CHECK (id = 1);
ALTER TABLE loyalty_settings ADD CONSTRAINT loyalty_settings_positive
  CHECK ("stampsPerVisit" > 0 AND "dollarsPerPoint" > 0 AND "cardSize" BETWEEN 4 AND 20
         AND "minVisitTotal" >= 0 AND "cooldownHours" >= 0);
ALTER TABLE loyalty_reward ADD CONSTRAINT loyalty_reward_cost_positive CHECK (cost > 0);
ALTER TABLE loyalty_reward ADD CONSTRAINT loyalty_reward_value_range
  CHECK (type <> 'PERCENT_DISCOUNT' OR value BETWEEN 1 AND 100);
ALTER TABLE work_order ADD CONSTRAINT work_order_loyalty_discount_non_negative
  CHECK ("loyaltyDiscount" >= 0);
-- Höchstens eine Besuchs-Gutschrift pro Rechnung
CREATE UNIQUE INDEX loyalty_tx_one_earn_per_invoice
  ON loyalty_transaction ("invoiceId") WHERE type = 'EARN';

-- Ressourcen
CREATE UNIQUE INDEX resource_name_ci_unique ON resource (lower(name));
ALTER TABLE resource ADD CONSTRAINT resource_weight_range
  CHECK ("weightGrams" BETWEEN 0 AND 10000000);      -- 0 bis 10.000 kg
ALTER TABLE resource ADD CONSTRAINT resource_price_range
  CHECK ("exportPrice" BETWEEN 0 AND 10000000);

-- Ränge und Einstellungen
ALTER TABLE rank ADD CONSTRAINT rank_level_range CHECK (level BETWEEN 1 AND 100);
ALTER TABLE user_preference ADD CONSTRAINT user_preference_volume_range
  CHECK ("musicVolume" BETWEEN 0 AND 100);
```

### 7.5 Datenregeln

- **Geld:** immer `Int` in ganzen Dollar. Die Berechnung liegt in `features/orders/pricing.ts` und hat Unit-Tests:

  ```
  afterDiscount   = subtotal − floor(subtotal × discountPercent / 100)
  loyaltyDiscount = PERCENT_DISCOUNT: floor(afterDiscount × value / 100)
                    FIXED_DISCOUNT:   min(value, afterDiscount)
                    FREE_SERVICE:     min(Einzelpreis der verknüpften Leistung (1 Stück), afterDiscount)
                    keine Prämie:     0
  total           = afterDiscount − loyaltyDiscount        (nie < 0)
  ```

  Solange der Auftrag offen ist, wird `loyaltyDiscount` bei jeder Positionsänderung neu berechnet. Mit der Rechnung wird der Betrag eingefroren.
- **Kunden-Eingaben:** Nummernschilder werden vor dem Speichern normalisiert (trimmen, Großbuchstaben, Mehrfach-Leerzeichen zu einem). Rufnummern werden als Text gespeichert, Suche ignoriert Leer- und Bindestriche.
- **Snapshots:** `OrderItem.description` und `unitPrice` werden beim Hinzufügen kopiert. Spätere Preisänderungen ändern alte Aufträge nicht. `Invoice.amount` wird beim Erstellen eingefroren.
- **Lager:** Jede Bestandsänderung läuft in einer Transaktion: `StockMovement` anlegen und `Part.stock` per `increment`/`decrement` ändern. Fällt der Bestand unter 0, greift der CHECK, die Transaktion bricht ab und der Nutzer sieht „Nicht genug auf Lager“.
- **Verbrauch:** Wenn ein Auftrag auf `DONE` wechselt, wird für jede Position mit verknüpftem Teil `ORDER_USAGE` gebucht (`partQuantity × quantity`). Wird ein Auftrag storniert, **nachdem** er schon `DONE` war, bucht das System die Teile mit einer positiven Gegenbuchung (`CORRECTION`) zurück. Ein Auftrag mit bezahlter Rechnung lässt sich nicht mehr stornieren.
- **Rechnung:** Eine Rechnung lässt sich nur für Aufträge im Status `DONE` erstellen, pro Auftrag höchstens eine (`orderId @unique`). Wird eine Rechnung auf `VOID` gesetzt, darf danach keine neue für denselben Auftrag entstehen. Der Auftrag muss dann storniert und neu angelegt werden.
- **Stempeln:** „Einstempeln“ legt einen `TimeEntry` an. Der Unique-Index verhindert doppelte offene Einträge. „Ausstempeln“ setzt `clockOut`. Korrekturen setzen `editedById` und schreiben einen Audit-Eintrag.
- **Treue-Buchungen:** Jede Buchung läuft in einer Transaktion: `LoyaltyTransaction` anlegen (mit `balanceAfter`) und `Customer.loyaltyBalance` per `increment`/`decrement` ändern. Reicht das Guthaben nicht, greift der CHECK und das Portal zeigt „Nicht genug Stempel/Punkte“. Regeln für Gutschrift, Einlösung und Rückbuchung: siehe 3.6.
- **Ressourcen:** Gewicht wird als ganze Gramm gespeichert (`kg × 1000`, gerundet), damit keine Fließkomma-Fehler entstehen. Die Umrechnung liegt in `lib/format.ts` (`kgToGrams`, `gramsToKgLabel`). Ressourcen dürfen hart gelöscht werden, weil nichts auf sie verweist. Jede Änderung und jedes Löschen schreibt einen Audit-Eintrag mit den alten Werten. Den doppelten Namen fängt der Unique-Index ab (Prisma-Fehler `P2002`), die Action meldet dann den Feldfehler aus 5.8.
- **Kunden löschen:** Ein Kunde ohne Aufträge und ohne Treue-Buchungen darf gelöscht werden (Tippfehler, Dublette). Sonst nicht, weil Aufträge und Treue-Journal auf ihn verweisen (`Restrict`).
- **Löschen:** Employees, Aufträge, Rechnungen und Lagerbewegungen werden nie hart gelöscht. Aufträge werden storniert (`CANCELLED`), Rechnungen ungültig gesetzt (`VOID`), Mitarbeiter gesperrt (`TERMINATED` + `banned`).

### 7.6 Seed (`prisma/seed.ts`)

1. `CompanySettings` (id 1):
   - Name „Benny's“, Logo `VICE_CITY` (V2).
   - Rufnummer leer. Der Header zeigt dann „keine Rufnummer hinterlegt“.
   - Funkkanal und Funk-Passwort aus den Umgebungsvariablen `SEED_RADIO_CHANNEL` und `SEED_RADIO_PASSWORD`. Die echten Werte stehen **nicht** im Repo, weil das Repo öffentlich ist (13.5).
   - Wird nur beim ersten Mal angelegt. Spätere Änderungen aus den Firmeneinstellungen überschreibt der Seed nicht.
2. Ein Rang **Admin**: Level 100, `isSystem = true`, Farbe Sunset-Pink. Seine Rechte setzt der Seed bei jedem Lauf auf **alle** Werte des `Permission`-Enums.
3. Preiskategorien: Reparatur, Motor, Fahrwerk, Optik, Lackierung, Abschleppen.
4. `LoyaltySettings` (id 1) mit `enabled = false` und den Vorschlagswerten aus 3.6. Keine Prämien.
5. Ein Admin-User über `auth.api.createUser`: Rolle `admin`, Rang Admin, `mustChangePassword = true`. Benutzername und Startpasswort aus `SEED_ADMIN_USERNAME` und `SEED_ADMIN_PASSWORD`. Wird nur angelegt, wenn es diesen Benutzernamen noch nicht gibt.

Das Seed-Skript ist idempotent (`upsert`), es darf also mehrfach laufen. Im Container läuft es bei jedem Start (13.2).

---

## 8. Sicherheit

- Kein Self-Signup (`disableSignUp: true`). Accounts entstehen nur über die Mitarbeiterverwaltung.
- Rate-Limit auf den Login: 5 Versuche pro Minute. Für den Betrieb mit mehreren Instanzen `rateLimit.storage: "database"` setzen.
- Jede Server Action:
  1. validiert die Eingabe mit zod,
  2. ruft `requirePermission()` auf,
  3. prüft die Rang-Hierarchie, wo nötig,
  4. erst dann schreibt sie in die DB.
- Keine Client-Daten blind in Prisma übernehmen (kein `data: formData`). Felder werden explizit gemappt, damit niemand fremde Felder wie `rankId` oder `role` setzen kann.
- Avatar-Upload:
  - nur `image/png`, `image/jpeg`, `image/webp`, max. 2 MB, MIME-Typ per Magic Bytes prüfen,
  - Dateiname = zufällige ID, nie der Originalname.
- Secrets (`BETTER_AUTH_SECRET`, `DATABASE_URL`, `SEED_ADMIN_PASSWORD`, `SEED_RADIO_*`) lokal nur in `.env`, in Produktion nur als Umgebungsvariablen in Coolify. Ins Repo kommt nur `.env.example` mit Platzhaltern.
- **Öffentliches Repo:** Jeder kann den Code lesen. Deshalb dürfen keine Secrets und keine RP-internen Werte (z. B. Funk-Passwort) im Code, im Seed oder in der Doku stehen. Vor jedem Push prüft ein Secret-Scanner (z. B. `gitleaks` als pre-commit-Hook) die Änderungen. Die Daten selbst (Kunden, Mitarbeiter usw.) liegen nur in der Datenbank und sind nicht öffentlich.
- Gesperrte User: Better Auth verweigert den Login. Bestehende Sessions werden beim Sperren widerrufen.
- Security-Header in `next.config.ts`: CSP mit `media-src 'self'`, `frame-ancestors 'none'`, `Referrer-Policy`.

---

## 9. Tests

| Ebene | Was | Tool |
|---|---|---|
| Unit | Preisberechnung inkl. aller drei Prämienarten, Rechte-Helfer (`hasPermission`, Rang-Hierarchie), `isOpen()`, Dauer- und Lohnberechnung, Treue-Gutschrift (Stempel/Punkte, Mindestbetrag, Sperrzeit), Kennzeichen-Normalisierung, kg ↔ Gramm inkl. Komma-Eingabe, $/kg-Berechnung (auch Gewicht 0), Ressourcen-Filter und -Sortierung | Vitest |
| Integration | Server Actions gegen eine Test-DB (Docker): Auftrag → DONE bucht Lager; doppeltes Einstempeln schlägt fehl; Bestand < 0 bricht ab; Rechnung bezahlt → genau eine Gutschrift; Prämie in zwei Aufträgen gleichzeitig einlösen → zweiter Versuch scheitert; Storno bucht Prämie zurück; VOID zieht Gutschrift ab, Konto bleibt ≥ 0; Ressource „eisenerz“ neben „Eisenerz“ wird abgelehnt | Vitest + Prisma |
| E2E | Login ok/falsch; Redirect ohne Session; Mitarbeiter mit einem Test-Rang ohne `RANKS_MANAGE` sieht „Ränge“ nicht und bekommt beim direkten Aufruf 403/Redirect; Ränge-Creator: „Verwalten“ hakt „Ansehen“ mit an; Admin-Rang lässt sich nicht löschen; Theme-Toggle; Mute-Button behält den Zustand nach Reload; Ressource per Enter anlegen, danach per Suche und Kategorie-Filter finden, Filter überlebt Reload (URL); Logo auf V1 umstellen, Header zeigt danach V1 | Playwright |

---

## 10. Umsetzungsphasen

Jede Phase endet mit einem lauffähigen Stand.

| Phase | Inhalt | Fertig, wenn … |
|---|---|---|
| **0 Setup** | Next.js 16 + TS + Tailwind 4 + ESLint; shadcn init; Docker-Postgres lokal; Prisma 7 (`prisma.config.ts`, Adapter); `.env.example`; Dockerfile, Entrypoint und Health-Route | `npm run dev` und `prisma migrate dev` laufen lokal; das Docker-Image startet lokal und `/api/health` antwortet mit 200 |
| **1 Auth** | Better-Auth-Config, Auth-Route, `proxy.ts`, `dal.ts`, einfache Login-Seite (noch ohne GTA-Design), Seed mit Admin, Passwortwechsel-Zwang | Admin kann sich ein- und ausloggen; geschützte Routen leiten um |
| **2 App-Shell** | Header (Firmeninfos, Status manuell, Theme-Toggle, User-Menü), Sidebar mit Rechte-Filter, Footer, `/profil`, `/settings`, Firmeneinstellungen; `BrandLogo` mit allen 3 Varianten, Logo-Auswahl mit Vorschau (5.11), Favicon | Layout entspricht Abschnitt 5 in Light und Dark, auch auf Mobile; Logo-Wechsel in den Firmeneinstellungen ändert Header und Login |
| **3 GTA-Login & Musik** | Intro-Splash, Hintergrund-Ebenen, Logo-Slam, Karte, Banner, Musik-Player mit Mute, Ladetipps, Reduced Motion; `MusicProvider` und Musik-Button im Dashboard-Header | Abschnitt 6 vollständig umgesetzt; Musik läuft mit Dashboard-Musik „an“ nahtlos vom Login ins Dashboard; Lighthouse-Performance ≥ 85 |
| **4 Mitarbeiter & Ränge** | Ränge-Creator mit Rechte-Checkboxen und Abhängigkeiten (5.9), geschützter Admin-Rang; Mitarbeiter anlegen, bearbeiten, sperren; Rang-Hierarchie | Admin legt einen Rang mit wenigen Rechten an, weist ihn einem neuen Mitarbeiter zu; dieser sieht nur erlaubte Bereiche |
| **5 Dienstzeiten** | Stempel-Karte in der Sidebar, `/dienstzeiten`, Korrekturen, Auto-Status im Header | Einstempeln schaltet den Status auf „Geöffnet“ (Auto-Modus) |
| **6 Lager & Preisliste** | Teile, Bewegungen, Mindestbestand; Kategorien, Leistungen, Teil-Verknüpfung | Zugang buchen erhöht den Bestand; knappe Teile werden markiert |
| **7 Ressourcen** | Seite `/ressourcen` mit Schnelleingabe, Suche, Kategorie-Filter, Sortierung, $/kg, Bearbeiten und Löschen | 3 Ressourcen per Enter anlegen; Filter „Rohstoff“ + Suche „erz“ zeigt nur Eisenerz; Zustand bleibt nach Reload |
| **8 Kunden & Treue** | Kundenkartei mit Suche, Kunde anlegen mit Fahrzeugen, Kundenkarte mit Stempelkarte, Prämienkatalog, Treue-Einstellungen, manuelle Korrekturbuchung | Kunde mit 2 Fahrzeugen anlegen und per Kennzeichen finden; manuelle Gutschrift erscheint animiert auf der Stempelkarte |
| **9 Aufträge & Rechnungen** | Auftrag mit Kundensuche, Positionen, Rabatt und Treueprämie; Statuswechsel mit Lagerverbrauch; Rechnung erstellen und bezahlen mit automatischer Gutschrift; Rückbuchungen | Ablauf Auftrag → Rechnung → bezahlt → Stempel funktioniert; Einlösen beim Folgeauftrag senkt den Preis |
| **10 Dashboard & Feinschliff** | KPIs, Chart, „Im Dienst“, letzte Aufträge; Audit-Log-Ansicht; Security-Header; E2E-Tests; Deploy-Vorbereitung: Image lokal getestet, Checkliste `docs/deploy/coolify.md` aus Abschnitt 13 | Dashboard zeigt echte Daten; das Image läuft lokal mit Login; die Checkliste ist vollständig. Das Deployment selbst macht der Projektinhaber manuell |

Phase 3 hängt nur von Phase 1 ab und kann parallel zu Phase 2 laufen. Phase 7 (Ressourcen) hängt nur von Phase 2 ab und kann jederzeit danach kommen.

**shadcn-Komponenten** (bei Bedarf pro Phase hinzufügen): `sidebar`, `dropdown-menu`, `avatar`, `button`, `input`, `label`, `field`, `card`, `badge`, `separator`, `tooltip`, `sheet`, `breadcrumb`, `table`, `dialog`, `alert-dialog`, `select`, `tabs`, `switch`, `popover`, `skeleton`, `chart`, `sonner`, `scroll-area`, `slider`, `checkbox`, `toggle-group`, `radio-group`.

---

## 11. Offene Punkte

Keine. Domain und Repo-URL braucht nur das manuelle Deployment (13), das der Projektinhaber selbst durchführt.

**Geklärt (2026-11-05):**
- Deployment: macht der Projektinhaber später selbst manuell. Die Umsetzung liefert nur das lauffähige Image und die Checkliste.
- Rufnummer: zunächst leer. Der Header zeigt „keine Rufnummer hinterlegt“, die Nummer wird in den Firmeneinstellungen eingetragen.
- Funk: Kanal und Passwort sind bekannt. Sie stehen absichtlich nicht in diesem Dokument (öffentliches Repo). Sie kommen per Coolify-Umgebungsvariable in den Seed (7.6) und sind in den Firmeneinstellungen änderbar.
- Ränge: Start nur mit „Admin“ (alle Rechte), weitere Ränge über den Ränge-Creator (5.9).
- Bilder: die 4 empfohlenen aus 12.2.
- Logo: alle drei Entwürfe sind im Portal wählbar (5.11). Standard: V2 als Logo, V3 als Icon.
- Musik: auch im Dashboard, pro User an- und abschaltbar (6.4).
- Hosting: Coolify auf eigenem VPS, öffentliches Git-Repo (13).
- Treuesystem: eigene Einstellungsseite, alle Werte manuell, Start ausgeschaltet, Prämienkatalog leer (5.10).
- Ressourcen-Gewicht: kg pro Stück (A11).
- Ressourcen-Liste: Es gibt noch keine. Die Datenbank wird von Hand über die Schnelleingabe (5.8) aufgebaut. Ein CSV-Import ist **nicht** geplant.

---

## 12. Freie Bildquellen

Recherche am 2026-11-05. Lizenz, Fotograf und Motiv habe ich auf den Original-Seiten geprüft (alle als „Free“ markiert, keine Unsplash+-Bilder).

### 12.1 Lizenzen in Kürze

| Quelle | Erlaubt | Nicht erlaubt |
|---|---|---|
| [Unsplash-Lizenz](https://unsplash.com/license) | Kostenlos herunterladen, ändern und nutzen, auch kommerziell, ohne Namensnennung | Bilder sammeln, um einen ähnlichen oder konkurrierenden Dienst nachzubauen |
| [Pexels-Lizenz](https://www.pexels.com/license/) | Kostenlos nutzen und bearbeiten, ohne Namensnennung, z. B. auf Websites | Nutzung als Teil von Marke, Logo, Firmen- oder Handelsname; unveränderte Kopien verkaufen; erkennbare Personen negativ darstellen; Werbung durch abgebildete Personen oder Marken andeuten |

Folgen für das Projekt:
- Als Hintergrund der Login-Seite sind alle Bilder unten zulässig.
- **Fürs Logo kommen Stockfotos nicht in Frage.** Pexels verbietet es ausdrücklich, bei Unsplash sind Fotos dafür ohnehin ungeeignet. Logo-Lösung: 12.3.
- Namensnennung ist nicht Pflicht. Ein kleiner Credit-Hinweis in `/login` (z. B. Tooltip „Fotos: Unsplash, Pexels“) ist trotzdem fair.
- Bilder mit gut sichtbaren Automarken-Logos habe ich für **das Logo** bewusst aussortiert. In den Hintergrundfotos sind Markenschilder im Szenenhintergrund zulässig: die Pexels-Lizenz verbietet, das Bild als Marke zu nutzen oder eine Empfehlung durch abgebildete Personen oder Marken anzudeuten – ein Schild im Hintergrund ist nichts davon. Dieses Portal ist ein nicht-kommerzielles Hobby-Projekt (fiktive Werkstatt „Benny's“ auf einem GTA-RP-Server). Lizenzseiten am 2026-11-06 erneut geprüft: Unsplash ✓, Pexels ✓. `bg-02` und `intro` zeigen ein rundes „PLYMOUTH“-Schild (eine Marke) – das ist kein Verstoß, aber es ist der Grund, warum die Logo-Auswahl keine Stockfotos nimmt.

### 12.2 Hintergrundbilder

**Slideshow (4 Bilder, gewählt am 2026-11-05):** Wechselt zwischen Los-Santos-Gefühl (GTA V) und Vice-City-Gefühl (GTA VI).

| # | Motiv | Stil | Fotograf | Link |
|---|---|---|---|---|
| 1 | Skyline von Los Angeles mit Palmen im goldenen Abendlicht | GTA V | Cedric Letsch | [Unsplash](https://unsplash.com/photos/los-angeles-skyline-with-palm-trees-UZVlSjrIJ3o) |
| 2 | Garage in pinkem und blauem Neon, Oldtimer, leichter Dunst | GTA V | cottonbro studio | [Pexels](https://www.pexels.com/photo/black-car-in-front-of-store-4488649/) |
| 3 | Straße bei Nacht mit Neon-Hotels („Tropics“), Retro-Miami | GTA VI | Ryan Spencer | [Unsplash](https://unsplash.com/photos/hotel-with-neon-sign-at-night-Um9AkOiIDcU) |
| 4 | Palmen-Silhouetten vor pink-violettem Sonnenuntergang | GTA VI | Brice Cooper | [Unsplash](https://unsplash.com/photos/a-view-of-a-sunset-with-palm-trees-in-the-foreground-qRQGCraDmXU) |

**Für den Intro-Splash:** dunkle Garage mit Neon und Auto-Silhouette im Rauch, cottonbro studio, [Pexels](https://www.pexels.com/photo/black-car-parked-beside-store-during-night-time-4488642/). Das Bild ist sehr dunkel und eignet sich gut hinter „DRÜCKE EINE TASTE“.

**Alternativen:**

| Motiv | Stil | Fotograf | Link |
|---|---|---|---|
| Palmenwedel vor knallpinkem Himmel (ideal unter dem Verlaufs-Overlay) | GTA VI | Santiago Avila Caro | [Unsplash](https://unsplash.com/photos/palm-trees-against-pink-sky-C1O37F3IAVc) |
| Palmen-Silhouetten vor orangem Sonnenuntergang | GTA VI | Lukas Rodriguez | [Pexels](https://www.pexels.com/photo/palm-tree-golden-hour-17768201/) |
| Palmen und Skyline im Gegenlicht, Los Angeles | GTA V | Roberto Nickson | [Pexels](https://www.pexels.com/photo/city-buildings-and-trees-during-golden-hour-2816168/) |
| Miami bei Sonnenuntergang, Stadt mit Palmen | GTA VI | Zoshua Colah | [Unsplash](https://unsplash.com/photos/the-sun-is-setting-over-a-city-with-palm-trees-aT2JKn38cqw) |
| Mechaniker an Oldtimer in Neon-Garage | GTA V | cottonbro studio | [Pexels](https://www.pexels.com/photo/woman-in-black-hijab-standing-near-red-car-during-nighttime-4488667/) |
| Mechaniker in Neon-Garage (Pink/Blau) | GTA V | cottonbro studio | [Pexels](https://www.pexels.com/photo/man-in-black-jacket-sitting-on-sidewalk-during-night-time-4488650/) |
| Weißer Sportwagen mit blauem Licht im Parkhaus | GTA V | Ryan Spencer | [Unsplash](https://unsplash.com/photos/white-sports-car-in-parking-garage-c-NEiPIxpYI) |
| Lowrider-Scheinwerfer in pinkem Neon, Abenddämmerung | GTA VI | Selvin Esteban | [Pexels](https://www.pexels.com/photo/neon-lit-lowrider-car-headlights-at-dusk-34194552/) |
| Auto vor Gebäude mit blauem Neon, Nacht | GTA V | Raymond Kotewicz | [Unsplash](https://unsplash.com/photos/a-car-parked-in-front-of-a-building-at-night-Npr2r3Yazdc) |

**Für Leer- und Statuszustände im Dashboard** (z. B. „Keine Aufträge“ oder die Status-Badge „Geschlossen“):

| Motiv | Fotograf | Link |
|---|---|---|
| Leuchtschrift „GARAGE“ in Neon | Patrick Fore | [Unsplash](https://unsplash.com/photos/white-garage-neon-light-signage-u0dEeOeYC20) |
| Geschlossenes Garagentor im Neonlicht (passt zu „Geschlossen“) | aditya bhatia | [Pexels](https://www.pexels.com/photo/photo-of-a-closed-garage-doors-with-neon-lights-14671636/) |

**Aufbereitung:**
1. Auf 1920 × 1080 zuschneiden und als WebP speichern (Qualität ca. 75, Ziel ≤ 250 KB).
2. Ablegen unter `public/login/bg-01.webp` … `bg-04.webp` und `public/login/intro.webp`.
3. Helligkeit leicht senken (ca. −15 %), damit die Login-Karte lesbar bleibt. Den Rest erledigen Verlaufs-Overlay und Vignette (6.2).
4. Quelle, Fotograf und Link in `public/login/CREDITS.md` festhalten.

### 12.3 Logo

Weil Stockfotos fürs Logo ausscheiden, wird das Logo ein **eigenes SVG-Wortlogo** aus frei lizenzierten Bausteinen:

| Baustein | Quelle | Lizenz | Logo-Nutzung |
|---|---|---|---|
| Schrift für „BENNY'S“, kantig im GTA-V-Stil | [Anton](https://fonts.google.com/specimen/Anton) oder [Bebas Neue](https://fonts.google.com/specimen/Bebas+Neue) | SIL Open Font License | erlaubt |
| Schreibschrift im Vice-City-Stil (z. B. für „Motor Works“ oder einen Slogan) | [Pacifico](https://fonts.google.com/specimen/Pacifico) | SIL Open Font License | erlaubt |
| Neon-Schrift für Akzente | [Monoton](https://fonts.google.com/specimen/Monoton) | SIL Open Font License | erlaubt |
| Icon (geprüft, vorhanden): `engine`, `car-garage`, `steering-wheel`, `car-turbine`, `tool` | [Tabler Icons](https://tabler.io/icons) 3.50 | MIT | erlaubt, Lizenzhinweis im Repo |
| Icon (geprüft, vorhanden): `wrench`, `gauge`, `cog`, `car-front` | [Lucide](https://lucide.dev) 1.68 | ISC | erlaubt, Lizenzhinweis im Repo |

**Konzept:**
- „BENNY'S“ in Anton, gefüllt mit dem Sunset-Verlauf (Pink → Orange), dünne dunkle Kontur.
- Darunter klein in Pacifico ein Slogan oder „DNP Roleplay“.
- Links ein Icon (z. B. Tabler `engine` oder Lucide `wrench`) in einem schräg gestellten Rahmen.
- Die Schrift wird im SVG in Pfade umgewandelt. Dann muss die Schrift nicht mitgeladen werden.
- Varianten: voll (Login), kompakt mit Icon und Kürzel „B'S“ (Header, Favicon), einfarbig (Light Mode).
- Lizenztexte von MIT und ISC kommen nach `LICENSES/third-party.md`.

**Entwürfe (2026-11-05)** liegen in `docs/brand/logo-entwuerfe/` (Vorschau: `vorschau.html`):

| Variante | Beschreibung | Einsatz |
|---|---|---|
| V1 „Los Santos“ | Schräges Badge im Sunset-Verlauf mit Motor-Icon (Tabler `engine`), daneben „BENNY'S“ kursiv in Anton mit dunkler Kontur, darunter „DNP ROLEPLAY · TUNING & REPAIR“ | Header, Login |
| V2 „Vice City“ | „Benny's“ in Pacifico, Verlauf Violett → Pink → Orange, Neon-Glow (nur dunkel), Schwung darunter, „CUSTOMS · DNP ROLEPLAY“ in Cyan | Login, Intro-Splash |
| V3 Emblem | Dunkles Hexagon mit Verlaufsrand, „B“ in Anton, dezenter Schraubenschlüssel (Lucide `wrench`) | Favicon, eingeklappte Sidebar, App-Icon |

V1 und V2 gibt es je als Dark- und Light-Version sowie als Kompakt-Version für den Header. V3 funktioniert auf beiden Hintergründen.

**Entscheidung (2026-11-05):** Alle drei kommen ins Portal und sind in den Firmeneinstellungen wählbar (5.11). Standard: V2 als Logo; V3 als Favicon, App-Icon und Handy-Header.

---

## 13. Deployment mit Coolify

Das Deployment führt der Projektinhaber selbst manuell durch. Dieser Abschnitt ist die Anleitung dafür. Die Umsetzung (Phase 0 und 10) liefert Dockerfile, Entrypoint, Health-Route und die Checkliste `docs/deploy/coolify.md`.

### 13.1 Aufbau in Coolify

```
Coolify-Projekt „bennys-portal“ (Environment: production)
├─ PostgreSQL 17                 Add Resource → Database → PostgreSQL
│   └─ Internal URL ──────────► DATABASE_URL der App
└─ Application                   Add Resource → Public Repository
    ├─ Repo + Branch main
    ├─ Build Pack: Dockerfile, Port 3000
    ├─ Domain https://<domain>   (HTTPS-Zertifikat holt Coolify selbst)
    ├─ Persistent Storage        Volume → /app/uploads (Avatare)
    └─ Health Check              GET /api/health → 200
```

Einmalige Einrichtung, in dieser Reihenfolge:
1. In Coolify unter **Projects** ein Projekt „bennys-portal“ anlegen (Environment `production`).
2. **Add Resource → Database → PostgreSQL 17**. Die **Internal URL** kopieren. Unter **Backups** einen täglichen Zeitplan aktivieren (13.6).
3. **Add Resource → Public Repository**: Repo-URL, Branch `main`, Build Pack **Dockerfile**, Port `3000`.
4. Domain eintragen. Beim DNS-Anbieter muss ein A-Record der Domain auf die IP des VPS zeigen.
5. Umgebungsvariablen setzen (13.3).
6. **Persistent Storage**: ein Volume auf `/app/uploads` einhängen.
7. **Health Check**: Pfad `/api/health`, Port `3000`, erwarteter Status `200`.
8. **Deploy** klicken und das Log prüfen.
9. Auto-Deploy per Webhook einrichten (13.4).

### 13.2 Image und Start

- In `next.config.ts` steht `output: "standalone"`. Dann enthält der Build nur, was der Server braucht.
- Das `Dockerfile` hat drei Stufen auf Basis `node:26-alpine` (Node 26 LTS, passend zur lokalen Umgebung):
  1. **deps:** `npm ci`.
  2. **build:** `prisma generate`, `next build`, Seed als JavaScript bündeln (`prisma/seed.ts` → `dist/seed.mjs`).
  3. **runner:** nur `.next/standalone`, `.next/static`, `public/`, `prisma/` (Schema und Migrationen), `prisma.config.ts`, der gebündelte Seed und die Prisma-CLI. Läuft als Non-Root-User.
- Die Prisma-CLI ist nicht im Standalone-Output enthalten. Sie wird in der Build-Stufe separat installiert und ins Image kopiert. Den genauen Weg klärt Phase 0 mit einem echten Test-Deploy.
- `docker-entrypoint.sh`:

  ```sh
  #!/bin/sh
  set -e
  npx prisma migrate deploy   # neue Migrationen anwenden
  node dist/seed.mjs          # idempotent: Admin-Rang, Erst-Admin, Singletons
  exec node server.js         # Next.js standalone starten
  ```

- **Warum im Entrypoint** und nicht als Coolify-„Pre-deployment command“: Die Reihenfolge Migration → Seed → Start ist so im selben Container garantiert und funktioniert lokal mit `docker run` genauso. Bei einer einzigen App-Instanz ist das sicher.
- Beim Deploy läuft die alte Version weiter, bis die neue gesund ist. Migrationen müssen deshalb rückwärtskompatibel sein: erst Spalten hinzufügen, alte erst in einem späteren Release entfernen.

### 13.3 Umgebungsvariablen

In Coolify unter **Environment Variables**. Bei allen Variablen „Build“ abwählen und nur „Runtime“ lassen: Die Portal-Seiten sind dynamisch, der Build braucht keine Secrets. So landen sie auch nicht in Image-Layern.

| Variable | Inhalt |
|---|---|
| `DATABASE_URL` | Internal URL der Coolify-Postgres |
| `BETTER_AUTH_SECRET` | Zufallswert, mindestens 32 Zeichen (`openssl rand -base64 32`) |
| `BETTER_AUTH_URL` | `https://<domain>` |
| `SEED_ADMIN_USERNAME` | Benutzername des ersten Admins |
| `SEED_ADMIN_PASSWORD` | Startpasswort; muss beim ersten Login geändert werden |
| `SEED_RADIO_CHANNEL` | Startwert Funkkanal |
| `SEED_RADIO_PASSWORD` | Startwert Funk-Passwort |
| `UPLOAD_DIR` | `/app/uploads` |

### 13.4 Auto-Deploy bei Push

Bei einem öffentlichen Repo richtet Coolify die GitHub-Benachrichtigung nicht selbst ein. Einmalig von Hand:
1. **Coolify:** App → **Webhooks** → im Bereich GitHub ein langes zufälliges **Webhook secret** eintragen → speichern → die GitHub-URL unter **Manual Git webhooks** kopieren.
2. **GitHub:** Repo → **Settings → Webhooks → Add webhook**:
   - Payload URL: die kopierte URL
   - Content type: `application/json`
   - Secret: derselbe Wert wie in Coolify
   - Events: **Just the push event**, „Active“ angehakt
3. **Test:** Ein Push auf `main` startet in Coolify ein neues Deployment.

### 13.5 Öffentliches Repo

- Der Code ist für jeden lesbar. Die Daten (Kunden, Mitarbeiter, Aufträge) liegen nur in der Datenbank und sind nicht öffentlich.
- Keine Secrets ins Repo: `.env*` steht in `.gitignore` (außer `.env.example`), dazu der Secret-Scanner aus Abschnitt 8.
- Funk-Kanal, Funk-Passwort und Admin-Zugang stehen nur in den Coolify-Variablen und in der DB, nie im Code oder in dieser Doku.
- Die Hintergrundbilder und die MP3 liegen in `public/` und damit auch öffentlich im Repo. Für die Bilder erlauben das die Lizenzen (12.1). Für den Song gelten die Bedingungen deines Suno-Plans.
- Falls der Code doch nicht öffentlich sein soll: Repo auf privat stellen und in Coolify als **Private Repository (with GitHub App)** anbinden. Dann richtet Coolify den Webhook automatisch ein.

### 13.6 Backups

- **Datenbank:** In Coolify unter der PostgreSQL-Ressource → **Backups** einen täglichen Zeitplan anlegen und 7 Tage aufbewahren. Besser zusätzlich auf einen S3-kompatiblen Speicher außerhalb des VPS sichern (z. B. Cloudflare R2 oder Backblaze B2). Fällt der VPS aus, sind die Backups sonst mit weg.
- **Avatare:** Das Upload-Volume wöchentlich sichern. Gehen sie verloren, laden die Mitarbeiter ihr Bild einfach neu hoch.
- Eine Wiederherstellung einmal testen. Das ist Teil der Abnahme von Phase 10.
