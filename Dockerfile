# ── deps ──────────────────────────────────────────────────────────────────
FROM node:26-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ── tools (Prisma-CLI + die Pakete, die der gebündelte Seed extern importiert) ──
FROM node:26-alpine AS tools
WORKDIR /tools
RUN npm i --prefix /tools --omit=dev --save-exact \
    prisma@7.10.1 dotenv@18.0.9 better-auth@1.7.17 @prisma/adapter-pg@7.10.1

# ── build ─────────────────────────────────────────────────────────────────
FROM node:26-alpine AS build
WORKDIR /app
# Der Build braucht keine Secrets – nur einen Platzhalter, damit prisma.config.ts auflöst.
ENV DATABASE_URL=postgresql://placeholder:placeholder@localhost:5432/placeholder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate && npm run build && npm run build:seed

# ── runner ────────────────────────────────────────────────────────────────
FROM node:26-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
# `server.js` bindet `process.env.HOSTNAME || '0.0.0.0'`. In einem Container ist HOSTNAME die
# Container-ID, darum hört der Server nur auf der eigenen IP – ein Healthcheck im Container auf
# `localhost:3000` gibt Connection refused und Coolify stellt die App als unhealthy ab.
ENV HOSTNAME=0.0.0.0

RUN addgroup -S app && adduser -S app -G app

COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./prisma.config.ts
COPY --from=build /app/dist/seed.mjs ./dist/seed.mjs
COPY --from=tools /tools/node_modules ./tools/node_modules

# `dist/seed.mjs` und `prisma.config.ts` importieren ihre Pakete extern (esbuild
# `--packages=external`) – Node löst sie über /app/node_modules auf.
RUN ln -s ../tools/node_modules/prisma ./node_modules/prisma && \
    ln -s ../tools/node_modules/dotenv ./node_modules/dotenv && \
    ln -s ../tools/node_modules/better-auth ./node_modules/better-auth && \
    ln -s ../../tools/node_modules/@prisma/adapter-pg ./node_modules/@prisma/adapter-pg

COPY --from=build /app/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

# Der Upload-Ordner muss dem Container-Benutzer gehören: ein Docker-Volume erbt die Rechte des
# Bildes beim ersten Anlegen. Ohne diesen Schritt gehört es root, und der Avatar-Upload läuft in 500
# – lokal ist er grün, weil `UPLOAD_DIR` auf ./tmp/uploads zeigt.
RUN mkdir -p /app/uploads && chown -R app:app /app/uploads

USER app
EXPOSE 3000
ENTRYPOINT ["./docker-entrypoint.sh"]
