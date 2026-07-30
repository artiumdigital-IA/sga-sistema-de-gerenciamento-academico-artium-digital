import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import type { Response } from 'express';
import * as ExcelJS from 'exceljs';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { CreateLivroDto } from './dto/create-livro.dto';
import { UpdateLivroDto } from './dto/update-livro.dto';
import { CreateExemplarDto } from './dto/create-exemplar.dto';

// Mesma ordem de colunas do modelo/importação em lote (ver
// COLUNAS_MODELO_LIVROS no frontend e ImportarLivrosDto no backend) -- o
// que sai daqui pode ser editado e re-importado direto, sem reordenar nada.
const COLUNAS_EXPORTACAO_IMPORTACAO = ['Titulo', 'Autor', 'Editora', 'ISBN', 'Categoria', 'AnoPublicacao', 'CDD', 'Cutter', 'Edicao', 'CodigoTombamento', 'Localizacao'];

@Injectable()
export class LivroService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(dto: CreateLivroDto, usuarioId?: string) {
    const livro = await this.prisma.livro.create({ data: dto });
    if (usuarioId) {
      await this.audit.log({ usuarioId, acao: 'CREATE', entidade: 'Livro', entidadeId: livro.id, dadosDepois: livro });
    }
    return livro;
  }

  findAll(busca?: string) {
    return this.prisma.livro.findMany({
      where: busca
        ? {
            OR: [
              { titulo: { contains: busca, mode: 'insensitive' } },
              { autor: { contains: busca, mode: 'insensitive' } },
              { categoria: { contains: busca, mode: 'insensitive' } },
            ],
          }
        : undefined,
      include: { exemplares: { select: { id: true, codigoTombamento: true, status: true, localizacao: true, numeroExemplar: true } } },
      orderBy: { titulo: 'asc' },
    });
  }

  async findOne(id: string) {
    const livro = await this.prisma.livro.findUnique({
      where: { id },
      include: { exemplares: { orderBy: { codigoTombamento: 'asc' } } },
    });
    if (!livro) throw new NotFoundException('Livro não encontrado.');
    return livro;
  }

  async update(id: string, dto: UpdateLivroDto, usuarioId?: string) {
    const antes = await this.findOne(id);
    const livro = await this.prisma.livro.update({ where: { id }, data: dto });
    if (usuarioId) {
      await this.audit.log({ usuarioId, acao: 'UPDATE', entidade: 'Livro', entidadeId: id, dadosAntes: antes, dadosDepois: livro });
    }
    return livro;
  }

  async remove(id: string, usuarioId?: string) {
    const antes = await this.findOne(id);
    const emprestado = antes.exemplares.some((e: any) => e.status === 'EMPRESTADO');
    if (emprestado) throw new BadRequestException('Não é possível remover: há exemplares emprestados no momento.');
    await this.prisma.livro.delete({ where: { id } });
    if (usuarioId) {
      await this.audit.log({ usuarioId, acao: 'DELETE', entidade: 'Livro', entidadeId: id, dadosAntes: antes });
    }
    return { message: 'Livro removido.' };
  }

  async addExemplar(livroId: string, dto: CreateExemplarDto, usuarioId?: string) {
    await this.findOne(livroId);
    const existente = await this.prisma.exemplarLivro.findUnique({ where: { codigoTombamento: dto.codigoTombamento } });
    if (existente) throw new ConflictException('Já existe um exemplar com esse código de tombamento.');

    // "ex.N" da etiqueta -- sequencial por livro (não é o tombamento, que é
    // único globalmente), atribuído automaticamente pelo backend.
    const totalExemplares = await this.prisma.exemplarLivro.count({ where: { livroId } });
    const numeroExemplar = totalExemplares + 1;

    const exemplar = await this.prisma.exemplarLivro.create({ data: { ...dto, livroId, numeroExemplar } });
    if (usuarioId) {
      await this.audit.log({ usuarioId, acao: 'CREATE', entidade: 'ExemplarLivro', entidadeId: exemplar.id, dadosDepois: exemplar });
    }
    return exemplar;
  }

  /** Usado pela etiqueta imprimível (frontend precisa de CDD/Cutter do
   * livro + código de tombamento/nº do exemplar numa única chamada, sem
   * precisar carregar a lista inteira de exemplares do livro). */
  async findExemplar(exemplarId: string) {
    const exemplar = await this.prisma.exemplarLivro.findUnique({
      where: { id: exemplarId },
      include: { livro: { select: { id: true, titulo: true, autor: true, cdd: true, cutter: true, anoPublicacao: true } } },
    });
    if (!exemplar) throw new NotFoundException('Exemplar não encontrado.');
    return exemplar;
  }

  async removeExemplar(livroId: string, exemplarId: string, usuarioId?: string) {
    const exemplar = await this.prisma.exemplarLivro.findUnique({ where: { id: exemplarId } });
    if (!exemplar || exemplar.livroId !== livroId) throw new NotFoundException('Exemplar não encontrado.');
    if (exemplar.status === 'EMPRESTADO') throw new BadRequestException('Não é possível remover: exemplar emprestado no momento.');

    await this.prisma.exemplarLivro.delete({ where: { id: exemplarId } });
    if (usuarioId) {
      await this.audit.log({ usuarioId, acao: 'DELETE', entidade: 'ExemplarLivro', entidadeId: exemplarId, dadosAntes: exemplar });
    }
    return { message: 'Exemplar removido.' };
  }

  /**
   * Exporta o acervo em XLSX na MESMA ordem de colunas usada pra importação
   * em lote (ver COLUNAS_MODELO_LIVROS no frontend / ImportarLivrosDto) --
   * dá pra baixar, editar e re-importar direto, sem reordenar nada. Uma
   * linha por exemplar físico (mesma granularidade da importação); livro
   * sem nenhum exemplar cadastrado ainda aparece numa linha só, sem tombamento.
   */
  async exportarExcelImportacao(res: Response): Promise<void> {
    const livros = await this.prisma.livro.findMany({
      include: { exemplares: { orderBy: { numeroExemplar: 'asc' } } },
      orderBy: { titulo: 'asc' },
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Acervo');
    sheet.columns = COLUNAS_EXPORTACAO_IMPORTACAO.map(header => ({ header, key: header }));
    sheet.getRow(1).font = { bold: true };

    for (const livro of livros) {
      const exemplares = livro.exemplares.length > 0 ? livro.exemplares : [null];
      for (const ex of exemplares) {
        sheet.addRow({
          Titulo: livro.titulo,
          Autor: livro.autor,
          Editora: livro.editora ?? '',
          ISBN: livro.isbn ?? '',
          Categoria: livro.categoria ?? '',
          AnoPublicacao: livro.anoPublicacao ?? '',
          CDD: livro.cdd ?? '',
          Cutter: livro.cutter ?? '',
          Edicao: livro.edicao ?? '',
          CodigoTombamento: ex?.codigoTombamento ?? '',
          Localizacao: ex?.localizacao ?? '',
        });
      }
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="acervo-biblioteca-importacao.xlsx"');
    await workbook.xlsx.write(res);
    res.end();
  }
}
