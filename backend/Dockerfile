# ── Stage 1: build ──────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

RUN apk add --no-cache openssl

COPY package*.json ./
RUN npm ci

COPY . .

# A causa real das falhas de build anteriores era um erro de sintaxe no
# schema.prisma (comentario de bloco /* */, que o Prisma Schema Language nao
# suporta), nao a rede -- o download do engine do Prisma sempre funcionou
# normalmente. O download manual via curl (removido aqui) so adicionava
# complexidade e, pior, quebrava o Prisma Client em runtime porque o engine
# baixado em /tmp nao era copiado pro estagio final da imagem. Deixamos o
# "prisma generate" baixar o engine do jeito padrao, que ja fica no lugar
# certo (node_modules/.prisma/client) pra ser copiado pro estagio runner.
RUN npx prisma generate
RUN npm run build

# ── Stage 2: production ─────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# OpenSSL necessário para o Prisma schema engine
RUN apk add --no-cache openssl

# Dependências de produção + Prisma CLI (necessário para migrate deploy) +
# ts-node/typescript (necessário para "npx prisma db seed", que roda
# prisma/seed.ts diretamente -- sem isso o seed falha em produção com
# "ts-node: not found", porque ts-node/typescript são devDependencies e o
# --omit=dev acima não os instala).
COPY package*.json ./
RUN npm ci --omit=dev && npm install prisma ts-node typescript && npm cache clean --force

# Artefatos do build + Prisma + tsconfig (necessário pro ts-node do "prisma
# db seed" compilar prisma/seed.ts com as mesmas opções do resto do projeto)
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY prisma ./prisma
COPY tsconfig.json ./

EXPOSE 3001

# Roda migrations e sobe o servidor
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main"]
