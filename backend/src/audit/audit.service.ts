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
}
