#!/bin/sh
set -e
node tools/node_modules/prisma/build/index.js migrate deploy
node dist/seed.mjs || echo "Seed fehlgeschlagen – App startet trotzdem"
exec node server.js
