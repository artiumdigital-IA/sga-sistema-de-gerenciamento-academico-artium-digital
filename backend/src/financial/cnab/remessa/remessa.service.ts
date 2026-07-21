import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join } from 'path';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuditService } from '../../../audit/audit.service';
import { CreateRemessaDto } from './dto/create-remessa.dto';
import { resolveAdapter } from '../bancos/cnab-bank-adapter.factory';
import { resolveBancoCnab } from '../bancos/bancos.util';
import { BoletoParaRemessa } from '../bancos/cnab-bank-adapter.interface';

@Injectable()
export class RemessaService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async gerar(dto: CreateRemessaDto, userId: string) {
    return this.gerarInterno(dto, userId, {
      tipoOperacao: 'ENTRADA',
      statusOrigem: ['EMITIDO'],
      statusDestino: 'ENVIADO_REMESSA',
      mensagemVazio: 'Nenhum boleto EMITIDO encontrado pra essa conta (já enviados não entram de novo).',
    });
  }

  // Fase 5 — remessa de baixa/cancelamento: pega boletos já enviados/
  // registrados no banco e pede o cancelamento. Reaproveita o mesmo adapter
  // e o mesmo fluxo de gravação de gerar(), só muda o filtro de origem, o
  // tipoOperacao repassado ao adapter e o status de destino.
  async gerarBaixa(dto: CreateRemessaDto, userId: string) {
    return this.gerarInterno(dto, userId, {
      tipoOperacao: 'BAIXA',
      statusOrigem: ['ENVIADO_REMESSA', 'REGISTRADO'],
      statusDestino: 'CANCELADO',
      mensagemVazio: 'Nenhum boleto enviado/registrado encontrado pra pedir baixa nessa conta.',
    });
  }

  private async gerarInterno(
    dto: CreateRemessaDto,
    userId: string,
    opts: { tipoOperacao: 'ENTRADA' | 'BAIXA'; statusOrigem: string[]; statusDestino: string; mensagemVazio: string },
  ) {
    const conta = await (this.prisma as any).contaBancaria.findUnique({ where: { id: dto.contaBancariaId } });
    if (!conta) throw new NotFoundException('Conta bancária não encontrada.');
    if (!conta.cnabHabilitado || !conta.codigoBancoFebraban) {
      throw new BadRequestException('Conta bancária não está habilitada pra CNAB.');
    }

    const boletos = await (this.prisma as any).boleto.findMany({
      where: {
        contaBancariaId: conta.id,
        status: { in: opts.statusOrigem },
        ...(dto.boletoIds ? { id: { in: dto.boletoIds } } : {}),
      },
      include: { parcela: { include: { contrato: { include: { aluno: true } } } } },
    });
    if (boletos.length === 0) {
      throw new BadRequestException(opts.mensagemVazio);
    }

    const adapter = resolveAdapter(resolveBancoCnab(conta.codigoBancoFebraban));
    const sequencial = conta.sequencialRemessa + 1;
    const dataGeracao = new Date();

    const boletosParaRemessa: BoletoParaRemessa[] = boletos.map((b: any) => ({
      nossoNumero: b.nossoNumero,
      carteira: b.carteira,
      valor: Number(b.parcela.valor),
      dataVencimento: new Date(b.parcela.dataVencimento),
      numeroDocumento: b.nossoNumero,
      sacadoNome: b.parcela.contrato.aluno.nome,
      sacadoCpfCnpj: b.parcela.contrato.aluno.cpf ?? null,
    }));

    const conteudoArquivo = adapter.gerarRemessa({
      boletos: boletosParaRemessa,
      conta: {
        codigoBancoFebraban: conta.codigoBancoFebraban,
        agencia: conta.agencia,
        numeroConta: conta.numeroConta,
        codigoCedente: conta.codigoCedente ?? '',
        carteira: conta.carteira ?? '',
        titular: conta.titular,
        cnpjCpfTitular: conta.cnpjCpfTitular,
      },
      sequencial,
      dataGeracao,
      tipoOperacao: opts.tipoOperacao,
    });

    const valorTotal = boletosParaRemessa.reduce((soma, b) => soma + b.valor, 0);
    const timestamp = dataGeracao.toISOString().replace(/[:.]/g, '-');
    const sufixo = opts.tipoOperacao === 'BAIXA' ? 'baixa' : 'entrada';
    const arquivoNome = `remessa-${sufixo}-${conta.banco}-${sequencial}-${timestamp}.txt`;
    const caminhoArquivo = join(process.cwd(), 'uploads', 'cnab', 'remessas', arquivoNome);
    await fs.writeFile(caminhoArquivo, conteudoArquivo, 'latin1'); // CNAB é ASCII/latin1, não UTF-8

    const remessa = await (this.prisma as any).$transaction(async (tx: any) => {
      const criada = await tx.remessaCnab.create({
        data: {
          contaBancariaId: conta.id,
          banco: adapter.banco,
          layout: adapter.layout,
          sequencial,
          dataGeracao,
          quantidadeRegistros: boletos.length,
          valorTotal,
          arquivoNome,
          arquivoUrl: `/uploads/cnab/remessas/${arquivoNome}`,
          usuarioId: userId,
          itens: { create: boletos.map((b: any) => ({ boletoId: b.id })) },
        },
        include: { itens: true, contaBancaria: true },
      });

      await tx.contaBancaria.update({ where: { id: conta.id }, data: { sequencialRemessa: sequencial } });
      await tx.boleto.updateMany({ where: { id: { in: boletos.map((b: any) => b.id) } }, data: { status: opts.statusDestino } });

      return criada;
    });

    await this.audit.log({ usuarioId: userId, acao: 'CREATE', entidade: 'RemessaCnab', entidadeId: remessa.id, dadosDepois: { remessa, tipoOperacao: opts.tipoOperacao } });
    return remessa;
  }

  async findAll() {
    return (this.prisma as any).remessaCnab.findMany({
      include: { contaBancaria: { select: { id: true, banco: true, agencia: true, numeroConta: true } } },
      orderBy: { dataGeracao: 'desc' },
    });
  }

  async findOne(id: string) {
    const remessa = await (this.prisma as any).remessaCnab.findUnique({
      where: { id },
      include: {
        contaBancaria: true,
        itens: { include: { boleto: { include: { parcela: { include: { contrato: { include: { aluno: true } } } } } } } },
      },
    });
    if (!remessa) throw new NotFoundException('Remessa não encontrada.');
    return remessa;
  }

  async caminhoArquivo(id: string): Promise<{ caminho: string; nomeArquivo: string }> {
    const remessa = await this.findOne(id);
    return { caminho: join(process.cwd(), 'uploads', 'cnab', 'remessas', remessa.arquivoNome), nomeArquivo: remessa.arquivoNome };
  }
}
