# syntax=docker/dockerfile:1

# ---- deps: install node_modules (incl. dev, for build) ----
FROM node:20-slim AS deps
WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci

# ---- builder: prisma generate + next build (standalone) ----
FROM node:20-slim AS builder
WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# DATABASE_URL/DIRECT_URL are not needed at build time (no DB access during build),
# but Prisma Client is generated here from the schema.
RUN npx prisma generate
RUN npm run build

# ---- runner: minimal standalone server ----
FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
# Bind to all interfaces — Next standalone otherwise listens on localhost only,
# which the Railway/Docker proxy can't reach (results in 502).
ENV HOSTNAME=0.0.0.0
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

# Next.js standalone output bundles a minimal server + only the used deps.
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Prisma engine + generated client (needed at runtime for DB queries).
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client
# Schema + migrations so `prisma migrate deploy` can run on release.
COPY --from=builder /app/prisma ./prisma

USER nextjs
EXPOSE 3000
# Start the standalone server. Run DB migrations separately (see DEPLOY.md):
# either a host "release command" or `npx prisma migrate deploy` from a machine
# that has DIRECT_URL set. The runtime image intentionally omits the Prisma CLI.
CMD ["node", "server.js"]
