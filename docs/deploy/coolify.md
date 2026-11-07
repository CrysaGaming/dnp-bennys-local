# Deployment-Checkliste (Coolify)

Quelle: Spec Abschnitt 13. Diese Liste ist die abhakbare Fassung. Sie ist bewusst kurz gehalten –
die Begründungen stehen in der Spec.

## 1. Projekt und Ressourcen

- [x] Projekt `bennys-portal` angelegt, Environment `production`. Compose-Quelle: `docker-compose.yml` im Root.
  (Dateistand 2026-11-07; das Anlegen selbst ist deine Aufgabe.)
- [ ] PostgreSQL 17 als Ressource added, **Internal URL** notiert.
- [ ] Application aus dem öffentlichen Repo, Branch `main`, Build Pack **Dockerfile**, Port `3000`.
- [ ] Domain eingetragen, HTTPS-Zertifikat von Coolify.
- [ ] A-Record der Domain zeigt auf die IP des VPS.
- [ ] Persistent Storage: Volume auf `/app/uploads` (Avatare).
- [ ] Health Check: `GET /api/health` auf Port `3000`, erwartet `200`.
- [ ] Deploy ausgelöst, Log geprüft.

## 2. Umgebungsvariablen

Alle Variablen nur **Runtime**, nicht Build – der Build braucht keine Secrets, und so stehen sie
nicht in Image-Layern.

- [ ] `DATABASE_URL` – Internal URL der Coolify-Postgres.
- [ ] `BETTER_AUTH_SECRET` – mindestens 32 Zeichen, neu erzeugt (`openssl rand -base64 32`).
- [ ] `BETTER_AUTH_URL` – `https://<domain>`.
- [ ] `SEED_ADMIN_USERNAME` – Benutzername des ersten Admins.
- [ ] `SEED_ADMIN_PASSWORD` – Startpasswort; der Admin muss es beim ersten Login ändern.
- [ ] `SEED_RADIO_CHANNEL` – Startwert Funkkanal.
- [ ] `SEED_RADIO_PASSWORD` – Startwert Funk-Passwort.
- [ ] `UPLOAD_DIR` – `/app/uploads`.

Keine dieser Werte im Repo. `.env*` ist ignoriert (außer `.env.example`), der pre-commit-Hook
(secretlint) muss grün sein.

## 3. Start im Container

Der Entrypoint macht in dieser Reihenfolge: `prisma migrate deploy` → `node dist/seed.mjs` →
`node server.js`. Migrationen müssen rückwärtskompatibel bleiben, weil die alte Version läuft, bis
die neue gesund ist: erst Spalten hinzufügen, Entfernen erst in einem späteren Release.

- [x] `npm run db:test:reset && docker build -t bennys-portal:local .` läuft durch. (2026-11-07, Docker 29.8.1)
- [x] `docker run` gegen die Test-DB: Log zeigt Migration und Server-Start (2026-11-07). Der Seed läuft still, wenn der Admin schon existiert – idempotent.
- [x] `curl -s localhost:3200/api/health` → `{"status":"ok","db":"ok"}` (2026-11-07, Lauf gegen Port 5435).
- [x] Im Browser gegen den Container (2026-11-07): Login, erzwungener Passwortwechsel (`/settings?pw=1`), Dashboard. Avatar-Upload nicht manuell geprüft – gedeckt durch `tests/e2e/account.spec.ts`. Die Security-Header kommen auch aus dem Container.

## 4. Auto-Deploy

- [ ] Coolify: App → Webhooks → GitHub → langes zufälliges Webhook-Secret eingetragen.
- [ ] GitHub: Settings → Webhooks → Add webhook mit der kopierten URL, Inhalt `push`.
- [ ] Ein Push auf `main` löst den Deploy aus (getestet).

Bei einem privaten Repo richtet Coolify den Webhook selbst ein.

## 5. Backups

- [ ] PostgreSQL: täglicher Backup-Zeitplan, Aufbewahrung 7 Tage.
- [ ] Zusätzlich außer Haus: S3-kompatibler Speicher (R2 oder B2) – sonst liegen die Backups auf
      demselben VPS, der ausfallen kann.
- [ ] Upload-Volume wöchentlich sichern.
- [ ] Wiederherstellung einmal getestet (Teil der Abnahme).

## 6. Nach dem ersten Deploy

- [ ] Erster Login des Admins, Startpasswort geändert.
- [ ] Funk-Kanal und Funk-Passwort in den Firmeneinstellungen gesetzt (die Seed-Werte sind nur
      Startwerte).
- [ ] `BETTER_AUTH_URL` passt: Cookies laufen über die echte Domain.

### Der Upload-Ordner im Container (Fehlerquelle, behoben 2026-11-07)

Der Container läuft als Benutzer `app`, aber ein Docker-Volume auf `/app/uploads` erbt die Rechte des
Bildes beim ersten Anlegen. Ohne `mkdir` + `chown` im Dockerfile gehört das Volume root: Login und
Dashboard laufen, nur der Avatar-Upload gibt 500. Lokal fällt das nicht auf, weil `UPLOAD_DIR` dort auf
`./tmp/uploads` zeigt. Im Dockerfile steht jetzt:

```docker
RUN mkdir -p /app/uploads && chown -R app:app /app/uploads
```

Nachprüfung mit einem frischen Volume (Compose: `app` + `db`, `depends_on` mit Healthcheck):
`ls -ld /app/uploads` → `drwxr-xr-x app app`, `touch /app/uploads/probe` als `app` ✓.

`docker-compose.yml` im Root ist die Deploy-Compose (app + db) – Coolify scannt das Repo und erkennt nur
diesen Namen im Root. Die lokalen Datenbanken laufen aus `docker-compose.dev.yml` (`npm run db:up`).
Coolify macht aus den beiden Diensten zwei Ressourcen. Die Werte der Variablen kommen aus Coolify, in der
Datei stehen nur die Namen.

### Drei Dinge, die den Compose-Deploy blockiert haben (nachprüft 2026-11-07)

1. **Build-Kontext.** `build: .` sucht das Dockerfile im Ordner der Compose-Datei. Lag die Datei in
   `deploy/`, war der Buildfehler genau das: `failed to read dockerfile: open Dockerfile: no such
   directory`. Darum liegt sie im Root – dort passt `context: .`.
2. **Bind-Adresse.** `server.js` bindet `process.env.HOSTNAME || '0.0.0.0'`. In einem Container ist
   `HOSTNAME` die Container-ID, also horcht der Server nur auf der Container-IP. Ein Healthcheck im
   Container auf `http://localhost:3000/api/health` gibt Connection refused – und busybox löst
   `localhost` auf `::1` auf, während der Server auf IPv4 horcht. Im Dockerfile steht jetzt
   `ENV HOSTNAME=0.0.0.0`, im Healthcheck `http://127.0.0.1:3000/api/health`.
3. **Volume-Rechte.** Siehe oben: `mkdir` + `chown` für `/app/uploads`, sonst schreibt der
   `app`-Benutzer nicht in das Volume.

Nachprüfung mit der Compose im Root (Werte über eine Test-Env-Datei, nichts im Repo):
beide Dienste `healthy`, `netstat` zeigt `0.0.0.0:3000`, `/api/health` → `{"status":"ok","db":"ok"}`,
Login über die API läuft, `touch /app/uploads/probe` als `app` ✓.

In dieser Datei stehen nur Variablen**namen** (`${BETTER_AUTH_SECRET}` und so weiter) – die Werte kommen
aus Coolify. Ohne Variable bleibt sie leer, der Seed erzeugt dann keinen Admin (CDD 29). Ohne `ports:`
geht der Zugriff in Coolify über den Proxy; für plain `docker compose` muss eine Port-Mapping dazu.

### Der fehlgeschlagene Deploy vom 2026-11-07 (14:58) – Ursache waren die Variablen

Der Build lief durch, die Compose-Datei war richtig. Fehlt war nur das Passwort: Coolify hatte keine
Variablen gesetzt, und `docker compose` hat jede einzelne mit einer leeren String ersetzt. Die Postgres
Initialisierung verweigert das:

```
database is uninitialized and superuser password is not specified
```

Daher: `db` → unhealthy → `dependency failed to start` → Abbruch. Nachgebaut mit leerer Env-Datei,
gleicher Fehler (`lereadb-db-1 Restarting (1)`).

Diese Namen müssen in Coolify unter **Variables** stehen (die Datei enthält nur die Namen, nie die Werte):

- `POSTGRES_PASSWORD`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL` – die echte Domain, sonst setzen die Cookies falsch
- `SEED_ADMIN_USERNAME`
- `SEED_ADMIN_PASSWORD`
- `SEED_RADIO_CHANNEL`
- `SEED_RADIO_PASSWORD`

Zwei Fallen dabei:

- Ein Volume, das mit einem anderen Passwort angelegt wurde, behält das alte. Passwort ändern und Volume
  weiter nutzen ⇒ die App kommt nicht mehr auf die DB. Volume neu anlegen oder das Passwort nehmen, mit
  dem es inicialisiert wurde.
- Ohne `SEED_ADMIN_*` läuft der Seed still durch und es gibt keinen Admin. Dann kann niemand rein.

### Was an den Dateien geändert ist (nach den Vorbildern vam-system und homestate-portal)

- `docker-compose.yml` im Root, weil Coolify das Repo im Root scannt und nur diesen Namen erkennt.
  Die Dev-Datei für die lokalen Datenbanken heißt `docker-compose.dev.yml` (`npm run db:up`).
- Required-Variablen mit `:?` statt leer: `POSTGRES_PASSWORD`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`,
  `SEED_ADMIN_USERNAME`, `SEED_ADMIN_PASSWORD`. Fehlt eine, bricht Compose sofort mit dem Namen –
  nicht erst mit einem mysteriösen unhealthy-Container. Für Funk-Kanal und Funk-Passwort stehen
  Platzhalter drin (`1234`, `0000`), weil die in Firmeneinstellungen gesetzt werden.
- Healthchecks für beide Dienste, `restart: unless-stopped`, benannte Volumes (`pgdata`, `uploads`) –
  das Muster aus vam-system. Der App-Healthcheck geht auf `127.0.0.1`, nicht auf `localhost`.
- `ENV HOSTNAME=0.0.0.0` im Runner, wie in homestate-portal. Ohne das bindet der Standalone-Server an
  die Container-ID und der Healthcheck läuft ins Leere.
- `RUN mkdir -p /app/uploads && chown -R app:app /app/uploads` – Volume-Rechte.

Nachprüfung, beide Fälle:

```
docker compose -p testohne -f docker-compose.yml config
→ required variable POSTGRES_PASSWORD is missing a value: POSTGRES_PASSWORD fehlt – in Coolify unter Variables setzen

docker compose --env-file <test-env> -p deployp -f docker-compose.yml up -d --build
→ deployp-app-1 Up (healthy), deployp-db-1 Up (healthy), /api/health {"status":"ok","db":"ok"}
```

### Was Coolify mit den Variablen wirklich macht (aus dem Coolify-Repo, Stand 2026-11-07)

- `app/Jobs/ApplicationDeploymentJob.php` (Zeile ~954): Coolify hängt **jeden** Compose-Dienst an seine
  eigene Env-Datei an – `env_file: .env` wird automatisch gesetzt – und ruft Compose mit
  `--env-file <artifacts>/<uuid>/.env --project-directory <artifacts>/<uuid>`. Die Datei legt Coolify aus
  seinen Variables an. Darum steht in der Compose jetzt nur `env_file: .env`, keine Interpolation.
- `app/Actions/Database/StartPostgresql.php` (Zeile ~289): das generierte Passwort bekommt nur eine
  **Coolify-Datenbank-Ressource** (`POSTGRES_PASSWORD`, und `PGPASSWORD` für den Healthcheck). Ein `db`-Dienst
  im eigenen Compose-File bekommt davon nichts – genau das war der Fall beim Lauf vom 14:58: leere
  Variable, leeres Passwort, Postgres initialisiert nicht, `depends_on` wirft die App raus.
- `ApplicationDeploymentJob` (~3190): Coolify liest den Health-Status mit `docker inspect`. Ohne
  HEALTHCHECK im Image steht der Status auf `none`. Darum sitzt der Check jetzt im Dockerfile
  (`wget -qO- http://127.0.0.1:3000/api/health`), nicht nur in der Compose.

**Daraus die empfohlene Form** (die, die bei homestate-portal läuft): Postgres als Coolify-Ressource,
`DATABASE_URL` kommt von Coolify. Die Compose im Root enthält nur die App. Wer die Datenbank doch im
Compose haben will, muss `POSTGRES_PASSWORD` in Coolify setzen – Coolify generiert es für einen
Compose-Dienst nicht.

Nachprüfung der App-Compose (Testlauf, Werte aus einer Env-Datei außerhalb des Repos):

```
docker compose -f docker-compose.yml -f tmp/override.yml -p testapp up -d --build
docker inspect --format '{{.State.Health.Status}}' testapp-app-1   → healthy
/api/health → {"status":"ok","db":"ok"}
/app/uploads → drwxr-xr-x app app, schreiben als app ✓
Healthcheck-Log: ExitCode 0, Output {"status":"ok","db":"ok"}
```

### Die Compose ist selbstständig – nichts in Coolify setzen

Coolify erzeugt die Werte für `SERVICE_*` selbst (`bootstrap/helpers/shared.php`, `generateEnvValue`)
und schreibt sie in seine Env-Datei. Darum stehen in der Datei nur diese Platzhalter:

- `${SERVICE_PASSWORD_DB}` – Passwort für die Postgres
- `${SERVICE_BASE64_64_APP}` – `BETTER_AUTH_SECRET`
- `${SERVICE_USER_APP}` und `${SERVICE_PASSWORD_APP}` – der Seed-Admin
- `${SERVICE_FQDN_APP_3000}` – die Domain. Die Portzahl gehört dazu: Coolify liest den Port aus der
  FQDN-Variable, die **direkt** im Dienst steht (`ServiceApplication::getRequiredPort`). Ohne die Zahl
  kennt Coolify den Port des Containers nicht.

Die generierten Werte stehen in Coolify unter Variables – dort liest man das Startpasswort für den
ersten Login ab. Nach dem ersten Login muss der Admin es ändern (Spec 3.4), dann ist der generierte
Wert bedeutungslos. Funk-Kanal und Funk-Passwort sind nullable und werden in den Firmeneinstellungen
gesetzt (Spec 13.4), darum stehen sie nicht in der Compose.

Nachprüfung (Werte per Test-Env-Datei, dieselbe Mechanik wie Coolify, nichts im Repo):

```
app healthy, db healthy
/api/health → {"status":"ok","db":"ok"}
Login mit den generierten Werten ✓, erzwungener Passwortwechsel ✓
/app/uploads → drwxr-xr-x app app, schreiben als app ✓
BETTER_AUTH_URL = http://localhost:3200 (im Test), im Deploy die FQDN
```

### Das Laufprotokoll vom Container: Better Auth ohne Schema

```
[BetterAuthError: Invalid base URL: bennys.crysatec.com:3000. URL must include 'http://' or 'https://']
```

Coolify setzt die FQDN-Variable in die Env-Datei **ohne Schema** (`bennys.crysatec.com:3000`). Better
Auth prüft das beim Import der Config, wirft, und der Container startet im Kreis neu – migration und
Seed laufen jedes Mal wieder durch, weil das Skript vor dem Fehler fertig wird. Darum normalisiert
`src/lib/auth-url.ts` den Wert (fehlt das Schema, wird `https://` gesetzt) und `src/lib/auth.ts` nutzt
`baseURL` und `trustedOrigins` aus dieser Funktion. Guard: `src/lib/auth-url.test.ts`.

In der Compose steht `BETTER_AUTH_URL=${SERVICE_FQDN_APP_3000}` ohne `https:`-Vorpräfix – sonst steht
eventuell `https://https://…` da, wenn Coolify die Variable mit Schema liefert.
