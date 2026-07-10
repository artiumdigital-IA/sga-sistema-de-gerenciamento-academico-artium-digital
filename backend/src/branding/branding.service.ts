import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { UpdateBrandingDto } from './dto/update-branding.dto';

const CONFIG_ID = 'default';

/** Uma imagem da galeria de publicidade exibida no /dashboard do perfil
 * ALUNO (ver ConfiguracaoVisual.galeriaPublicidade no schema — guardado
 * como JSON, não é uma tabela própria). */
export interface ImagemGaleria {
  id: string;
  url: string;
  ordem: number;
  ativa: boolean;
  link: string | null;
  criadoEm: string;
}

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

  // ── Galeria de Publicidade (imagens do /dashboard do aluno) ────────────
  // Guardada como JSON em ConfiguracaoVisual.galeriaPublicidade — poucas
  // imagens no máximo, não justifica uma tabela própria nem migração de
  // dados. Sempre reordenada por `ordem` ao ler.

  private async galeriaAtual(): Promise<ImagemGaleria[]> {
    const config = await this.getConfig();
    const lista = (config.galeriaPublicidade as unknown as ImagemGaleria[]) ?? [];
    return Array.isArray(lista) ? lista : [];
  }

  /** Todas as imagens (inclusive inativas) — usado pela tela de admin. */
  async listarGaleria(): Promise<ImagemGaleria[]> {
    const lista = await this.galeriaAtual();
    return [...lista].sort((a, b) => a.ordem - b.ordem);
  }

  async adicionarImagemGaleria(url: string, usuarioId?: string): Promise<ImagemGaleria[]> {
    const atual = await this.galeriaAtual();
    const proximaOrdem = atual.length > 0 ? Math.max(...atual.map(i => i.ordem)) + 1 : 1;
    const nova: ImagemGaleria = {
      id: randomUUID(),
      url,
      ordem: proximaOrdem,
      ativa: true,
      link: null,
      criadoEm: new Date().toISOString(),
    };
    const atualizada = [...atual, nova];
    await this.prisma.configuracaoVisual.update({
      where: { id: CONFIG_ID },
      data: { galeriaPublicidade: atualizada as any },
    });
    if (usuarioId) {
      await this.audit.log({ usuarioId, acao: 'CREATE', entidade: 'GaleriaPublicidade', entidadeId: nova.id, dadosDepois: nova });
    }
    return this.listarGaleria();
  }

  async atualizarImagemGaleria(
    id: string,
    dto: { ativa?: boolean; ordem?: number; link?: string | null },
    usuarioId?: string,
  ): Promise<ImagemGaleria[]> {
    const atual = await this.galeriaAtual();
    const idx = atual.findIndex(i => i.id === id);
    if (idx === -1) throw new NotFoundException('Imagem da galeria não encontrada.');

    const antes = atual[idx];
    const depois: ImagemGaleria = {
      ...antes,
      ativa: dto.ativa ?? antes.ativa,
      ordem: dto.ordem ?? antes.ordem,
      link: dto.link !== undefined ? dto.link : antes.link,
    };
    const atualizada = [...atual];
    atualizada[idx] = depois;

    await this.prisma.configuracaoVisual.update({
      where: { id: CONFIG_ID },
      data: { galeriaPublicidade: atualizada as any },
    });
    if (usuarioId) {
      await this.audit.log({ usuarioId, acao: 'UPDATE', entidade: 'GaleriaPublicidade', entidadeId: id, dadosAntes: antes, dadosDepois: depois });
    }
    return this.listarGaleria();
  }

  /** Remove a imagem do JSON e retorna a URL removida (o controller apaga o
   * arquivo físico correspondente em /uploads/branding). */
  async removerImagemGaleria(id: string, usuarioId?: string): Promise<{ lista: ImagemGaleria[]; urlRemovida: string }> {
    const atual = await this.galeriaAtual();
    const alvo = atual.find(i => i.id === id);
    if (!alvo) throw new NotFoundException('Imagem da galeria não encontrada.');

    const atualizada = atual.filter(i => i.id !== id);
    await this.prisma.configuracaoVisual.update({
      where: { id: CONFIG_ID },
      data: { galeriaPublicidade: atualizada as any },
    });
    if (usuarioId) {
      await this.audit.log({ usuarioId, acao: 'DELETE', entidade: 'GaleriaPublicidade', entidadeId: id, dadosAntes: alvo });
    }
    return { lista: await this.listarGaleria(), urlRemovida: alvo.url };
  }
}
