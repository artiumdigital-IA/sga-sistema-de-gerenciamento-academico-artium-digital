import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { promises as fs } from 'fs';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuditService } from '../../../audit/audit.service';
import { ParcelaService } from '../../parcela/parcela.service';
import { resolveAdapter } from '../bancos/cnab-bank-adapter.factory';
import { resolveBancoCnab } from '../bancos/bancos.util';
import { OcorrenciaParseada } from '../bancos/cnab-bank-adapter.interface';

interface ArquivoUpload { path: string; originalname: string; }

// Ocorrências que não são liquidação mas ainda assim mudam o status
// consolidado do boleto — o resto (débito de tarifa, confirmação de
// protesto, etc.) só fica registrado em OcorrenciaCnab, sem mexer no status.
const STATUS_POR_CODIGO: Record<string, string> = {
  '02': 'REGISTRADO',
  '03': 'REJEITADO',
  '09': 'CANCELADO',
  '10': 'CANCELADO',
  '23': 'PROTESTADO',
  '25': 'PROTESTADO',
};

@Injectable()
export class RetornoService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private parcelaService: ParcelaService,
  ) {}

  async importar(contaBancariaId: string, file: ArquivoUpload, userId: string) {
    if (!contaBancariaId) throw new BadRequestException('Informe a conta bancária do retorno.');

    const conta = await (this.prisma as any).contaBancaria.findUnique({ where: { id: contaBancariaId } });
    if (!conta) throw new NotFoundException('Conta bancária não encontrada.');
    if (!conta.cnabHabilitado || !conta.codigoBancoFebraban) {
      throw new BadRequestException('Conta bancária não está habilitada pra CNAB.');
    }

    const adapter = resolveAdapter(resolveBancoCnab(conta.codigoBancoFebraban));
    const conteudo = await fs.readFile(file.path, 'latin1'); // CNAB é ASCII/latin1, não UTF-8
    const ocorrencias = adapter.parseRetorno(conteudo);
    if (ocorrencias.length === 0) {
      throw new BadRequestException('Nenhuma ocorrência encontrada no arquivo — confirme que é o arquivo de retorno certo.');
    }

    const valorTotal = ocorrencias.reduce((soma, o) => soma + (o.valorPago ?? 0), 0);
    const retorno = await (this.prisma as any).retornoCnab.create({
      data: {
        contaBancariaId: conta.id,
        banco: adapter.banco,
        nomeArquivoOriginal: file.originalname,
        quantidadeRegistros: ocorrencias.length,
        valorTotalOcorrencias: valorTotal,
        usuarioId: userId,
      },
    });

    const resumo = { processadas: 0, naoLocalizadas: 0, erros: 0 };
    for (const oc of ocorrencias) {
      await this.processarOcorrencia(retorno.id, oc, userId, resumo);
    }

    await this.audit.log({ usuarioId: userId, acao: 'CREATE', entidade: 'RetornoCnab', entidadeId: retorno.id, dadosDepois: { retornoId: retorno.id, resumo } });
    return this.findOne(retorno.id);
  }

  private async processarOcorrencia(
    retornoId: string,
    oc: OcorrenciaParseada,
    userId: string,
    resumo: { processadas: number; naoLocalizadas: number; erros: number },
  ) {
    try {
      const boleto = await (this.prisma as any).boleto.findUnique({
        where: { nossoNumero: oc.nossoNumero },
        include: { parcela: true },
      });

      if (!boleto) {
        await (this.prisma as any).ocorrenciaCnab.create({
          data: {
            retornoId, boletoId: null, nossoNumero: oc.nossoNumero,
            codigoOcorrencia: oc.codigoOcorrencia, descricaoOcorrencia: oc.descricaoOcorrencia,
            dataOcorrencia: oc.dataOcorrencia, valorPago: oc.valorPago, valorJuros: oc.valorJuros,
            valorDesconto: oc.valorDesconto,
            statusProcessamento: 'NAO_LOCALIZADO',
            mensagemErro: `Nenhum boleto com nosso número ${oc.nossoNumero}.`,
          },
        });
        resumo.naoLocalizadas++;
        return;
      }

      if (oc.liquidacao) {
        await this.parcelaService.registrarPagamento(
          boleto.parcelaId,
          {
            valorPago: oc.valorPago ?? Number(boleto.parcela.valor),
            formaPagamento: 'BOLETO_CNAB',
            dataPagamento: oc.dataOcorrencia.toISOString(),
          },
          userId,
        );
        await (this.prisma as any).boleto.update({
          where: { id: boleto.id },
          data: {
            status: 'LIQUIDADO',
            dataLiquidacao: oc.dataOcorrencia,
            valorPago: oc.valorPago,
            valorJuros: oc.valorJuros,
            valorDesconto: oc.valorDesconto,
            ultimaOcorrenciaCodigo: oc.codigoOcorrencia,
            ultimaOcorrenciaDescricao: oc.descricaoOcorrencia,
          },
        });
      } else {
        const novoStatus = STATUS_POR_CODIGO[oc.codigoOcorrencia];
        await (this.prisma as any).boleto.update({
          where: { id: boleto.id },
          data: {
            ...(novoStatus ? { status: novoStatus } : {}),
            ...(novoStatus === 'REJEITADO' ? { motivoRejeicao: oc.descricaoOcorrencia } : {}),
            ultimaOcorrenciaCodigo: oc.codigoOcorrencia,
            ultimaOcorrenciaDescricao: oc.descricaoOcorrencia,
          },
        });
      }

      await (this.prisma as any).ocorrenciaCnab.create({
        data: {
          retornoId, boletoId: boleto.id, nossoNumero: oc.nossoNumero,
          codigoOcorrencia: oc.codigoOcorrencia, descricaoOcorrencia: oc.descricaoOcorrencia,
          dataOcorrencia: oc.dataOcorrencia, valorPago: oc.valorPago, valorJuros: oc.valorJuros,
          valorDesconto: oc.valorDesconto,
          statusProcessamento: 'PROCESSADA',
        },
      });
      resumo.processadas++;
    } catch (e: any) {
      // Uma linha malformada/erro pontual não pode travar o import inteiro —
      // fica registrada como ERRO, o resto do arquivo continua processando.
      await (this.prisma as any).ocorrenciaCnab.create({
        data: {
          retornoId, boletoId: null, nossoNumero: oc.nossoNumero,
          codigoOcorrencia: oc.codigoOcorrencia, descricaoOcorrencia: oc.descricaoOcorrencia,
          dataOcorrencia: oc.dataOcorrencia,
          statusProcessamento: 'ERRO', mensagemErro: e?.message ?? 'Erro desconhecido ao processar ocorrência.',
        },
      });
      resumo.erros++;
    }
  }

  async findAll() {
    return (this.prisma as any).retornoCnab.findMany({
      include: { contaBancaria: { select: { id: true, banco: true, agencia: true, numeroConta: true } } },
      orderBy: { dataImportacao: 'desc' },
    });
  }

  async findOne(id: string) {
    const retorno = await (this.prisma as any).retornoCnab.findUnique({
      where: { id },
      include: {
        contaBancaria: true,
        ocorrencias: {
          orderBy: { dataOcorrencia: 'desc' },
          include: { boleto: { include: { parcela: { include: { contrato: { include: { aluno: true } } } } } } },
        },
      },
    });
    if (!retorno) throw new NotFoundException('Retorno não encontrado.');
    return retorno;
  }
}
