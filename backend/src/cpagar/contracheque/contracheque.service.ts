import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

const MES_LABEL = ['', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

// Autocontido — mesmo padrão de backend/src/registry/documento/documento.service.ts
// (um método por documento, faz suas próprias queries, retorna JSON pronto
// pro PDF). Mantido fora de DocumentoService de propósito: dado de folha é
// mais sensível (RH/salário) e restrito a ADMIN/FINANCEIRO, perfil de
// acesso diferente do resto dos documentos (secretaria/aluno).
@Injectable()
export class ContrachequeService {
  constructor(private readonly prisma: PrismaService) {}

  async getContracheque(itemFolhaId: string) {
    const item = await this.prisma.itemFolha.findUnique({
      where: { id: itemFolhaId },
      include: {
        folha: true,
        professor: { include: { professor: true } },
        colaborador: true,
        lancamentos: { orderBy: { criadoEm: 'asc' } },
      },
    });
    if (!item) throw new NotFoundException('Item de folha não encontrado.');

    const nome = item.professor?.professor.nome ?? item.colaborador?.nome ?? '—';
    const cpf = item.professor?.professor.cpf ?? item.colaborador?.cpf ?? '—';
    const cargo = item.professor ? 'Professor' : (item.colaborador?.cargo ?? 'Colaborador');
    const dataAdmissao = item.professor?.dataAdmissao ?? item.colaborador?.dataAdmissao ?? null;

    const proventos = [
      { descricao: 'Salário base', valor: Number(item.salarioBase) },
      ...item.lancamentos.filter(l => l.tipo === 'PROVENTO').map(l => ({ descricao: l.descricao, valor: Number(l.valor) })),
    ];
    const descontos = [
      { descricao: 'INSS', valor: Number(item.inss) },
      { descricao: 'IRRF', valor: Number(item.irrf) },
      ...item.lancamentos.filter(l => l.tipo === 'DESCONTO').map(l => ({ descricao: l.descricao, valor: Number(l.valor) })),
    ];
    const totalProventos = proventos.reduce((s, p) => s + p.valor, 0);
    const totalDescontos = descontos.reduce((s, d) => s + d.valor, 0);

    return {
      colaborador: { nome, cpf, cargo, dataAdmissao },
      competencia: { mes: item.folha.competenciaMes, mesLabel: MES_LABEL[item.folha.competenciaMes], ano: item.folha.competenciaAno },
      proventos,
      descontos,
      totalProventos,
      totalDescontos,
      fgts: Number(item.fgts),
      salarioLiquido: Number(item.salarioLiquido),
      status: item.status,
      geradoEm: new Date().toISOString(),
    };
  }
}
