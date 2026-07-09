# ── Stage 1: build ──────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

RUN apk add --no-cache openssl curl

COPY package*.json ./
RUN npm ci

COPY . .

# O download automatico do engine binary do Prisma durante "prisma generate"
# se mostrou consistentemente instavel especificamente dentro do pipeline de
# build do Coolify nesse servidor (falhou 5/5 vezes, sempre no mesmo passo,
# mesmo com retry -- e mesmo o binario baixando normal via curl fora desse
# contexto de build). Em vez de depender do fetch interno do Prisma, baixamos
# o engine nos mesmos (com curl, que se mostrou 100% confiavel nos testes) e
# apontamos o Prisma pra ele via PRISMA_QUERY_ENGINE_LIBRARY, que e o
# mecanismo oficial do Prisma pra pular o download interno. A versao do
# engine e lida do pacote instalado (nao fixa no Dockerfile), entao continua
# acompanhando upgrades futuros do prisma no package.json.
RUN ENGINE_VERSION=$(node -p "require('@prisma/engines-version').enginesVersion") \
  && echo "Prisma engine version: $ENGINE_VERSION" \
  && mkdir -p /tmp/prisma-engines \
  && curl -fsSL -o /tmp/prisma-engines/libquery_engine.so.node.gz \
       "https://binaries.prisma.sh/all_commits/${ENGINE_VERSION}/linux-musl-openssl-3.0.x/libquery_engine.so.node.gz" \
  && gunzip /tmp/prisma-engines/libquery_engine.so.node.gz \
  && chmod +x /tmp/prisma-engines/libquery_engine.so.node \
  || echo "pre-download do engine falhou, prisma generate vai tentar baixar sozinho"
ENV PRISMA_QUERY_ENGINE_LIBRARY=/tmp/prisma-engines/libquery_engine.so.node

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
