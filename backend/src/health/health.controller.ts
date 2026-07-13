import { Controller, Get } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';

@Controller('health')
export class HealthController {
  // Endpoint deliberadamente sem nenhuma consulta ao banco/Redis -- serve so
  // pra confirmar que o processo Nest terminou de subir e esta escutando na
  // porta. Usado pelo HEALTHCHECK do Docker (ver
  // infra/docker-compose.prod.yml) pra o Traefik NAO rotear requisicoes pro
  // container antes dele estar pronto.
  //
  // Investigacao do "Gateway Timeout intermitente" (Documentos, Identidade
  // Visual): o backend/Dockerfile roda "npx prisma migrate deploy && node
  // dist/src/main" -- ou seja, as migrations rodam ANTES do servidor
  // comecar a escutar na porta 3001. O docker-compose.prod.yml nao definia
  // nenhum healthcheck pro servico "backend" (so o "postgres" tinha). Sem
  // healthcheck, o Docker sempre reporta o container como "saudavel" (nao
  // tem o que reportar) e o Traefik comeca a mandar trafego assim que a
  // porta abre / o container sobe, mesmo que o processo ainda nao esteja
  // pronto pra responder (durante migrate deploy, num redeploy, ou apos um
  // restart por OOM/crash) -- essa janela e a causa mais provavel do erro,
  // junto com a ausencia de limites de CPU/memoria nos containers (4
  // servicos dividindo a mesma VPS sem limite pode gerar picos de latencia
  // sob carga). Nao foi possivel confirmar com 100% de certeza por falta de
  // acesso aos logs/metricas ao vivo da VPS/Coolify nesta sessao -- este
  // endpoint + o healthcheck no compose é a mitigacao de baixo risco
  // proposta pra essa janela especifica.
  @Public()
  @Get()
  check() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
