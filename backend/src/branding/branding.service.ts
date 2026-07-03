import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { UpdateBrandingDto } from './dto/update-branding.dto';

const CONFIG_ID = 'default';

@Injectable()
export class BrandingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** Sempre retorna a linha singleton — cria com os padrões se ainda não
   * existir (defensivo; a migração já insere a linha inicial, isso só cobre
   * um banco que por algum motivo não rodou a migração ainda). */
  async getConfig() {
    const existente = await this.prisma.configuracaoVisual.findUnique({ where: { id: CONFIG_ID } });
    if (existente) return existente;
    return this.prisma.configuracaoVisual.create({ data: { id: CONFIG_ID } });
  }

  async update(dto: UpdateBrandingDto, usuarioId?: string) {
    const antes = await this.getConfig();
    const config = await this.prisma.configuracaoVisual.update({
      where: { id: CONFIG_ID },
      data: dto,
    });
    if (usuarioId) {
      await this.audit.log({
        usuarioId,
        acao: 'UPDATE',
        entidade: 'ConfiguracaoVisual',
        entidadeId: CONFIG_ID,
        dadosAntes: antes,
        dadosDepois: config,
      });
    }
    return config;
  }

  async atualizarLogo(logoUrl: string, usuarioId?: string) {
    const antes = await this.getConfig();
    const config = await this.prisma.configuracaoVisual.update({
      where: { id: CONFIG_ID },
      data: { logoUrl },
    });
    if (usuarioId) {
      await this.audit.log({
        usuarioId,
        acao: 'UPDATE',
        entidade: 'ConfiguracaoVisual',
        entidadeId: CONFIG_ID,
        dadosAntes: { logoUrl: antes.logoUrl },
        dadosDepois: { logoUrl },
      });
    }
    return config;
  }

  async atualizarSimbolo(simboloUrl: string, usuarioId?: string) {
    const antes = await this.getConfig();
    const config = await this.prisma.configuracaoVisual.update({
      where: { id: CONFIG_ID },
      data: { simboloUrl },
    });
    if (usuarioId) {
      await this.audit.log({
        usuarioId,
        acao: 'UPDATE',
        entidade: 'ConfiguracaoVisual',
        entidadeId: CONFIG_ID,
        dadosAntes: { simboloUrl: antes.simboloUrl },
        dadosDepois: { simboloUrl },
      });
    }
    return config;
  }
}
