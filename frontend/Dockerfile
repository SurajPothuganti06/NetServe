# ─── NetServe Frontend Dockerfile ──────────────────────────────
# Usage: docker build -f frontend/Dockerfile frontend/

# ════════════════════════════════════════════════════════════════
# Stage 1 — Install dependencies
# ════════════════════════════════════════════════════════════════
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* .npmrc* ./
RUN npm ci --legacy-peer-deps

# ════════════════════════════════════════════════════════════════
# Stage 2 — Build
# ════════════════════════════════════════════════════════════════
FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ARG NEXT_PUBLIC_API_URL=http://localhost:8080
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

RUN npm run build

# ════════════════════════════════════════════════════════════════
# Stage 3 — Production runtime
# ════════════════════════════════════════════════════════════════
FROM node:22-alpine
WORKDIR /app

RUN addgroup -S netserve && adduser -S netserve -G netserve

# Copy the standalone Next.js output
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/public ./public
COPY --from=build /app/.next/static ./.next/static

USER netserve

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

EXPOSE 3000

CMD ["node", "server.js"]
