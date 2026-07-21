import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuditService } from '../../../audit/audit.service';
import { CreateBoletoDto } from './dto/create-boleto.dto';
import { resolveBancoCnab, BANCOS_IMPLEMENTADOS } from '../bancos/bancos.util';
import { montarCampoLivreItau } from '../bancos/itau-campo-livre.util';
import { montarCodigoBarras, montarLinhaDigitavel } from '../bancos/linha-digitavel.util';

@Injectable()
export class BoletoService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  // Nosso número sequencial global (8 dígitos) — mesmo padrão de retry-on-
  // conflict já usado em AlunoService.gerarRa() pro RA do aluno.
  private async gerarNossoNumero(): Promise<string> {
    const ultimo = await (this.prisma as any).boleto.findFirst({
      orderBy: { nossoNumero: 'desc' },
      select: { nossoNumero: true },
    });
    const proximo = ultimo ? parseInt(ultimo.nossoNumero, 10) + 1 : 1;
    return String(proximo).padStart(8, '0');
  }

  async create(dto: CreateBoletoDto, userId: string) {
    const parcela = await (this.prisma as any).parcela.findUnique({
      where: { id: dto.parcelaId },
      include: { boleto: true },
    });
    if (!parcela) throw new NotFoundException('Parcela não encontrada.');
    if (parcela.boleto) throw new BadRequestException('Esta parcela já tem um boleto emitido.');
    if (parcela.status !== 'PENDENTE' && parcela.status !== 'VENCIDO') {
      throw new BadRequestException('Só é possível emitir boleto pra parcela pendente ou vencida.');
    }

    const conta = await (this.prisma as any).contaBancaria.findUnique({ where: { id: dto.contaBancariaId } });
    if (!conta) throw new NotFoundException('Conta bancária não encontrada.');
    if (!conta.cnabHabilitado || !conta.codigoBancoFebraban || !conta.carteira) {
      throw new BadRequestException('Conta bancária não está habilitada pra CNAB (falta banco FEBRABAN ou carteira).');
    }

    const banco = resolveBancoCnab(conta.codigoBancoFebraban);
    if (!BANCOS_IMPLEMENTADOS.includes(banco)) {
      throw new BadRequestException(`Emissão de boleto ainda não implementada pro banco ${banco}.`);
    }

    // Até 5 tentativas: corrida rara entre duas emissões simultâneas gerando
    // o mesmo próximo nosso número (constraint única barra o segundo insert).
    const maxTentativas = 5;
    let ultimoErro: unknown;
    for (let tentativa = 0; tentativa < maxTentativas; tentativa++) {
      const nossoNumero = await this.gerarNossoNumero();
      try {
        const campoLivre = montarCampoLivreItau({
          agencia: conta.agencia,
          contaCorrente: conta.numeroConta,
          carteira: conta.carteira,
          nossoNumero,
        });
        const codigoBarras = montarCodigoBarras({
          codigoBancoFebraban: conta.codigoBancoFebraban,
          valor: Number(parcela.valor),
          dataVencimento: new Date(parcela.dataVencimento),
          campoLivre,
        });
        const linhaDigitavel = montarLinhaDigitavel(codigoBarras);

        const boleto = await (this.prisma as any).boleto.create({
          data: {
            parcelaId: parcela.id,
            contaBancariaId: conta.id,
            banco,
            nossoNumero,
            carteira: conta.carteira,
            linhaDigitavel,
            codigoBarras,
          },
          include: {
            parcela: { include: { contrato: { include: { aluno: true } } } },
            contaBancaria: true,
          },
        });

        await this.audit.log({ usuarioId: userId, acao: 'CREATE', entidade: 'Boleto', entidadeId: boleto.id, dadosDepois: boleto });
        return boleto;
      } catch (e: any) {
        ultimoErro = e;
        const isNossoNumeroConflict = e?.code === 'P2002' && e?.meta?.target?.includes?.('nossoNumero');
        if (!isNossoNumeroConflict) throw e;
        // colisão rara de nosso número em corrida — tenta de novo com o próximo
      }
    }
    throw ultimoErro;
  }

  async findAll(status?: string, contaBancariaId?: string) {
    return (this.prisma as any).boleto.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(contaBancariaId ? { contaBancariaId } : {}),
      },
      include: {
        parcela: {
          include: {
            contrato: { include: { aluno: { select: { id: true, nome: true, ra: true } } } },
          },
        },
        contaBancaria: { select: { id: true, banco: true, agencia: true, numeroConta: true } },
      },
      orderBy: { criadoEm: 'desc' },
    });
  }

  async findOne(id: string) {
    const boleto = await (this.prisma as any).boleto.findUnique({
      where: { id },
      include: {
        parcela: { include: { contrato: { include: { aluno: true, periodoLetivo: true } } } },
        contaBancaria: true,
        ocorrencias: { orderBy: { dataOcorrencia: 'desc' } },
      },
    });
    if (!boleto) throw new NotFoundException('Boleto não encontrado.');
    return boleto;
  }
}
