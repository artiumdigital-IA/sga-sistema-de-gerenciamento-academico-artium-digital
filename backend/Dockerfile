# ── Stage 1: build ──────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

RUN apk add --no-cache openssl

COPY package*.json ./
RUN npm ci

COPY . .
# RUN com retry: builds anteriores tiveram falha intermitente (rede/DNS
# transiente dentro do passo de build) baixando o engine binary do
# Prisma nesse host -- confirmado que o binario em si baixa normalmente
# fora desse contexto especifico de build, entao um retry simples resolve.
RUN npx prisma generate \
  || (echo "prisma generate falhou, tentando novamente (1/2)..." && sleep 5 && npx prisma generate) \
  || (echo "prisma generate falhou, tentando novamente (2/2)..." && sleep 10 && npx prisma generate)
RUN npm run build

# ── Stage 2: production ─────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# OpenSSL necessário para o Prisma schema engine
RUN apk add --no-cache openssl

# Dependências de produção + Prisma CLI (necessário para migrate deploy)
COPY package*.json ./
RUN npm ci --omit=dev && npm install prisma && npm cache clean --force

# Artefatos do build + Prisma
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY prisma ./prisma

EXPOSE 3001

# Roda migrations e sobe o servidor
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main"]
