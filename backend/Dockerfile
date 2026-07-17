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

# OpenSSL necessário para o Prisma schema engine; postgresql-client traz o
# binário `pg_dump`, usado pelo módulo Relatórios Master (perfil MASTER) pra
# gerar backup SQL completo/só-schema direto do banco de produção.
RUN apk add --no-cache openssl postgresql-client

# Instala TODAS as dependências, incluindo devDependencies (ts-node,
# typescript, prisma) -- necessárias em runtime pro "npx prisma db seed"
# rodar prisma/seed.ts diretamente.
#
# O Coolify injeta automaticamente o NODE_ENV=production (definido no
# "environment:" do docker-compose.prod.yml) como build arg logo no topo de
# CADA estágio deste Dockerfile ("Inject Build Args to Dockerfile"),
# independente de onde a gente colocar um ENV NODE_ENV manual aqui. Com
# NODE_ENV=production já ativo desde o início do estágio, o npm passa a
# tratar qualquer devDependency como "omitida" por padrão -- mesmo pedida
# explicitamente por nome -- o que fazia "npm ci" (e antes, "npm install
# prisma ts-node typescript") rodar sem erro nenhum mas não instalar
# ts-node/typescript de verdade, quebrando o seed em produção com
# "spawn ts-node ENOENT". A flag "--include=dev" abaixo força a instalação
# das devDependencies mesmo com NODE_ENV=production, resolvendo isso na
# raiz (não depende mais da ordem das instruções no Dockerfile).
COPY package*.json ./
RUN npm ci --include=dev && npm cache clean --force

ENV NODE_ENV=production

# Artefatos do build + Prisma + tsconfig (necessário pro ts-node do "prisma
# db seed" compilar prisma/seed.ts com as mesmas opções do resto do projeto)
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY prisma ./prisma
COPY tsconfig.json ./

EXPOSE 3001

# Roda migrations, seed (idempotente — upsert/ON CONFLICT, nunca falha em
# banco já populado) e sobe o servidor. O seed usa ";" (não "&&") de
# propósito: se ele falhar por algum motivo inesperado, isso NÃO deve
# impedir a aplicação de subir — só o backup de dados de teste fica
# faltando, não o sistema inteiro. Corrige o gap achado no teste E2E
# (Jul/2026): a produção nunca tinha rodado o seed, deixando o Painel do
# Sistema/Calendário Acadêmico/etc. sem nenhum dado de exemplo.
CMD ["sh", "-c", "npx prisma migrate deploy && (npx prisma db seed || true) && node dist/src/main"]
