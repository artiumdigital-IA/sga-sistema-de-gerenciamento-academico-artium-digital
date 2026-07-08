import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CensoService {
  constructor(private prisma: PrismaService) {}

  async getResumo() {
    const [totalAlunos, totalProfessores, totalCursos] = await Promise.all([
      this.prisma.aluno.count(),
      this.prisma.professor.count(),
      this.prisma.curso.count(),
    ]);

    const alunosPorSituacao = await this.prisma.aluno.groupBy({
      by: ['situacaoVinculo'],
      _count: true,
    });

    const alunosPorIngresso = await this.prisma.aluno.groupBy({
      by: ['formaIngresso'],
      _count: true,
    });

    const alunosPorSexo = await this.prisma.aluno.groupBy({
      by: ['sexo'],
      _count: true,
    });

    const alunosPorCorRaca = await this.prisma.aluno.groupBy({
      by: ['corRaca'],
      _count: true,
    });

    const docentesPorTitulacao = await this.prisma.professor.groupBy({
      by: ['titulacao'],
      _count: true,
    });

    const docentesPorRegime = await this.prisma.professor.groupBy({
      by: ['regimeTrabalho'],
      _count: true,
    });

    const docentesPorCorRaca = await this.prisma.professor.groupBy({
      by: ['corRaca'],
      _count: true,
    });

    return {
      totais: { alunos: totalAlunos, professores: totalProfessores, cursos: totalCursos },
      alunosPorSituacao: alunosPorSituacao.map(r => ({ situacao: r.situacaoVinculo, total: r._count })),
      alunosPorIngresso: alunosPorIngresso.map(r => ({ forma: r.formaIngresso, total: r._count })),
      alunosPorSexo: alunosPorSexo.map(r => ({ sexo: r.sexo, total: r._count })),
      alunosPorCorRaca: alunosPorCorRaca.map(r => ({ corRaca: r.corRaca, total: r._count })),
      docentesPorTitulacao: docentesPorTitulacao.map(r => ({ titulacao: r.titulacao, total: r._count })),
      docentesPorRegime: docentesPorRegime.map(r => ({ regime: r.regimeTrabalho, total: r._count })),
      docentesPorCorRaca: docentesPorCorRaca.map(r => ({ corRaca: r.corRaca, total: r._count })),
    };
  }

  async getAlunosCenso() {
    const alunos = await this.prisma.aluno.findMany({
      include: { curso: true },
      orderBy: { nome: 'asc' },
    });
    return alunos.map(a => ({
      RA: a.ra,
      Nome: a.nome,
      CPF: a.cpf,
      'Data Nascimento': a.dataNascimento?.toISOString().slice(0, 10) ?? '',
      Sexo: a.sexo,
      'Cor/Raça': a.corRaca,
      Nacionalidade: a.nacionalidade,
      Curso: a.curso.nome,
      'Código e-MEC': a.curso.codigoEmec,
      Grau: a.curso.grau,
      Modalidade: a.curso.modalidade,
      'Forma de Ingresso': a.formaIngresso,
      'Data de Ingresso': a.dataIngresso?.toISOString().slice(0, 10) ?? '',
      'Situação de Vínculo': a.situacaoVinculo,
      Email: a.email,
    }));
  }

  async getDocentesCenso() {
    const profs = await this.prisma.professor.findMany({ orderBy: { nome: 'asc' } });
    return profs.map(p => ({
      Nome: p.nome,
      CPF: p.cpf,
      Titulação: p.titulacao,
      'Regime de Trabalho': p.regimeTrabalho,
      'Cor/Raça': p.corRaca,
      Lattes: p.lattes ?? '',
      Email: p.email,
    }));
  }

  async getCursosCenso() {
    const cursos = await this.prisma.curso.findMany({
      include: { _count: { select: { alunos: true } } },
      orderBy: { nome: 'asc' },
    });
    return cursos.map(c => ({
      Nome: c.nome,
      Grau: c.grau,
      Modalidade: c.modalida