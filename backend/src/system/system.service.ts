import { Injectable } from '@nestjs/common';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SystemService {
  // Baseline pra calcular uso de CPU por janela (delta entre chamadas), já que
  // `process.cpuUsage()` sozinho só dá o acumulado desde o início do processo.
  private cpuBaseline = process.cpuUsage();
  private cpuBaselineTimestamp = Date.now();

  constructor(private readonly prisma: PrismaService) {}

  async getStatus() {
    const [banco, contagens, auditoriaRecente, login] = await Promise.all([
      this.getBancoInfo(),
      this.getContagens(),
      this.getAuditoriaRecente(),
      this.getLoginInfo(),
    ]);

    return {
      backend: this.getBackendInfo(),
      sistemaOperacional: this.getOsInfo(),
      disco: this.getDiscoInfo(),
      uploads: this.getUploadsInfo(),
      banco,
      contagens,
      login,
      auditoriaRecente,
      geradoEm: new Date().toISOString(),
    };
  }

  private getBackendInfo() {
    const mem = process.memoryUsage();
    return {
      nodeVersion: process.version,
      ambiente: process.env.NODE_ENV ?? 'development',
      uptimeSegundos: Math.round(process.uptime()),
      memoria: { rss: mem.rss, heapUsed: mem.heapUsed, heapTotal: mem.heapTotal },
      cpu: this.getCpuInfo(),
    };
  }

  /**
   * Uso de CPU do processo Node desde a última chamada deste método (janela
   * de ~20s, mesmo intervalo do polling do painel) — não é um "instantâneo"
   * de verdade (Node não expõe isso nativamente), mas dá uma leitura útil de
   * tendência: percentual de UM núcleo consumido na janela.
   */
  private getCpuInfo() {
    const delta = process.cpuUsage(this.cpuBaseline);
    const agora = Date.now();
    const janelaMs = agora - this.cpuBaselineTimestamp;
    const totalMs = (delta.user + delta.system) / 1000;
    const percentualUmNucleo = janelaMs > 0 ? Math.round((totalMs / janelaMs) * 1000) / 10 : null;

    this.cpuBaseline = process.cpuUsage();
    this.cpuBaselineTimestamp = agora;

    return {
      percentualUmNucleo,
      userMs: Math.round(delta.user / 1000),
      systemMs: Math.round(delta.system / 1000),
      janelaMs,
    };
  }

  /**
   * Métricas do "SO" via módulo `os` do Node. Em containers Docker sem limite de
   * cgroup configurado (caso padrão do docker-compose/Coolify deste projeto),
   * `os.totalmem()`/`os.freemem()`/`os.loadavg()` refletem o HOST (a VPS), não
   * o container isoladamente — é a aproximação mais próxima disponível sem dar
   * ao backend acesso a `/proc` do host ou ao socket do Docker.
   */
  private getOsInfo() {
    const totalmem = os.totalmem();
    const freemem = os.freemem();
    return {
      hostname: os.hostname(),
      plataforma: os.platform(),
      arquitetura: os.arch(),
      cpus: os.cpus().length,
      loadAverage: os.loadavg(),
      memoriaTotalBytes: totalmem,
      memoriaLivreBytes: freemem,
      memoriaUsadaPercentual: totalmem > 0 ? Math.round(((totalmem - freemem) / totalmem) * 1000) / 10 : null,
    };
  }

  /**
   * Espaço em disco via `fs.statfs` no diretório de trabalho do backend. Como o
   * container Docker roda sobre overlay2 (sem quota própria configurada), isso
   * normalmente reflete o disco real da VPS, não um limite artificial do container.
   */
  private getDiscoInfo() {
    try {
      const stat = fs.statfsSync(process.cwd());
      const totalBytes = Number(stat.blocks) * Number(stat.bsize);
      const livreBytes = Number(stat.bfree) * Number(stat.bsize);
      const usadoBytes = totalBytes - livreBytes;
      return {
        totalBytes,
        livreBytes,
        usadoBytes,
        usadoPercentual: totalBytes > 0 ? Math.round((usadoBytes / totalBytes) * 1000) / 10 : null,
      };
    } catch {
      return null;
    }
  }

  /**
   * Tamanho da pasta de uploads (fotos de perfil + documentos digitalizados de
   * aluno), somando por subpasta. Não recursivo — os dois diretórios conhecidos
   * (`avatars`, `documentos`) guardam arquivos direto, sem subpastas por usuário.
   */
  private getUploadsInfo() {
    const base = path.join(process.cwd(), 'uploads');
    const pastas = ['avatars', 'documentos'];
    const porPasta: { pasta: string; arquivos: number; bytes: number }[] = [];
    let totalArquivos = 0;
    let totalBytes = 0;

    for (const pasta of pastas) {
      const dir = path.join(base, pasta);
      let arquivos = 0;
      let bytes = 0;
      try {
        if (fs.existsSync(dir)) {
          for (const nome of fs.readdirSync(dir)) {
            try {
              const st = fs.statSync(path.join(dir, nome));
              if (st.isFile()) { arquivos++; bytes += st.size; }
            } catch { /* arquivo pode ter sido removido entre o readdir e o stat */ }
          }
        }
      } catch { /* pasta inacessível — segue com zero */ }
      porPasta.push({ pasta, arquivos, bytes });
      totalArquivos += arquivos;
      totalBytes += bytes;
    }

    return { porPasta, totalArquivos, totalBytes };
  }

  private async getBancoInfo() {
    const inicio = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      const latenciaMs = Date.now() - inicio;

      const [versaoRow] = await this.prisma.$queryRaw<{ version: string }[]>`SELECT version()`;
      const [tamanhoRow] = await this.prisma.$queryRaw<{ bytes: bigint }[]>`SELECT pg_database_size(current_database()) as bytes`;
      const [conexoesRow] = await this.prisma.$queryRaw<{ total: bigint }[]>`
        SELECT count(*) as total FROM pg_stat_activity WHERE datname = current_database()
      `;

      return {
        conectado: true,
        latenciaMs,
        versao: versaoRow?.version?.split(',')[0] ?? null,
        tamanhoBytes: tamanhoRow ? Number(tamanhoRow.bytes) : null,
        conexoesAtivas: conexoesRow ? Number(conexoesRow.total) : null,
      };
    } catch (e: any) {
      return { conectado: false, latenciaMs: null, versao: null, tamanhoBytes: null, conexoesAtivas: null, erro: e?.message ?? 'Falha ao conectar' };
    }
  }

  private async getContagens() {
    const [
      alunos, professores, cursos, disciplinas, ofertas, matriculas,
      usuarios, protocolos, ocorrencias, mensagens, requerimentos,
      processosSeletivos, candidatos, contratos, avisos, auditoriasTotais,
    ] = await Promise.all([
      this.prisma.aluno.count(),
      this.prisma.professor.count(),
      this.prisma.curso.count(),
      this.prisma.disciplina.count(),
      this.prisma.oferta.count(),
      this.prisma.matriculaDisciplina.count(),
      this.prisma.usuario.count(),
      this.prisma.protocolo.count(),
      this.prisma.ocorrencia.count(),
      this.prisma.mensagem.count(),
      this.prisma.requerimento.count(),
      this.prisma.processoSeletivo.count(),
      this.prisma.candidato.count(),
      this.prisma.contratoMatricula.count(),
      this.prisma.aviso.count(),
      this.prisma.auditoria.count(),
    ]);

    const [usuariosPorPerfil, usuariosPorStatus] = await Promise.all([
      this.prisma.usuario.groupBy({ by: ['perfil'], _count: { _all: true } }),
      this.prisma.usuario.groupBy({ by: ['status'], _count: { _all: true } }),
    ]);

    return {
      alunos, professores, cursos, disciplinas, ofertas, matriculas,
      usuarios, protocolos, ocorrencias, mensagens, requerimentos,
      processosSeletivos, candidatos, contratos, avisos, auditoriasTotais,
      usuariosPorPerfil: usuariosPorPerfil.map(u => ({ perfil: u.perfil, total: u._count._all })),
      usuariosPorStatus: usuariosPorStatus.map(u => ({ status: u.status, total: u._count._all })),
    };
  }

  private getAuditoriaRecente() {
    return this.prisma.auditoria.findMany({
      take: 15,
      orderBy: { criadoEm: 'desc' },
      include: { usuario: { select: { email: true, nome: true } } },
    });
  }

  /** Segurança: últimas tentativas de login (sucesso e falha) + contagem de falhas nas últimas 24h. */
  private async getLoginInfo() {
    const desde24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [recentes, falhas24h, sucessos24h] = await Promise.all([
      this.prisma.auditoria.findMany({
        where: { acao: { in: ['LOGIN', 'LOGIN_FALHA'] } },
        orderBy: { criadoEm: 'desc' },
        take: 10,
        include: { usuario: { select: { email: true } } },
      }),
      this.prisma.auditoria.count({ where: { acao: 'LOGIN_FALHA', criadoEm: { gte: desde24h } } }),
      this.prisma.auditoria.count({ where: { acao: 'LOGIN', criadoEm: { gte: desde24h } } }),
    ]);

    return { recentes, falhas24h, sucessos24h };
  }
}
