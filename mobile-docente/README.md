# FIURJ — App do Professor (mobile-docente)

React Native + Expo + TypeScript (Expo Router), mesma stack e mesma identidade visual do
app do aluno (`../mobile/`). App separado (bundle/package `br.edu.fiurj.docente`), login
restrito a contas com perfil PROFESSOR (rejeitado no próprio app se a conta não tiver
`professorId` vinculado — ver `lib/auth-context.tsx`).

## Menu

- **Início** — saudação + resumo das minhas turmas no período.
- **SGA** — placeholder ("Em breve").
- **Podcast** — placeholder ("Em breve").
- **Docentes On** — hub com 5 atalhos, cada um batendo num endpoint que já existe no backend:
  - **Pauta** — `GET/PUT /notas-pauta` (AV1-AV5, 2ª chamada, recuperação, faltas — regra semestral).
  - **Notas** — `GET/POST/DELETE /avaliacoes` + `POST /matriculas/:id/consolidar`.
  - **Captura de Prova** — `GET/POST/DELETE /docente/captura-prova` (foto via câmera/galeria).
  - **Alunos** — `GET /docente/alunos`.
  - **Aviso para Turma** — `GET/POST /docente/aviso-turma` (dispara push pros alunos matriculados).
  - **Chamado de Manutenção** — `GET/POST /chamados-manutencao` (self-service, não escopado a
    turma/oferta) + `GET /chamados-manutencao/meus` — abre e acompanha chamados de suporte
    (elétrica, hidráulica, TI, mobiliário...), atendidos pela equipe de manutenção (perfil
    MANUTENCAO) pelo dashboard web.

## Como rodar

```bash
cd mobile-docente
npm install
cp .env.example .env    # ajuste EXPO_PUBLIC_API_URL pro IP da sua máquina na rede local
npx expo start
```

Abra no celular com o app **Expo Go** (escaneia o QR code).

> Em dispositivo físico, `localhost` no `.env` aponta pro próprio celular, não pro seu PC —
> use o IP da sua máquina na rede Wi-Fi.

Este esqueleto **não foi rodado/instalado** no ambiente onde foi gerado (sandbox sem acesso
à internet pra baixar pacotes do npm) — rode `npm install` e `npx expo start` localmente
antes de testar. Depois do `npm install`, rode `npm run typecheck` pra conferir que não
sobrou nenhum erro de tipo (revisão manual já feita, mas sem o compilador de verdade
disponível durante a geração deste esqueleto).

## Decisões em aberto

- **Captura de Prova só aceita foto (câmera/galeria)**, não anexo de PDF de verdade — o
  backend aceita PDF também; adicionar `expo-document-picker` numa rodada futura se isso
  for necessário no dia a dia.
- **Pauta vs. Notas** — as duas telas existem em paralelo porque o backend também mantém as
  duas regras (`NotaPauta` semestral e `Avaliacao`/`ResultadoDisciplina`) sem uma decisão
  final de qual é a fonte de verdade pra situação do aluno (ver CLAUDE.md do projeto).
- **Push notifications** — este app não registra token de push (diferente do app do aluno,
  que recebe os avisos). Se no futuro o professor precisar de notificação (ex.: resposta de
  um aluno, prazo de lançamento de nota), replicar `mobile/lib/push.ts` aqui.
