import { Injectable, NotFoundException } from '@nestjs/common';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';

@Injectable()
export class DocumentoAlunoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async findByAluno(alunoId: string) {
    const aluno = await this.prisma.aluno.findUnique({ where: { id: alunoId }, select: { id: true, nome: true, ra: true } });
    if (!aluno) throw new NotFoundException('Aluno não encontrado.');
    const documentos = await this.prisma.documentoAluno.findMany({
      where: { alunoId },
      orderBy: { criadoEm: 'desc' },
    });
    return { aluno, documentos };
  }

  async create(alunoId: string, tipo: string, arquivo: { originalname: string; filename: string; size: number }, usuarioId?: string) {
    const aluno = await this.prisma.aluno.findUnique({ where: { id: alunoId } });
    if (!aluno) throw new NotFoundException('Aluno não encontrado.');

    const documento = await this.prisma.documentoAluno.create({
      data: {
        alunoId,
        tipo,
        nomeArquivo: arquivo.originalname,
        url: `/uploads/documentos/${arquivo.filename}`,
        tamanho: arquivo.size,
      },
    });

    if (usuarioId) {
      await this.audit.log({ usuarioId, acao: 'CREATE', entidade: 'DocumentoAluno', entidadeId: documento.id, dadosDepois: documento });
    }
    return documento;
  }

  async remove(id: string, usuarioId?: string) {
    const documento = await this.prisma.documentoAluno.findUnique({ where: { id } });
    if (!documento) throw new NotFoundException('Documento não encontrado.');

    await this.prisma.documentoAluno.delete({ where: { id } });

    // Tenta apagar o arquivo físico; se já não existir, ignora.
    try {
      const nomeArquivo = documento.url.split('/').pop();
      if (nomeArquivo) await unlink(join(process.cwd(), 'uploads', 'documentos', nomeArquivo));
    } catch { /* arquivo ja ausente do disco — segue o fluxo */ }

    if (usuarioId) {
      await this.audit.log({ usuarioId, acao: 'DELETE', entidade: 'DocumentoAluno', entidadeId: id, dadosAntes: documento });
    }
    return { message: 'Documento removido.' };
  }
}
