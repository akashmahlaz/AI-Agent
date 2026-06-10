# ── Stage 1: Install deps ─────────────────────────────────────────────────────
FROM node:22-slim AS deps
WORKDIR /app
RUN npm install -g bun
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile || bun install

# ── Stage 2: Build ────────────────────────────────────────────────────────────
FROM node:22-slim AS builder
WORKDIR /app
RUN npm install -g bun
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_API_URL=https://bematterfull.fireclaw.in
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_TELEMETRY_DISABLED=1

# Build-time placeholders for server modules evaluated during static page generation
ENV MONGODB_URI=mongodb://placeholder:27017/operon
ENV AUTH_SECRET=build-placeholder-secret
ENV AUTH_URL=https://bematterfull.fireclaw.in

RUN bun run build

# ── Stage 3: Runner ───────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
