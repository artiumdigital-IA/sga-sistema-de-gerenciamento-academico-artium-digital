# FIURJ — App do Aluno (mobile)

Esqueleto inicial em **React Native + Expo + TypeScript** (Expo Router). Uma build só de código
gera o app tanto pra Android quanto pra iOS.

## O que já tem

- Login (`POST /auth/login`) com token guardado no SecureStore (Keychain/Keystore, não
  AsyncStorage puro — é um JWT).
- Guard de rotas: sem sessão → `/login`; com sessão → `/(tabs)`.
- 5 abas, cada uma batendo num endpoint que **já existe** no backend:
  - **Início** — avisos recentes (`GET /avisos`).
  - **Boletim** — notas/frequência por período (`GET /documentos/boletim/:alunoId`).
  - **Histórico** — CR, integralização, disciplinas por período (`GET /documentos/historico-oficial/:alunoId`).
  - **Documentos** — Carteirinha + Declaração de Matrícula (resumo em cards) + os 4 documentos
    oficiais (Declaração, Boletim, Carteirinha, Histórico) com layout de impressão de verdade,
    abertos numa WebView autenticada (ver ADR abaixo, resolvido).
  - **Avisos** — mural completo (`GET /avisos`).

Este é um **esqueleto**, não um produto pronto — o objetivo é ter uma base correta pra você rodar,
ver funcionando contra o backend real, e a partir daí decidir o que ajustar visualmente e o que
priorizar a seguir (ver `escopo-app-aluno-v1.md` que te mandei junto).

## Como rodar

Isso aqui **não foi rodado/instalado** neste esqueleto — o ambiente onde ele foi gerado não tem
acesso à internet pra baixar pacotes do npm. Rode localmente na sua máquina:

```bash
cd mobile
npm install
cp .env.example .env    # ajuste EXPO_PUBLIC_API_URL pro IP da sua máquina na rede local
npx expo start
```

Abra no celular com o app **Expo Go** (escaneia o QR code) ou num emulador Android/simulador iOS.

> **Importante:** em dispositivo físico, `localhost` no `.env` aponta pro próprio celular, não pro
> seu PC. Use o IP da sua máquina na rede Wi-Fi (ex: `192.168.0.10`) — o `.env.example` já tem essa
> observação.

## Decisões em aberto (ADR resumido)

**PDF/impressão dos documentos — RESOLVIDO (Jul/2026), opção 1 escolhida.** Os endpoints de
`/documentos` retornam JSON — quem monta o layout bonito é o frontend web, via CSS de impressão do
navegador. Implementado: `app/documento-webview.tsx` abre uma `react-native-webview` apontando pra
`EXPO_PUBLIC_WEB_URL + path` (ex.: `/dashboard/secretaria/documentos/boletim/:alunoId`), autenticada
injetando o cookie `fiurj_token` (lido do SecureStore via `getCurrentToken()`) em dois pontos:
`source.headers.Cookie` (cobre o middleware do Next.js, que roda server-side na 1ª requisição) e
`injectedJavaScriptBeforeContentLoaded` (seta `document.cookie` pro `getToken()` client-side da
página React conseguir montar o header `Authorization` das próprias chamadas de API que ela faz).
Chamado a partir de **Documentos** (Declaração/Boletim/Carteirinha/Histórico Oficial). Limitação
conhecida: a impressão de verdade (`window.print()`) funciona nativamente no iOS (WKWebView) mas
não tem suporte nativo no Android dentro da WebView embutida — nesse caso o usuário ainda consegue
ver/rolar o documento com o layout oficial, só não aciona o diálogo de impressão do SO por dentro
do app (rodar "Gerar PDF nativo no app" via `expo-print`, opção 2 abaixo, resolveria isso se virar
prioridade).

2. **Gerar PDF nativo no app** (ex.: `expo-print`) a partir do JSON — mais trabalho, mas
   experiência mais "nativa" e resolveria a impressão no Android. Não implementado.

**Ícone/splash.** `assets/*.png` são placeholders sólidos na cor primária da FIURJ (`#1C3A6B`) —
troque pelos arquivos de verdade quando tiver a arte final.

**Push notifications, matrícula pelo app, mensagens, pagamento** — fora do V1, dependem de endpoint
novo no backend. Ver `escopo-app-aluno-v1.md`.

## Publicar nas lojas

Quando o app estiver pronto pra ir além do celular de teste:

- **Android** — Google Play Console, taxa única de US$25.
- **iOS** — Apple Developer Program, US$99/ano. Não precisa de Mac físico: o
  [EAS Build](https://docs.expo.dev/build/introduction/) da Expo compila o `.ipa` na nuvem.
