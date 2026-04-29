# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-bookworm-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# prisma.config.ts loads DATABASE_URL; build steps do not connect to a real DB.
ENV DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/music_share"
RUN npx prisma generate
RUN npm run build

# Self-contained Prisma CLI tree for `db push` at startup (loads prisma.config.ts + deps).
FROM node:22-bookworm-slim AS prisma-tools
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /opt/prisma-tools
COPY docker/prisma-tools.package.json package.json
RUN npm install --omit=dev && npm cache clean --force

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Standalone file tracing can omit CJS `dist/*.js` under `@prisma/*`; overwrite with full packages so `tsx scripts/seed.ts` resolves like Node + npm ci locally.
COPY --from=deps /app/node_modules/@prisma ./node_modules/@prisma

COPY --from=deps /app/node_modules/bcryptjs ./node_modules/bcryptjs

COPY --from=prisma-tools /opt/prisma-tools/node_modules /opt/prisma-tools/node_modules
COPY --from=prisma-tools /opt/prisma-tools/package.json /opt/prisma-tools/package.json
ENV PATH="/opt/prisma-tools/node_modules/.bin:${PATH}"
ENV NODE_PATH=/opt/prisma-tools/node_modules

COPY prisma ./prisma
COPY prisma.config.ts ./prisma.config.ts

# Allow `npm run seed` in the app container (tsx is only in prisma-tools PATH + devDeps elsewhere).
COPY scripts/seed.ts ./scripts/seed.ts

COPY scripts/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 3000
ENV PORT=3000

ENTRYPOINT ["/docker-entrypoint.sh"]
