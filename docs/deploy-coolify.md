# Deploy — Coolify na VPS Hostinger

## Pré-requisitos
- VPS Hostinger com Ubuntu 22.04 (mínimo 2 vCPU / 2 GB RAM)
- Acesso SSH à VPS
- Repositório no GitHub com o código
- Domínio apontando para o IP da VPS (registro A)

---

## Passo 1 — Instalar Coolify na VPS

Acesse a VPS via SSH e rode o instalador oficial:

```bash
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```

Aguarde ~5 minutos. Ao final acesse no navegador:
```
http://IP_DA_VPS:8000
```

Crie a conta de administrador na primeira tela.

---

## Passo 2 — Conectar o GitHub

1. No Coolify, vá em **Sources → GitHub App → New GitHub App**
2. Siga o fluxo para instalar o app no seu repositório `fiurj-plataforma`
3. Autorize o acesso ao repo

---

## Passo 3 — Criar os serviços

No Coolify, crie **3 recursos** separados (ou use o compose):

### Opção recomendada: Docker Compose

1. **New Resource → Docker Compose**
2. Selecione o repositório GitHub
3. Aponte o arquivo de compose para: `infra/docker-compose.prod.yml`
4. Em **Environment Variables**, cole as variáveis do `.env.production.example` com os valores reais

### Variáveis obrigatórias a preencher no Coolify

| Variável | Valor |
|---|---|
| `POSTGRES_USER` | `fiurj` |
| `POSTGRES_PASSWORD` | senha forte gerada |
| `POSTGRES_DB` | `fiurj_plataforma` |
| `JWT_SECRET` | chave de 64 bytes (veja comando abaixo) |
| `FRONTEND_URL` | `https://sga.fiurj.edu.br` |
| `NEXT_PUBLIC_API_URL` | `https://sga.fiurj.edu.br/api/v1` |

Para gerar o JWT_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## Passo 4 — Configurar domínio e HTTPS

1. No Coolify, clique no serviço **frontend**
2. Em **Domains**, adicione: `sga.fiurj.edu.br`
3. Ative **HTTPS (Let's Encrypt)** — o Coolify configura automaticamente via Traefik
4. Repita para o **backend**: `api.fiurj.edu.br` (ou use o mesmo domínio com path `/api`)

> Se usar domínio único (`sga.fiurj.edu.br`), o rewrite do Next.js já encaminha
> `/api/*` para o backend — não precisa expor o backend diretamente.

---

## Passo 5 — Rodar o seed (primeira vez)

Após o primeiro deploy bem-sucedido, acesse o terminal do container backend no Coolify
(**Containers → backend → Terminal**) e rode:

```bash
npx prisma db seed
```

Isso cria os usuários iniciais:
- `admin@fiurj.edu.br` / `admin123`
- `secretaria@fiurj.edu.br` / `sec123`

**Troque as senhas imediatamente após o primeiro login.**

---

## Deploy automático

Por padrão o Coolify faz deploy automático a cada push na branch `main`.
Para desativar (deploy manual), desmarque **Auto Deploy** nas configurações do recurso.

---

## Checklist de produção

- [ ] Senhas do banco fortes (não usar as do `.env.example`)
- [ ] `JWT_SECRET` aleatório e longo
- [ ] HTTPS ativado
- [ ] Senhas dos usuários seed trocadas após primeiro login
- [ ] MFA ativado para Admin, Secretaria e Financeiro
- [ ] Backup automático do volume `postgres_data` configurado na Hostinger
