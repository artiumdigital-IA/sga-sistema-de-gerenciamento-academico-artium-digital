import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AlunoService } from '../academic/aluno/aluno.service';
import { ProtocoloService } from '../registry/protocolo/protocolo.service';
import { DocumentoAlunoService } from '../registry/documento-aluno/documento-aluno.service';
import { DocumentoService } from '../registry/documento/documento.service';
import { ContratoService } from '../financial/contrato/contrato.service';
import { AbrirProtocoloDto } from './dto/abrir-protocolo.dto';

/**
 * Lista de partida dos tipos de documento que a secretaria costuma exigir na
 * matrícula/ao longo do curso. É só um checklist informativo pro aluno saber
 * o que falta enviar (compara com o `tipo` livre já cadastrado em
 * DocumentoAluno via digitalização pela secretaria) — não bloqueia nada.
 * A secretaria pode ajustar esta lista conforme a real necessidade; não há
 * tela de administração pra isso ainda (fica pra quando o módulo crescer).
 */
const TIPOS_DOCUMENTO_OBRIGATORIOS = [
  'RG',
  'CPF',
  'Histórico Escolar do Ensino Médio',
  'Certificado de Conclusão do Ensino Médio',
  'Comprovante de Residência',
  'Foto 3x4',
];

function normalizar(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

@Injectable()
export class DiscenteService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly alunoService: AlunoService,
    private readonly protocoloService: ProtocoloService,
    private readonly documentoAlunoService: DocumentoAlunoService,
    private readonly documentoService: DocumentoService,
    private readonly contratoService: ContratoService,
  ) {}

  /** Resolve o Aluno ligado ao usuário autenticado (perfil ALUNO). Lança 403
   * se por algum motivo a conta ALUNO não tiver um Aluno vinculado (não
   * deveria acontecer em uso normal — ver Usuario.alunoId no schema). */
  async meuAlunoId(usuarioId: string): Promise<string> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { alunoId: true },
    });
    if (!usuario?.alunoId) {
      throw new ForbiddenException('Esta conta não está vinculada a um registro de aluno.');
    }
    return usuario.alunoId;
  }

  /**
   * Resumo pro topo do "Menu Discente" / painel do aluno: dados básicos +
   * progresso no curso (critério confirmado: % de períodos letivos cursados
   * sobre o prazo de integralização do curso, em semestres) + CR/integralização
   * (reaproveita o mesmo cálculo já usado no histórico) + contadores rápidos.
   */
  async painel(usuarioId: string) {
    const alunoId = await this.meuAlunoId(usuarioId);
    const aluno = await this.prisma.aluno.findUnique({
      where: { id: alunoId },
      include: { curso: { select: { nome: true, prazoIntegralizacaoSemestres: true } }, usuario: { select: { fotoUrl: true } } },
    });
    if (!aluno) throw new NotFoundException('Aluno não encontrado.');

    const matriculas = await this.prisma.matriculaDisciplina.findMany({
      where: { alunoId },
      select: { oferta: { select: { periodoLetivoId: true } } },
    });
    const periodosCursados = new Set(matriculas.map(m => m.oferta.periodoLetivoId)).size;
    const totalPeriodos = aluno.curso.prazoIntegralizacaoSemestres;
    const percentualProgresso = totalPeriodos > 0
      ? Math.min(Math.round((periodosCursados / totalPeriodos) * 1000) / 10, 100)
      : 0;

    const { cr, integralizacao } = await this.alunoService.historico(alunoId);

    const [documentos, protocolosAbertos] = await Promise.all([
      this.prisma.documentoAluno.findMany({ where: { alunoId }, select: { tipo: true } }),
      this.prisma.protocolo.count({ where: { alunoId, status: { in: ['ABERTO', 'EM_ANDAMENTO'] } } }),
    ]);
    const tiposEnviados = documentos.map(d => normalizar(d.tipo));
    const documentosPendentes = TIPOS_DOCUMENTO_OBRIGATORIOS.filter(
      exigido => !tiposEnviados.some(t => t.includes(normalizar(exigido)) || normalizar(exigido).includes(t)),
    ).length;

    return {
      aluno: {
        id: aluno.id, ra: aluno.ra, nome: aluno.nome,
        curso: aluno.curso.nome, situacaoVinculo: aluno.situacaoVinculo,
        fotoUrl: aluno.usuario?.fotoUrl ?? null,
      },
      progresso: { periodosCursados, totalPeriodos, percentual: percentualProgresso },
      cr,
      integralizacao,
      documentosPendentes,
      protocolosAbertos,
    };
  }

  /** Quadro de Horários — matrículas do aluno no período em andamento (ou,
   * na ausência de um período EM_ANDAMENTO, todas as matrículas dele). */
  async horarios(usuarioId: string) {
    const alunoId = await this.meuAlunoId(usuarioId);
    const matriculas = await this.prisma.matriculaDisciplina.findMany({
      where: { alunoId },
      include: {
        oferta: { include: { disciplina: true, professor: { select: { nome: true } }, periodoLetivo: true } },
      },
      orderBy: { dataMatricula: 'desc' },
    });
    const doPeriodoAtual = matriculas.filter(m => m.oferta.periodoLetivo.status === 'EM_ANDAMENTO');
    const lista = doPeriodoAtual.length > 0 ? doPeriodoAtual : matriculas;

    return lista.map(m => ({
      matriculaId: m.id,
      disciplina: m.oferta.disciplina.nome,
      codigo: m.oferta.disciplina.codigo,
      professor: m.oferta.professor?.nome ?? '—',
      turno: m.oferta.turno,
      horario: m.oferta.horario ?? null,
      sala: m.oferta.sala ?? null,
      periodo: { ano: m.oferta.periodoLetivo.ano, semestre: m.oferta.periodoLetivo.semestre, status: m.oferta.periodoLetivo.status },
      status: m.status,
    }));
  }

  /** Pendências de Documentos — checklist dos tipos exigidos ainda não
   * digitalizados/enviados + lista do que já foi enviado pela secretaria. */
  async documentos(usuarioId: string) {
    const alunoId = await this.meuAlunoId(usuarioId);
    const { documentos } = await this.documentoAlunoService.findByAluno(alunoId);
    const tiposEnviados = documentos.map(d => normalizar(d.tipo));
    const pendentes = TIPOS_DOCUMENTO_OBRIGATORIOS.filter(
      exigido => !tiposEnviados.some(t => t.includes(normalizar(exigido)) || normalizar(exigido).includes(t)),
    );
    return { pendentes, enviados: documentos };
  }

  /** Tipos de protocolo ativos — alimenta o formulário de abertura. */
  tiposProtocolo() {
    return this.prisma.tipoProtocolo.findMany({ where: { ativo: true }, orderBy: { nome: 'asc' } });
  }

  /** Meus protocolos — abertura/consulta, restrito ao próprio aluno. */
  async meusProtocolos(usuarioId: string) {
    const alunoId = await this.meuAlunoId(usuarioId);
    return this.protocoloService.findAll({ alunoId });
  }

  async abrirProtocolo(usuarioId: string, dto: AbrirProtocoloDto) {
    const alunoId = await this.meuAlunoId(usuarioId);
    return this.protocoloService.create({ tipoId: dto.tipoId, alunoId, assunto: dto.assunto, descricao: dto.descricao }, usuarioId);
  }

  /** Carteira de Estudante — reaproveita a mesma emissão usada pela
   * secretaria (código de validação/QR gerado uma vez e reaproveitado). */
  async carteira(usuarioId: string) {
    const alunoId = await this.meuAlunoId(usuarioId);
    return this.documentoService.getCarteirinha(alunoId);
  }

  /** Disciplinas e Avaliações — matrículas do período em andamento com
   * avaliações lançadas até agora (mesmo fallback de horarios()). */
  async disciplinas(usuarioId: string) {
    const alunoId = await this.meuAlunoId(usuarioId);
    const matriculas = await this.prisma.matriculaDisciplina.findMany({
      where: { alunoId },
      include: {
        oferta: { include: { disciplina: true, professor: { select: { nome: true } }, periodoLetivo: true } },
        avaliacoes: { orderBy: { criadoEm: 'asc' } },
        resultado: true,
      },
      orderBy: { dataMatricula: 'desc' },
    });
    const doPeriodoAtual = matriculas.filter(m => m.oferta.periodoLetivo.status === 'EM_ANDAMENTO');
    return doPeriodoAtual.length > 0 ? doPeriodoAtual : matriculas;
  }

  /** Notas e Histórico — reaproveita o mesmo cálculo de CR/integralização
   * usado pela secretaria (AlunoService.historico), restrito ao próprio aluno. */
  async historico(usuarioId: string) {
    const alunoId = await this.meuAlunoId(usuarioId);
    return this.alunoService.historico(alunoId);
  }

  /** Financeiro — contratos/parcelas do próprio aluno, somente leitura
   * (pagamento/negociação continuam sendo tratados pela secretaria/financeiro). */
  async financeiro(usuarioId: string) {
    const alunoId = await this.meuAlunoId(usuarioId);
    return this.contratoService.findAll(alunoId);
  }
}
