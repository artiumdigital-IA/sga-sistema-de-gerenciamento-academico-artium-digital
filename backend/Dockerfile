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

# OpenSSL necessário para o Prisma schema engine
RUN apk add --no-cache openssl

# Instala TODAS as dependências (incluindo devDependencies: ts-node,
# typescript, prisma) via "npm ci" direto do package-lock.json.
#
# Importante: isso precisa rodar ANTES do "ENV NODE_ENV=production" logo
# abaixo. Com NODE_ENV=production já setado no ambiente, o npm entra em modo
# de produção por padrão e passa a tratar qualquer pacote listado em
# devDependencies como "omitido" -- inclusive quando pedido explicitamente
# por nome (ex.: "npm install ts-node typescript"), o que gerou o bug real:
# um "npm ci --omit=dev && npm install prisma ts-node typescript" rodava sem
# erro nenhum, mas não instalava ts-node/typescript de verdade (silenciosos,
# sem aviso), e o "npx prisma db seed" falhava em produção com
# "spawn ts-node ENOENT". Rodando o "npm ci" completo antes de setar
# NODE_ENV=production evita esse comportamento e garante ts-node/typescript
# presentes de verdade.
COPY package*.json ./
RUN npm ci && npm cache clean --force

ENV NODE_ENV=production

# Artefatos do build + Prisma + tsconfig (necessário pro ts-node do "prisma
# db seed" compilar prisma/seed.ts com as mesmas opções do resto do projeto)
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY prisma ./prisma
COPY tsconfig.json ./

EXPOSE 3001

# Roda migrations e sobe o servidor
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main"]
