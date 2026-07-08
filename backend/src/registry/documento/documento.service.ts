import { Injectable, NotFoundException } from '@nestjs/common';
import { randomInt } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';

/** Gera um código de validação de carteirinha no formato NNNNNNNNNNNNN-NN
 * (13 dígitos aleatórios + 2 dígitos de checksum, soma dos 13 primeiros mod 100) —
 * só decorativo, a validação real é a existência do código no banco (@unique). */
function gerarCodigoValidacao(): string {
  let principal = '';
  for (let i = 0; i < 13; i++) principal += randomInt(0, 10).toString();
  let soma = 0;
  for (const c of principal) soma += Number(c);
  const checksum = (soma % 100).toString().padStart(2, '0');
  return `${principal}-${checksum}`;
}

@Injectable()
export class DocumentoService {
  constructor(private prisma: PrismaService) {}

  /** Garante que o aluno tenha um código de validação de carteirinha + data de
   * validade persistidos (gera na primeira emissão/impressão e reaproveita depois,
   * pra QR code e "Validade" impressos nunca mudarem entre reimpressões). */
  private async garantirCodigoValidacaoCarteirinha(alunoId: string): Promise<{ codigo: string; validaAte: Date }> {
    const atual = await this.prisma.aluno.findUnique({
      where: { id: alunoId },
      select: { codigoValidacaoCarteirinha: true, carteirinhaValidaAte: true },
    });
    if (atual?.codigoValidacaoCarteirinha && atual.carteirinhaValidaAte) {
      return { codigo: atual.codigoValidacaoCarteirinha, validaAte: atual.carteirinhaValidaAte };
    }

    const validaAte = new Date(new Date().getFullYear() + 1, 2, 31);
    for (let tentativa = 0; tentativa < 5; tentativa++) {
      const codigo = gerarCodigoValidacao();
      try {
        await this.prisma.aluno.update({
          where: { id: alunoId },
          data: { codigoValidacaoCarteirinha: codigo, carteirinhaValidaAte: validaAte },
        });
        return { codigo, validaAte };
      } catch (err: any) {
        if (err?.code === 'P2002') continue; // colisão rara de código único, tenta gerar outro
        throw err;
      }
    }
    throw new Error('Não foi possível gerar um código de validação único para a carteirinha.');
  }

  async getDeclaracaoMatricula(alunoId: string) {
    const aluno = await this.prisma.aluno.findUnique({
      where: { id: alunoId },
      include: {
        curso: true,
        matrizCurricular: true,
        matriculas: {
          where: { status: 'MATRICULADO' },
          include: {
            oferta: {
              include: {
                disciplina: true,
                periodoLetivo: true,
              },
            },
          },
        },
      },
    });
    if (!aluno) throw new NotFoundException('Aluno não encontrado');

    // Período letivo atual (mais recente com matrícula ativa)
    const periodos = aluno.matriculas
      .map((m: any) => m.oferta.periodoLetivo)
      .filter(Boolean);
    const periodoAtual = periodos.sort((a: any, b: any) =>
      b.ano - a.ano || b.semestre.localeCompare(a.semestre)
    )[0] ?? null;

    return {
      aluno: {
        id: aluno.id,
        nome: aluno.nome,
        ra: aluno.ra,
        cpf: aluno.cpf,
        email: aluno.email,
        situacaoVinculo: aluno.situacaoVinculo,
        dataIngresso: aluno.dataIngresso,
      },
      curso: {
        nome: aluno.curso.nome,
        grau: aluno.curso.grau,
        modalidade: aluno.curso.modalidade,
        cargaHorariaTotal: aluno.curso.cargaHorariaTotal,
      },
      periodoAtual,
      disciplinasMatriculadas: aluno.matriculas.map((m: any) => ({
        disciplina: m.oferta.disciplina.nome,
        cargaHoraria: m.oferta.disciplina.cargaHoraria,
        turno: m.oferta.turno,
      })),
      geradoEm: new Date().toISOString(),
    };
  }

  /**
   * Boletim (relatório de notas/frequência) do aluno em um período letivo.
   * Se `periodoLetivoId` não for informado, usa o período mais recente em que
   * o aluno tem alguma matrícula.
   */
  async getBoletim(alunoId: string, periodoLetivoId?: string) {
    const aluno = await this.prisma.aluno.findUnique({
      where: { id: alunoId },
      include: { curso: true },
    });
    if (!aluno) throw new NotFoundException('Aluno não encontrado');

    const todasMatriculas = await this.prisma.matriculaDisciplina.findMany({
      where: { alunoId },
      include: {
        oferta: {
          include: {
            disciplina: true,
            periodoLetivo: true,
            professor: { select: { nome: true } },
          },
        },
        resultado: true,
      },
      orderBy: { dataMatricula: 'desc' },
    });

    // Períodos distintos em que o aluno já teve matrícula, mais recente primeiro —
    // alimenta o seletor de período na tela.
    const periodosMap = new Map<
      string,
      { id: string; ano: number; semestre: string }
    >();
    for (const m of todasMatriculas) {
      const p = m.oferta.periodoLetivo;
      if (!periodosMap.has(p.id)) {
        periodosMap.set(p.id, { id: p.id, ano: p.ano, semestre: p.semestre });
      }
    }
    const periodosDisponiveis = [...periodosMap.values()].sort(
      (a, b) => b.ano - a.ano || b.semestre.localeCompare(a.semestre),
    );

    const periodoAlvoId = periodoLetivoId ?? periodosDisponiveis[0]?.id ?? null;
    const periodo = periodosDisponiveis.find(p => p.id === periodoAlvoId) ?? null;

    const matriculasDoPeriodo = todasMatriculas.filter(
      m => m.oferta.periodoLetivoId === periodoAlvoId,
    );

    return {
      aluno: { id: aluno.id, nome: aluno.nome, ra: aluno.ra, cpf: aluno.cpf },
      curso: { nome: aluno.curso.nome, grau: aluno.curso.grau },
      periodo,
      periodosDisponiveis,
      disciplinas: matriculasDoPeriodo.map((m: any) => ({
        disciplina: m.oferta.disciplina.nome,
        codigo: m.oferta.disciplina.codigo,
        cargaHoraria: m.oferta.disciplina.cargaHoraria,
        creditos: m.oferta.disciplina.creditos,
        professor: m.oferta.professor?.nome ?? '-',
        isDependencia: m.isDependencia,
        statusMatricula: m.status,
        mediaFinal: m.resultado?.mediaFinal ?? null,
        faltas: m.resultado?.faltas ?? null,
        frequenciaPercentual: m.resultado?.frequenciaPercentual ?? null,
        situacaoResultado: m.resultado?.situacao ?? null,
      })),
      geradoEm: new Date().toISOString(),
    };
  }

  /** "Emissão de Carteirinha" — dados básicos + foto (se houver, via Usuario.fotoUrl)
   * + código de validação/QR (gerado uma única vez e reaproveitado nas próximas emissões). */
  async getCarteirinha(alunoId: string) {
    const aluno = await this.prisma.aluno.findUnique({
      where: { id: alunoId },
      include: {
        curso: { select: { nome: true, grau: true } },
        usuario: { select: { fotoUrl: true } },
      },
    });
    if (!aluno) throw new NotFoundException('Aluno não encontrado');

    const { codigo, validaAte } = await this.garantirCodigoValidacaoCarteirinha(alunoId);

    return {
      aluno: {
        id: aluno.id,
        nome: aluno.nome,
        ra: aluno.ra,
        cpf: aluno.cpf,
        dataNascimento: aluno.dataNascimento,
        situacaoVinculo: aluno.situacaoVinculo,
        fotoUrl: aluno.usuario?.fotoUrl ?? null,
      },
      curso: { nome: aluno.curso.nome, grau: aluno.curso.grau },
      validaAte: validaAte.toISOString(),
      codigoValidacao: codigo,
      geradoEm: new Date().toISOString(),
    };
  }

  /** Validação pública da carteirinha (sem autenticação) a partir do código
   * impresso/QR. Não expõe CPF nem outros dados sensíveis — só o necessário
   * pra conferir a autenticidade visualmente (RA, nome, curso, foto, validade). */
  async validarCarteirinha(codigo: string) {
    const aluno = await this.prisma.aluno.findUnique({
      where: { codigoValidacaoCarteirinha: codigo },
      include: {
        curso: { select: { nome: true, grau: true } },
        usuario: { select: { fotoUrl: true } },
      },
    });

    if (!aluno || !aluno.carteirinhaValidaAte) {
      return { valido: false };
    }

    const dentroDoPrazo = new Date() <= aluno.carteirinhaValidaAte;
    const vinculoAtivo = aluno.situacaoVinculo === 'CURSANDO';

    return {
      valido: dentroDoPrazo && vinculoAtivo,
      ra: aluno.ra,
      nome: aluno.nome,
      curso: aluno.curso.nome,
      fotoUrl: aluno.usuario?.fotoUrl ?? null,
      validade: aluno.carteirinhaValidaAte.toISOString(),
    };
  }

  /**
   * Histórico Escolar Oficial — documento imprimível no layout dos modelos de referência
   * trazidos pela secretaria (histórico real da Kirsch + modelo fictício de Direito, Jul/2026):
   * cabeçalho institucional, dados do aluno, tabela por período (disciplina/professor/titulação/
   * créditos/CH/média/resultado) com totais por período, e Média Global (CR) + Integralização
   * no rodapé. CR e Integralização são recalculados aqui (mesma regra de
   * `AlunoService.calcularCR`/`calcularIntegralizacao`) — dado sempre gerado na hora, nunca
   * armazenado, pra nunca destoar de uma nota corrigida depois.
   */
  async getHistoricoOficial(alunoId: string) {
    const aluno = await this.prisma.aluno.findUnique({
      where: { id: alunoId },
      include: {
        curso: true,
        matrizCurricular: true,
      },
    });
    if (!aluno) throw new NotFoundException('Aluno não encontrado');

    const matriculas = await this.prisma.matriculaDisciplina.findMany({
      where: { alunoId },
      include: {
        oferta: {
          include: {
            disciplina: true,
            periodoLetivo: true,
            professor: { select: { nome: true, titulacao: true } },
          },
        },
        resultado: true,
      },
      orderBy: { dataMatricula: 'asc' },
    });

    // Agrupa por período letivo (ano/semestre), ordenado cronologicamente
    const periodosMap = new Map<string, {
      periodoLetivoId: string; ano: number; semestre: string;
      disciplinas: any[]; totalCreditos: number; totalCh: number;
    }>();
    for (const m of matriculas) {
      const p = m.oferta.periodoLetivo;
      const key = `${p.ano}-${p.semestre}`;
      if (!periodosMap.has(key)) {
        periodosMap.set(key, {
          periodoLetivoId: p.id, ano: p.ano, semestre: p.semestre,
          disciplinas: [], totalCreditos: 0, totalCh: 0,
        });
      }
      const grupo = periodosMap.get(key)!;
      grupo.disciplinas.push({
        nome: m.oferta.disciplina.nome,
        codigo: m.oferta.disciplina.codigo,
        professor: m.oferta.professor?.nome ?? '—',
        titulacao: m.oferta.professor?.titulacao ?? null,
        creditos: m.oferta.disciplina.creditos,
        cargaHoraria: m.oferta.disciplina.cargaHoraria,
        mediaFinal: m.resultado?.mediaFinal ?? null,
        situacao: m.resultado?.situacao ?? null,
        isDependencia: m.isDependencia,
        statusMatricula: m.status,
      });
      grupo.totalCreditos += m.oferta.disciplina.creditos;
      grupo.totalCh += m.oferta.disciplina.cargaHoraria;
    }
    const periodos = Array.from(periodosMap.values()).sort((a, b) => a.ano - b.ano || a.semestre.localeCompare(b.semestre));

    const cr = this.calcularCR(matriculas);
    const integralizacao = this.calcularIntegralizacao(matriculas, aluno.curso.cargaHorariaTotal);

    return {
      aluno: {
        id: aluno.id,
        ra: aluno.ra,
        nome: aluno.nome,
        cpf: aluno.cpf,
        dataNascimento: aluno.dataNascimento,
        sexo: aluno.sexo,
        nacionalidade: aluno.nacionalidade,
        formaIngresso: aluno.formaIngresso,
        dataIngresso: aluno.dataIngresso,
        situacaoVinculo: aluno.situacaoVinculo,
      },
      curso: {
        nome: aluno.curso.nome,
        grau: aluno.curso.grau,
        modalidade: aluno.curso.modalidade,
        codigoEmec: aluno.curso.codigoEmec,
        cargaHorariaTotal: aluno.curso.cargaHorariaTotal,
      },
      matriz: aluno.matrizCurricular
        ? 