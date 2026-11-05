#!/bin/sh
set -e
node tools/node_modules/prisma/build/index.js migrate deploy
node dist/seed.mjs
exec node server.js
