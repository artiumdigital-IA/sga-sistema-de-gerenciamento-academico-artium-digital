import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { CreateRequerimentoDto } from './dto/create-requerimento.dto';
import { UpdateRequerimentoDto } from './dto/update-requerimento.dto';

interface ArquivoUpload {
  originalname: string;
  filename: string;
  size: number;
}

@Injectable()
export class RequerimentoService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  async create(dto: CreateRequerimentoDto, userId?: string) {
    const aluno = await this.prisma.aluno.findUnique({ where: { id: dto.alunoId } });
    if (!aluno) throw new NotFoundException('Aluno não encontrado');
    const item = await (this.prisma as any).requerimento.create({
      data: dto,
      include: { aluno: { select: { id: true, nome: true, ra: true } }, tipoCatalogo: true },
    });
    await this.audit.log({ usuarioId: userId, acao: 'CREATE', entidade: 'Requerimento', entidadeId: item.id, dadosDepois: item });
    return item;
  }

  /** Autoatendimento — o próprio aluno abre um requerimento escolhendo um
   * item da tabela de preços (ver TipoRequerimentoCatalogo). `tipo` (enum
   * antigo) grava OUTRO só pra manter a coluna não-nula; quem quiser saber o
   * tipo de verdade lê `tipoCatalogo`. Chamado por DiscenteService — nunca
   * recebe alunoId de fora, sempre já vem resolvido do usuário logado.
   *
   * `arquivo` é obrigatório quando o tipo escolhido tem `exigeAnexo` (ex:
   * Hora Complementar — o aluno precisa anexar o certificado). Validado aqui
   * no backend também, não só na UI, pra não depender só do front pra isso. */
  async abrirPorAluno(alunoId: string, tipoCatalogoId: string, descricao: string | undefined, arquivo: ArquivoUpload | undefined, usuarioId?: string) {
    const tipoCatalogo = await this.prisma.tipoRequerimentoCatalogo.findUnique({ where: { id: tipoCatalogoId } });
    if (!tipoCatalogo || !tipoCatalogo.ativo) throw new NotFoundException('Tipo de requerimento não encontrado.');
    if (tipoCatalogo.exigeAnexo && !arquivo) {
      throw new BadRequestException('Anexe o certificado (foto ou PDF) pra solicitar este requerimento.');
    }

    const item = await (this.prisma as any).requerimento.create({
      data: {
        alunoId,
        tipo: 'OUTRO',
        tipoCatalogoId,
        descricao,
        arquivoNome: arquivo?.originalname,
        arquivoUrl: arquivo ? `/uploads/requerimentos/${arquivo.filename}` : undefined,
        arquivoTamanho: arquivo?.size,
      },
      include: { aluno: { select: { id: true, nome: true, ra: true } }, tipoCatalogo: true },
    });
    await this.audit.log({ usuarioId, acao: 'CREATE', entidade: 'Requerimento', entidadeId: item.id, dadosDepois: item });
    return item;
  }

  findAll(alunoId?: string, status?: string, tipo?: string, tipoCatalogoId?: string) {
    return (this.prisma as any).requerimento.findMany({
      where: {
        ...(alunoId ? { alunoId } : {}),
        ...(status ? { status } : {}),
        ...(tipo ? { tipo } : {}),
        ...(tipoCatalogoId ? { tipoCatalogoId } : {}),
      },
      include: {
        aluno: { select: { id: true, nome: true, ra: true, curso: { select: { nome: true } } } },
        tipoCatalogo: true,
        horaComplementar: true,
      },
      orderBy: { criadoEm: 'desc' },
    });
  }

  async findOne(id: string) {
    const item = await (this.prisma as any).requerimento.findUnique({
      where: { id },
      include: {
        aluno: { select: { id: true, nome: true, ra: true, email: true, curso: { select: { nome: true } } } },
        tipoCatalogo: true,
        horaComplementar: true,
      },
    });
    if (!item) throw new NotFoundException('Requerimento não encontrado');
    return item;
  }

  /** Deferir um requerimento do catálogo "Hora Complementar" gera na hora o
   * lançamento real de crédito (HoraComplementar), reaproveitando o
   * certificado já anexado pelo aluno ao abrir o requerimento — fecha o
   * buraco que existia entre o aluno pedir e receber o crédito de fato.
   * `professorId` fica nulo (quem aprova aqui é COORDENADOR/SECRETARIA/ADMIN,
   * não necessariamente um Professor cadastrado — ver schema.prisma). Só gera
   * uma vez por requerimento (unique em `requerimentoId`); reenviar DEFERIDO
   * pra um requerimento que já gerou o lançamento não duplica nada. */
  async update(id: string, dto: UpdateRequerimentoDto, userId?: string) {
    const before = await this.findOne(id);
    const { horas, ...dadosRequerimento } = dto;

    const ehHoraComplementar = before.tipoCatalogo?.nome === 'Hora Complementar';
    const vaiDeferir = dadosRequerimento.status === 'DEFERIDO';
    const jaGerado = !!before.horaComplementar;
    const vaiGerarLancamento = ehHoraComplementar && vaiDeferir && !jaGerado;

    if (vaiGerarLancamento) {
      if (!horas) throw new BadRequestException('Informe quantas horas conceder pra deferir este requerimento.');
      if (!before.arquivoUrl) throw new BadRequestException('Requerimento sem certificado anexado — não é possível lançar horas.');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      if (vaiGerarLancamento) {
        await (tx as any).horaComplementar.create({
          data: {
            alunoId: before.alunoId,
            professorId: null,
            horas,
            nomeArquivo: before.arquivoNome,
            url: before.arquivoUrl,
            tamanho: before.arquivoTamanho ?? 0,
            observacoes: dadosRequerimento.resposta ?? before.descricao,
            requerimentoId: id,
          },
        });
      }
      return (tx as any).requerimento.update({
        where: { id },
        data: dadosRequerimento,
        include: {
          aluno: { select: { id: true, nome: true, ra: true } },
          tipoCatalogo: true,
          horaComplementar: true,
        },
      });
    });

    await this.audit.log({ usuarioId: userId, acao: 'UPDATE', entidade: 'Requerimento', entidadeId: id, dadosAntes: before, dadosDepois: updated });
    return updated;
  }
}
