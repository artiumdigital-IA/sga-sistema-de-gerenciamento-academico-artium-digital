import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface AuditPayload {
  usuarioId?: string;
  acao: string;        // 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | etc.
  entidade: string;    // nome da tabela
  entidadeId?: string;
  dadosAntes?: object;
  dadosDepois?: object;
  ip?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(payload: AuditPayload): Promise<void> {
    await this.prisma.auditoria.create({ data: payload });
  }

  /**
   * Consulta o log de auditoria com filtros opcionais, paginado.
   * Usado pela tela "Consultar Arquivo de Log" (ADMIN only).
   */
  async findAll(filtros: {
    entidade?: string;
    acao?: string;
    usuarioId?: string;
    dataInicio?: string;
    dataFim?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filtros.page && filtros.page > 0 ? filtros.page : 1;
    const limit = filtros.limit && filtros.limit > 0 && filtros.limit <= 200 ? filtros.limit : 50;

    const where = {
      ...(filtros.entidade ? { entidade: filtros.entidade } : {}),
      ...(filtros.acao ? { acao: filtros.acao } : {}),
      ...(filtros.usuarioId ? { usuarioId: filtros.usuarioId } : {}),
      ...(filtros.dataInicio || filtros.dataFim
        ? {
            criadoEm: {
              ...(filtros.dataInicio ? { gte: new Date(filtros.dataInicio) } : {}),
              ...(filtros.dataFim ? { lte: new Date(`${filtros.dataFim}T23:59:59.999Z`) } : {}),
            },
          }
        : {}),
    };

    const [total, registros] = await Promise.all([
      this.prisma.auditoria.count({ where }),
      this.prisma.auditoria.findMany({
        where,
        include: { usuario: { select: { email: true, perfil: true } } },
        orderBy: { criadoEm: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return { total, page, limit, totalPaginas: Math.ceil(total / limit), registros };
  }
}
