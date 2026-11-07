# Deployment-Checkliste (Coolify)

Quelle: Spec Abschnitt 13. Diese Liste ist die abhakbare Fassung. Sie ist bewusst kurz gehalten –
die Begründungen stehen in der Spec.

## 1. Projekt und Ressourcen

- [ ] Projekt `bennys-portal` angelegt, Environment `production`.
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
