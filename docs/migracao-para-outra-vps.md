# Migração completa para outra VPS

> Guia prático pra clonar a plataforma FIURJ (código + banco + uploads) da VPS atual
> (187.77.56.182, Hostinger) pra uma VPS nova. Nenhum passo aqui é executado
> automaticamente — é um roteiro pra rodar você mesmo via SSH, nas duas máquinas.

---

## O que precisa migrar

| Item | Onde está hoje | Como migra |
|---|---|---|
| **Código** | GitHub (`fiurjids-byte/fiurj-plataforma`) | `git clone` direto na VPS nova — não depende da VPS antiga |
| **Banco de dados** | volume Docker `postgres_data` na VPS antiga | `pg_dump` → transferir → `pg_restore`/`psql` na nova |
| **Uploads** (fotos de perfil, documentos de aluno) | volume Docker `backend_uploads` na VPS antiga | `tar` do volume → `scp` → extrair no volume novo |
| **Variáveis de ambiente** | painel do Coolify (antiga) | copiar manualmente pro Coolify (ou `.env`) da nova |
| **DNS/domínio** | aponta pro IP antigo | repontar (ou usar o novo IP direto, como hoje) |

---

## Passo 1 — Preparar a VPS nova

Na VPS nova, se ela ainda não tiver o Coolify:

```bash
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```

Se preferir sem Coolify (docker-compose puro), só precisa de Docker + Docker Compose
instalados (`curl -fsSL https://get.docker.com | sh`).

---

## Passo 2 — Dump do banco na VPS antiga

Via SSH na VPS **antiga**, ache o container do Postgres e gere o dump:

```bash
# nome real do container (Coolify gera um nome com sufixo aleatório)
docker ps --format "{{.Names}}" | grep postgres

PGPOD=$(docker ps --format "{{.Names}}" | grep postgres)

docker exec $PGPOD pg_dump -U fiurj -d fiurj_plataforma -F c -f /tmp/fiurj_backup.dump
docker cp $PGPOD:/tmp/fiurj_backup.dump ./fiurj_backup.dump
```

`-F c` = formato "custom" do pg_dump (comprimido, restaura com `pg_restore`, mais seguro
que SQL puro pra bancos com muitos dados/relações).

---

## Passo 3 — Copiar o dump pra VPS nova

Da sua máquina local (ou direto de VPS pra VPS, se as duas tiverem acesso SSH uma à outra):

```bash
scp root@187.77.56.182:~/fiurj_backup.dump ./fiurj_backup.dump
scp ./fiurj_backup.dump root@IP_DA_VPS_NOVA:~/fiurj_backup.dump
```

---

## Passo 4 — Copiar os uploads (fotos + documentos)

Na VPS **antiga**, empacota o volume de uploads:

```bash
docker run --rm -v backend_uploads:/data -v $(pwd):/backup alpine \
  tar czf /backup/uploads_backup.tar.gz -C /data .
```

> O nome exato do volume pode vir com prefixo do projeto Coolify
> (ex.: `fiurj_backend_uploads` ou similar) — confira com `docker volume ls | grep uploads`.

Copia o `.tar.gz` pra VPS nova do mesmo jeito do Passo 3 (`scp`).

---

## Passo 5 — Subir o código na VPS nova

1. No Coolify da VPS nova: **Sources → GitHub App** → conecta o mesmo repositório
   `fiurj-plataforma`.
2. **New Resource → Docker Compose** → aponta pro arquivo `infra/docker-compose.prod.yml`.
3. Em **Environment Variables**, cole as mesmas variáveis já usadas na VPS antiga
   (estão documentadas no `CLAUDE.md`, seção "Variáveis de ambiente no Coolify"):
   - `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`
   - `DATABASE_URL` (ajustar host se o nome do serviço mudar)
   - `JWT_SECRET` — **reaproveite o mesmo valor da VPS antiga** se quiser que tokens JWT
     já emitidos continuem válidos; se gerar um novo, todo mundo precisa logar de novo
     (não é grave, só um detalhe de UX na virada)
   - `FRONTEND_URL`, `NEXT_PUBLIC_API_URL` — ajustar pro domínio/IP novo
   - `NODE_ENV=production`
4. Faz o **primeiro deploy** (isso já cria os containers e roda `prisma migrate deploy`
   sozinho, criando as tabelas vazias).

---

## Passo 6 — Restaurar o banco na VPS nova

Depois do primeiro deploy (containers no ar, banco vazio criado), via SSH na VPS **nova**:

```bash
PGPOD=$(docker ps --format "{{.Names}}" | grep postgres)
docker cp ./fiurj_backup.dump $PGPOD:/tmp/fiurj_backup.dump

# limpa as tabelas vazias que o prisma migrate criou, antes de restaurar
docker exec $PGPOD pg_restore -U fiurj -d fiurj_plataforma --clean --if-exists /tmp/fiurj_backup.dump
```

`--clean --if-exists` derruba os objetos vazios criados pela migration antes de recriar
com os dados reais — evita erro de "tabela já existe".

---

## Passo 7 — Restaurar os uploads na VPS nova

```bash
UPLOADVOL=$(docker volume ls --format "{{.Name}}" | grep backend_uploads)

docker run --rm -v $UPLOADVOL:/data -v $(pwd):/backup alpine \
  sh -c "cd /data && tar xzf /backup/uploads_backup.tar.gz"
```

Reinicie o container do backend depois disso pra garantir que ele releia a pasta:

```bash
docker restart $(docker ps --format "{{.Names}}" | grep backend)
```

---

## Passo 8 — Reverse proxy / domínio

A VPS atual usa um container `edu-nginx` pré-existente na porta 80 (ver seção
"Arquitetura de produção" do `CLAUDE.md`) — isso é específico dessa VPS por causa de
outro sistema (`eduplatform`) que já ocupava a porta 80 nela.

**Numa VPS nova e limpa você não tem esse problema** — pode usar o jeito padrão do
Coolify, mais simples que o setup atual:
1. No serviço **frontend** do Coolify → **Domains** → adiciona seu domínio.
2. Ativa **HTTPS (Let's Encrypt)** — o Coolify configura sozinho via Traefik.
3. Não precisa criar nenhum nginx manual nem lidar com IP de bridge network
   (`172.20.0.1`) como foi necessário na VPS atual.

Se for continuar usando só o IP (sem domínio), acesse direto pela porta que o Coolify
expuser (verifique em **Ports** no recurso).

---

## Passo 9 — Validar antes de desligar a VPS antiga

- [ ] Login funciona com um usuário real (senha da VPS antiga deve continuar valendo,
  já que o hash veio junto no dump do banco)
- [ ] Fotos de perfil e documentos de aluno abrem normalmente (valida o Passo 7)
- [ ] Contagens no **Painel do Sistema** (`/dashboard/admin/sistema`) batem com os números
  que você via na VPS antiga
- [ ] Testar upload de um arquivo novo (avatar ou documento) pra confirmar que o volume
  novo tem permissão de escrita
- [ ] Rodar por alguns dias em paralelo antes de repontar o DNS de vez / desligar a antiga

---

## Resumo rápido (comandos principais)

```bash
# Na VPS antiga
docker exec $PGPOD pg_dump -U fiurj -d fiurj_plataforma -F c -f /tmp/fiurj_backup.dump
docker cp $PGPOD:/tmp/fiurj_backup.dump ./fiurj_backup.dump
docker run --rm -v backend_uploads:/data -v $(pwd):/backup alpine tar czf /backup/uploads_backup.tar.gz -C /data .

# Transferir
scp fiurj_backup.dump uploads_backup.tar.gz root@IP_NOVO:~/

# Na VPS nova (depois do primeiro deploy no Coolify)
docker exec $PGPOD pg_restore -U fiurj -d fiurj_plataforma --clean --if-exists /tmp/fiurj_backup.dump
docker run --rm -v backend_uploads:/data -v $(pwd):/backup alpine sh -c "cd /data && tar xzf /backup/uploads_backup.tar.gz"
docker restart backend
```
