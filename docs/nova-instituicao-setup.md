# Setup — nova instituição (cópia limpa da plataforma)

> Guia pra levar este código (originalmente construído pra FIURJ) e transformá-lo
> na plataforma acadêmica de **outra instituição**, do zero (banco vazio, marca
> própria). Diferente de `migracao-para-outra-vps.md` (que copia código **+**
> banco **+** uploads da FIURJ pra uma VPS nova) — aqui a ideia é só reaproveitar
> o **código**, sem nenhum dado real da FIURJ.

---

## 0. O que é reaproveitável e o que não é

| Reaproveita 100% | Precisa revisar/trocar |
|---|---|
| Stack técnica inteira (NestJS/Prisma/Postgres/Next.js/Expo) | Nome, logo, cores (tela **Admin → Identidade Visual**, sem editar código) |
| Todos os módulos já construídos (acadêmico, financeiro básico, ingresso, secretaria, biblioteca, suporte, apps mobile, Gerador de Prova, Relatórios Master, perfil MASTER etc.) | **Regras de negócio acadêmicas** — nota mínima, fórmula de exame final, frequência mínima etc. foram confirmadas especificamente com a secretaria da FIURJ (ver `resultado-disciplina.service.ts`) — a nova instituição pode ter regras diferentes |
| Estrutura de permissões (perfis, matriz de telas) | Enums fixos no `schema.prisma` que carregam valor institucional da FIURJ: `SituacaoVinculo`, `FormaIngresso`, cursos/disciplinas de exemplo do seed — ajustar se a nova instituição tiver categorias diferentes |
| Segurança (guards, RBAC, LGPD/auditoria) | Domínio, e-mails/senhas de todos os usuários (nunca reaproveitar segredo de produção da FIURJ) |

O sistema é **single-tenant** — não existe "adicionar uma instituição" dentro do
mesmo banco. Uma cópia = um deploy inteiro separado (banco, containers, domínio
próprios).

---

## 1. Estratégia de repositório Git

Recomendado: **repositório novo**, não um fork público — evita misturar
histórico/commits com a FIURJ e evita dar `push` sem querer no repo de produção
dela.

```bash
git clone https://github.com/fiurjids-byte/fiurj-plataforma.git nome-da-nova-instituicao
cd nome-da-nova-instituicao
git remote remove origin

# crie um repositório vazio novo no GitHub (via web ou `gh repo create`) e:
git remote add origin https://github.com/<sua-conta>/<novo-repo>.git
git push -u origin main
```

O histórico de commits da FIURJ vem junto (não atrapalha, é só referência) —
se quiser um histórico limpo, `rm -rf .git && git init` antes do primeiro commit.

---

## 2. Ambiente de desenvolvimento local (na máquina nova)

```bash
# dependências
cd backend && npm install
cd ../frontend && npm install
cd ../mobile && npm install          # só se for mexer no app do aluno
cd ../mobile-docente && npm install  # só se for mexer no app do professor

# banco local (Postgres 16 + Redis 7 via Docker)
cd ../infra && docker compose up -d
```

**`backend/.env`** (copie de `.env.example` se existir, senão crie):
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/plataforma?schema=public"
JWT_SECRET=<gerar — comando abaixo>
JWT_EXPIRES_IN=1d
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```
Gerar `JWT_SECRET`:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**`frontend/.env.local`**:
```
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

Migrations + seed:
```bash
cd backend
npx prisma migrate deploy
npx prisma db seed
```

> ⚠️ O seed cria dados de **exemplo da FIURJ** (cursos "Direito"/"Gestão
> Pública", alunos e professores fictícios, chamados de suporte de teste
> etc.) — servem só de referência de "como o sistema é usado". Vá apagando
> e substituindo pelos dados reais da nova instituição pelas próprias telas
> (Acadêmico → Cursos/Alunos/Professores) conforme for configurando.
> Se preferir começar 100% vazio (só o usuário admin, sem nenhum dado de
> exemplo), peça pro Claude implementar uma flag `SKIP_SEED` — é uma
> mudança pequena em `prisma/seed.ts`, não implementada ainda.

Rodar local:
```bash
# terminal 1
cd backend && npm run start:dev      # porta 3001

# terminal 2
cd frontend && npm run dev           # porta 3000
```
Acesse `http://localhost:3000`, logue com `admin@fiurj.edu.br` / `admin123`,
**troque a senha imediatamente**, e configure **Admin → Identidade Visual**
(nome, logo colorida, logo branca, cores primária/secundária) — propaga
sozinho pro login, TopNav e todos os documentos impressos.

---

## 3. Deploy em produção (VPS nova, banco vazio)

1. **Provisionar a VPS** + instalar Coolify:
   ```bash
   curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
   ```
2. No Coolify: **Sources → GitHub App** → conecta o **novo** repositório
   (o da nova instituição, não o da FIURJ).
3. **New Resource → Docker Compose** → aponta pro arquivo
   `infra/docker-compose.prod.yml`.
4. Variáveis de ambiente (gerar segredos **novos**, nunca reaproveitar os da
   FIURJ — ver `infra/.env.production.example` pra lista completa):
   ```
   POSTGRES_USER=<novo>
   POSTGRES_PASSWORD=<novo, forte>
   POSTGRES_DB=<novo>
   DATABASE_URL=postgresql://<user>:<senha-url-encoded>@postgres:5432/<db>?schema=public
   JWT_SECRET=<novo, 64 bytes>
   JWT_EXPIRES_IN=1d
   FRONTEND_URL=https://dominio-da-nova-instituicao.com
   NEXT_PUBLIC_API_URL=https://dominio-da-nova-instituicao.com/api/v1
   NODE_ENV=production
   ```
   ⚠️ `DATABASE_URL` precisa ser adicionada manualmente como variável editável
   no Coolify — ele não interpola sozinho as vars do `docker-compose.prod.yml`
   (já resolvido assim na FIURJ, ver `CLAUDE.md` dela).
5. **Deploy** — sobe os 4 containers, roda `prisma migrate deploy` e o seed
   sozinho (mesmo aviso do banco de dados de exemplo acima).
6. **Domínio/HTTPS**: no serviço **frontend** → **Domains** → adiciona o
   domínio → ativa **HTTPS (Let's Encrypt)**. Numa VPS nova e limpa isso é
   mais simples que o setup atual da FIURJ (que tem um nginx legado de outro
   sistema ocupando a porta 80) — aqui o Traefik do próprio Coolify resolve
   tudo sozinho.
7. Primeiro acesso: logar, trocar senha do admin, configurar Identidade
   Visual, criar os usuários reais (ADMIN/MASTER da nova instituição) e
   desativar/apagar os de teste do seed.

Se em vez de banco vazio você quiser levar os **dados reais da FIURJ** pra
essa VPS nova (não é o caso normal de uma cópia pra outra instituição), use
`docs/migracao-para-outra-vps.md` em vez deste guia.

---

## 4. Antes de considerar "pronto pra valer" (checklist)

- [ ] Identidade Visual configurada (nome, logo, cores)
- [ ] Todos os usuários/dados de exemplo do seed removidos ou substituídos
- [ ] Regras de negócio acadêmicas revisadas com a secretaria da nova
      instituição (nota mínima, exame final, frequência mínima — hoje
      hardcoded em `backend/src/academic/resultado-disciplina/resultado-disciplina.service.ts`)
- [ ] Enums do Censo (`SituacaoVinculo`, `FormaIngresso` etc. no
      `schema.prisma`) conferem com a realidade da nova instituição
- [ ] Domínio próprio com HTTPS ativo
- [ ] Segredos (`JWT_SECRET`, senha do banco) gerados do zero, não copiados
      da FIURJ
- [ ] Ao menos um usuário MASTER/ADMIN real criado e os de teste
      desativados
