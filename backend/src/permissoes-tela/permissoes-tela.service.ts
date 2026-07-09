import { BadRequestException, Injectable } from '@nestjs/common';
import { Perfil } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { TELAS_SISTEMA } from './telas-sistema';

const TODOS_PERFIS: Perfil[] = ['ADMIN', 'SECRETARIA', 'FINANCEIRO', 'PROFESSOR', 'ALUNO'] as Perfil[];

@Injectable()
export class PermissoesTelaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Matriz completa: uma linha por tela, com o estado (habilitada/desabilitada)
   * de cada perfil. Combinações sem registro no banco entram como
   * habilitada=true (o default é liberado — só existe registro pro que já foi
   * mexido alguma vez).
   */
  async matriz() {
    const registros = await this.prisma.permissaoTela.findMany();
    const mapa = new Map(registros.map(r => [`${r.perfil}:${r.chaveTela}`, r.habilitada]));

    return TELAS_SISTEMA.map(tela => ({
      chave: tela.chave,
      label: tela.label,
      grupo: tela.grupo,
      perfis: Object.fromEntries(
        TODOS_PERFIS.map(perfil => [perfil, mapa.get(`${perfil}:${tela.chave}`) ?? true]),
      ) as Record<Perfil, boolean>,
    }));
  }

  async alternar(dto: { perfil: Perfil; chaveTela: string; habilitada: boolean }, operadorId?: string) {
    const tela = TELAS_SISTEMA.find(t => t.chave === dto.chaveTela);
    if (!tela) throw new BadRequestException(`Tela desconhecida: ${dto.chaveTela}`);

    const antes = await this.prisma.permissaoTela.findUnique({
      where: { perfil_chaveTela: { perfil: dto.perfil, chaveTela: dto.chaveTela } },
    });

    const registro = await this.prisma.permissaoTela.upsert({
      where: { perfil_chaveTela: { perfil: dto.perfil, chaveTela: dto.chaveTela } },
      update: { habilitada: dto.habilitada },
      create: { perfil: dto.perfil, chaveTela: dto.chaveTela, habilitada: dto.habilitada },
    });

    await this.audit.log({
      usuarioId: operadorId,
      acao: 'UPDATE',
      entidade: 'PermissaoTela',
      entidadeId: registro.id,
      dadosAntes: { habilitada: antes?.habilitada ?? true },
      dadosDepois: { perfil: dto.perfil, chaveTela: dto.chaveTela, habilitada: dto.habilitada, tela: tela.label },
    });

    return registro;
  }

  /** Usado por QUALQUER usuário autenticado (não só o admin master) — alimenta
   * o filtro de menu/rota no frontend pro próprio perfil. Retorna só as
   * chaves habilitadas (ausência de registro = habilitada). */
  async minhasChavesHabilitadas(perfil: Perfil): Promise<string[]> {
    const registros = await this.prisma.permissaoTela.findMany({
      where: { perfil, habilitada: false },
      select: { chaveTela: true },
    });
    const desativadas = new Set(registros.map(r => r.chaveTela));
    return TELAS_SISTEMA.map(t => t.chave).filter(chave => !desativadas.has(chave));
  }
}
