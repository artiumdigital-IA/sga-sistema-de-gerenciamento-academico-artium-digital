# ── Stage 1: dependências ────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# ── Stage 2: build ───────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Variáveis de build — sobrescreva via ARG no Coolify
ARG NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Endereço público canônico da plataforma — usado em QR codes/links que
# precisam ficar corretos independente de qual endereço (IP antigo, domínio
# interno, etc.) a secretaria estava usando no navegador ao gerar o
# documento. Sem isso, o link cai em window.location.origin (o endereço da
# aba no momento), que pode não ser o domínio público real.
ARG NEXT_PUBLIC_WEB_URL=http://localhost:3000
ENV NEXT_PUBLIC_WEB_URL=$NEXT_PUBLIC_WEB_URL

RUN npm run build

# ── Stage 3: produção (standalone) ───────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup -S fiurj && adduser -S fiurj -G fiurj

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER fiurj
EXPOSE 3000

CMD ["node", "server.js"]
