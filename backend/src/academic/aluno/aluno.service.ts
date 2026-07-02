import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { CreateAlunoDto } from './dto/create-aluno.dto';
import { UpdateAlunoDto } from './dto/update-aluno.dto';

@Injectable()
export class AlunoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Gera o próximo RA sequencial do ano corrente: AAAA0001, AAAA0002, ...
   * Busca o maior RA já emitido com o prefixo do ano e incrementa.
   */
  private async gerarRa(): Promise<string> {
    const prefixo = `${new Date().getFullYear()}`;
    const ultimo = await this.prisma.aluno.findFirst({
      where: { ra: { startsWith: prefixo } },
      orderBy: { ra: 'desc' },
      select: { ra: true },
    });
    let proximoSeq = 1;
    if (ultimo) {
      const seqAtual = parseInt(ultimo.ra.slice(prefixo.length), 10);
      if (!isNaN(seqAtual)) proximoSeq = seqAtual + 1;
    }
    return `${prefixo}${String(proximoSeq).padStart(4, '0')}`;
  }

  async create(dto: CreateAlunoDto, usuarioId?: string) {
    const cpfExist = await this.prisma.aluno.findFirst({ where: { cpf: dto.cpf } });
    if (cpfExist) throw new ConflictException('CPF ja cadastrado.');

    // Até 5 tentativas: cobre a rara corrida entre dois cadastros simultâneos
    // gerando o mesmo próximo RA (constraint única em `ra` barra o segundo insert).
    const maxTentativas = dto.ra ? 1 : 5;
    let ultimoErro: unknown;

    for (let tentativa = 0; tentativa < maxTentativas; tentativa++) {
      const ra = dto.ra ?? await this.gerarRa();
      try {
        const aluno = await this.prisma.aluno.create({
          data: {
            cursoId: dto.cursoId,
            matrizCurricularId: dto.matrizCurricularId,
            ra,
            nome: dto.nome,
            cpf: dto.cpf,
            dataNascimento: new Date(dto.dataNascimento),
            sexo: dto.sexo,
            corRaca: dto.corRaca,
            nacionalidade: dto.nacionalidade ?? 'BRASILEIRA',
            formaIngresso: dto.formaIngresso,
            dataIngresso: new Date(dto.dataIngresso),
            situacaoVinculo: dto.situacaoVinculo,
            email: dto.email,
            telefone: dto.telefone,
            cep: dto.cep,
            logradouro: dto.logradouro,
            numero: dto.numero,
            complemento: dto.complemento,
            bairro: dto.bairro,
            uf: dto.uf,
            municipio: dto.municipio,
            ...(dto.usuarioId ? { usuario: { connect: { id: dto.usuarioId } } } : {}),
          },
        });
        if (usuarioId) {
          await this.audit.log({ usuarioId, acao: 'CREATE', entidade: 'aluno', entidadeId: aluno.id, dadosDepois: aluno });
        }
        return aluno;
      } catch (e: any) {
        ultimoErro = e;
        const isRaConflict = e?.code === 'P2002' && e?.meta?.target?.includes?.('ra');
        if (dto.ra || !isRaConflict) throw e;
        // RA gerado colidiu (corrida rara) — tenta de novo com o próximo número
      }
    }
    throw ultimoErro;
  }

  async findAll(cursoId?: string) {
    return this.prisma.aluno.findMany({
      where: cursoId ? { cursoId } : undefined,
      include: { curso: { select: { nome: true } } },
      orderBy: { nome: 'asc' },
    });
  }

  async findOne(id: string) {
    const aluno = await this.prisma.aluno.findUnique({
      where: { id },
      include: { curso: true, matrizCurricular: true },
    });
    if (!aluno) throw new NotFoundException('Aluno nao encontrado.');
    return aluno;
  }

  async update(id: string, dto: UpdateAlunoDto, usuarioId?: string) {
    const antes = await this.findOne(id);
    const aluno = await this.prisma.aluno.update({
      where: { id },
      data: {
        nome: dto.nome,
        email: dto.email,
        telefone: dto.telefone,
        cep: dto.cep,
        logradouro: dto.logradouro,
        numero: dto.numero,
        complemento: dto.complemento,
        bairro: dto.bairro,
        uf: dto.uf,
        municipio: dto.municipio,
        sexo: dto.sexo,
        corRaca: dto.corRaca,
        nacionalidade: dto.nacionalidade,
        formaIngresso: dto.formaIngresso,
        situacaoVinculo: dto.situacaoVinculo,
        dataNascimento: dto.dataNascimento ? new Date(dto.dataNascimento) : undefined,
        dataIngresso: dto.dataIngresso ? new Date(dto.dataIngresso) : undefined,
      },
    });
    if (usuarioId) {
      await this.audit.log({ usuarioId, acao: 'UPDATE', entidade: 'aluno', entidadeId: id, dadosAntes: antes, dadosDepois: aluno });
    }
    return aluno;
  }

  async remove(id: string, usuarioId?: string) {
    const antes = await this.findOne(id);
    await this.prisma.aluno.delete({ where: { id } });
    if (usuarioId) {
      await this.audit.log({ usuarioId, acao: 'DELETE', entidade: 'aluno', entidadeId: id, dadosAntes: antes });
    }
    return { message: 'Aluno removido.' };
  }
  /**
   * Ranking de alunos por CR (coeficiente de rendimento), opcionalmente filtrado por curso.
   * Reaproveita a mesma regra de cálculo do histórico (calcularCR): só disciplinas APROVADO
   * entram na conta, DP fica fora. Alunos sem nenhuma disciplina cursada não aparecem.
   */
  async ranking(cursoId?: string) {
    const alunos = await this.prisma.aluno.findMany({
      where: cursoId ? { cursoId } : undefined,
      include: {
        curso: { select: { nome: true } },
        matriculas: {
          include: {
            oferta: { include: { disciplina: { select: { creditos: true } } } },
            resultado: true,
          },
        },
      },
    });

    const linhas = alunos
      .map(a => {
        const cr = this.calcularCR(a.matriculas);
        const aprovadas = a.matriculas.filter(m => m.resultado?.situacao === 'APROVADO').length;
        return {
          id: a.id,
          ra: a.ra,
          nome: a.nome,
          curso: a.curso.nome,
          situacaoVinculo: a.situacaoVinculo,
          cr,
          aprovadas,
          totalDisciplinas: a.matriculas.length,
        };
      })
      .filter(l => l.totalDisciplinas > 0)
      .sort((x, y) => y.cr - x.cr);

    return linhas.map((l, i) => ({ posicao: i + 1, ...l }));
  }

  /**
   * Histórico acadêmico do aluno:
   * todas as matrículas com resultado consolidado + avaliações
   */
  async historico(alunoId: string) {
    const aluno = await this.findOne(alunoId);

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
        avaliacoes: { orderBy: { criadoEm: 'asc' } },
        resultado: true,
      },
      orderBy: { dataMatricula: 'asc' },
    });

    const cr = this.calcularCR(matriculas);

    return {
      aluno: { id: aluno.id, ra: aluno.ra, nome: aluno.nome, situacaoVinculo: aluno.situacaoVinculo },
      cr,
      totalDisciplinas: matriculas.length,
      aprovadas: matriculas.filter(m => m.resultado?.situacao === 'APROVADO').length,
      matriculas,
    };
  }

  /**
   * CR = soma(mediaFinal * creditos) / soma(creditos)
   * Regras FIURJ (confirmadas Jun/2026):
   *   - Apenas disciplinas APROVADO entram no cálculo
   *   - Disciplinas reprovadas ficam FORA
   *   - Disciplinas em DP (isDependencia) ficam FORA
   */
  private calcularCR(matriculas: Array<{
    isDependencia: boolean;
    resultado: { mediaFinal: unknown; situacao: string } | null;
    oferta: { disciplina: { creditos: number } };
  }>): number {
    let somaPonderada = 0;
    let somaCreditos = 0;

    for (const m of matriculas) {
      // DP fica fora do CR
      if (m.isDependencia) continue;
      // Sem resultado ou não aprovado → fora do CR
      if (!m.resultado || m.resultado.situacao !== 'APROVADO') continue;

      const media = Number(m.resultado.mediaFinal);
      const creditos = m.oferta.disciplina.creditos;
      somaPonderada += media * creditos;
      somaCreditos += creditos;
    }

    return somaCreditos > 0
      ? Math.round((somaPonderada / somaCreditos) * 100) / 100
      : 0;
  }

}
