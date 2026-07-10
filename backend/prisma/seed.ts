/**
 * prisma/seed.ts — Cria dados iniciais de desenvolvimento
 *
 * Executar:  npx prisma db seed
 * (ou)       npm run seed
 */
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');

  // ── Usuário Admin padrão ────────────────────────────────────
  const senhaHash = await bcrypt.hash('admin123', 12);

  const admin = await prisma.usuario.upsert({
    where: { email: 'admin@fiurj.edu.br' },
    update: {},
    create: {
      email: 'admin@fiurj.edu.br',
      senhaHash,
      perfil: 'ADMIN',
      mfaAtivo: false,
      status: 'ATIVO',
    },
  });

  console.log(`✅ Usuário admin: ${admin.email}  (senha: admin123)`);

  // ── Usuário Secretaria (sem MFA para facilitar testes) ──────
  const senhaSecHash = await bcrypt.hash('sec123', 12);

  const sec = await prisma.usuario.upsert({
    where: { email: 'secretaria@fiurj.edu.br' },
    update: {},
    create: {
      email: 'secretaria@fiurj.edu.br',
      senhaHash: senhaSecHash,
      perfil: 'SECRETARIA',
      mfaAtivo: false,
      status: 'ATIVO',
    },
  });

  console.log(`✅ Usuário secretaria: ${sec.email}  (senha: sec123)`);

  // ── Usuário Financeiro de teste ──────────────────────────────
  const senhaFinHash = await bcrypt.hash('fin123', 12);

  const fin = await prisma.usuario.upsert({
    where: { email: 'financeiro@fiurj.edu.br' },
    update: {},
    create: {
      email: 'financeiro@fiurj.edu.br',
      senhaHash: senhaFinHash,
      perfil: 'FINANCEIRO',
      mfaAtivo: false,
      status: 'ATIVO',
      nome: 'Financeiro de Teste',
    },
  });

  console.log(`✅ Usuário financeiro: ${fin.email}  (senha: fin123)`);

  // ── Períodos letivos de teste (alimenta o card "Calendário Acadêmico" do
  // Painel, que lista os PeriodoLetivo cadastrados) ───────────────────────
  const periodos: { ano: number; semestre: 'S1' | 'S2'; dataInicio: string; dataFim: string; status: 'PLANEJADO' | 'EM_ANDAMENTO' | 'ENCERRADO' }[] = [
    { ano: 2025, semestre: 'S2', dataInicio: '2025-08-04', dataFim: '2025-12-19', status: 'ENCERRADO' },
    { ano: 2026, semestre: 'S1', dataInicio: '2026-02-02', dataFim: '2026-06-27', status: 'ENCERRADO' },
    { ano: 2026, semestre: 'S2', dataInicio: '2026-07-06', dataFim: '2026-12-18', status: 'EM_ANDAMENTO' },
    { ano: 2027, semestre: 'S1', dataInicio: '2027-02-01', dataFim: '2027-06-30', status: 'PLANEJADO' },
  ];

  for (const p of periodos) {
    await prisma.periodoLetivo.upsert({
      where: { ano_semestre: { ano: p.ano, semestre: p.semestre } },
      update: {},
      create: {
        ano: p.ano,
        semestre: p.semestre,
        dataInicio: new Date(p.dataInicio),
        dataFim: new Date(p.dataFim),
        status: p.status,
      },
    });
  }

  console.log(`✅ ${periodos.length} períodos letivos de teste (calendário acadêmico)`);

  // ── Itens de teste do Calendário Acadêmico (marcos/eventos) para 2026/S2 ──
  // Modelado no formato da Deliberação nº 41/2025 (UERJ) trazida como referência:
  // marco/etapa + data única ou intervalo, com grupos de 2 níveis (ex. Exames Finais).
  const periodo2026S2 = await prisma.periodoLetivo.findUnique({
    where: { ano_semestre: { ano: 2026, semestre: 'S2' } },
  });

  if (periodo2026S2) {
    await prisma.periodoLetivo.update({
      where: { id: periodo2026S2.id },
      data: { semanasLetivas: 18, diasLetivos: 102 },
    });

    const eventosExistentes = await prisma.eventoCalendario.count({
      where: { periodoLetivoId: periodo2026S2.id },
    });

    if (eventosExistentes === 0) {
      const eventos: { grupo: string | null; titulo: string; dataInicio: string; dataFim: string | null; observacoes: string | null; ordem: number }[] = [
        { grupo: null, titulo: 'Acertos Curriculares', dataInicio: '2026-06-22', dataFim: '2026-07-03', observacoes: null, ordem: 10 },
        { grupo: null, titulo: 'Inscrição em Disciplinas', dataInicio: '2026-06-24', dataFim: '2026-07-05', observacoes: null, ordem: 20 },
        { grupo: null, titulo: 'Preparação do Ambiente Virtual de Aprendizagem (AVA)', dataInicio: '2026-07-01', dataFim: '2026-07-05', observacoes: 'Disciplinas EAD', ordem: 30 },
        { grupo: null, titulo: 'Início das Aulas', dataInicio: '2026-07-06', dataFim: null, observacoes: null, ordem: 40 },
        { grupo: null, titulo: 'Cancelamento, Reinscrição e Substituição', dataInicio: '2026-07-13', dataFim: '2026-07-24', observacoes: null, ordem: 50 },
        { grupo: null, titulo: 'Término das Aulas', dataInicio: '2026-11-27', dataFim: null, observacoes: null, ordem: 60 },
        { grupo: 'Exames Finais', titulo: 'Regime de Crédito', dataInicio: '2026-11-30', dataFim: '2026-12-04', observacoes: null, ordem: 70 },
        { grupo: 'Exames Finais', titulo: 'Regime Seriado', dataInicio: '2026-12-07', dataFim: '2026-12-11', observacoes: null, ordem: 71 },
        { grupo: 'Exames de 2ª Época', titulo: 'Requerimento', dataInicio: '2026-12-14', dataFim: '2026-12-15', observacoes: null, ordem: 80 },
        { grupo: 'Exames de 2ª Época', titulo: 'Exames', dataInicio: '2026-12-16', dataFim: '2026-12-17', observacoes: null, ordem: 81 },
        { grupo: null, titulo: 'Término do Semestre', dataInicio: '2026-12-18', dataFim: null, observacoes: null, ordem: 90 },
        { grupo: null, titulo: 'Recesso Natalino', dataInicio: '2026-12-21', dataFim: '2027-01-31', observacoes: null, ordem: 100 },
      ];

      for (const ev of eventos) {
        await prisma.eventoCalendario.create({
          data: {
            periodoLetivoId: periodo2026S2.id,
            grupo: ev.grupo,
            titulo: ev.titulo,
            dataInicio: new Date(ev.dataInicio),
            dataFim: ev.dataFim ? new Date(ev.dataFim) : undefined,
            observacoes: ev.observacoes,
            ordem: ev.ordem,
          },
        });
      }

      console.log(`✅ ${eventos.length} itens de teste do calendário acadêmico (período 2026/S2)`);
    } else {
      console.log('↷ Itens do calendário acadêmico de 2026/S2 já existem, seed não duplicou.');
    }
  }

  // =========================================================================
  // MASSA DE TESTE — estrutura acadêmica, pessoas, ofertas, financeiro,
  // ingresso, secretaria etc. Cobre praticamente todas as telas do sistema
  // pra facilitar teste manual de ponta a ponta com cada perfil.
  // Usa upsert nos modelos com campo único natural (email/cpf/ra/codigo) —
  // pode rodar de novo sem duplicar. O bloco grande do meio (ofertas,
  // matrículas, avisos, financeiro, ingresso...) é protegido por uma
  // checagem de idempotência única (ver `jaTemMassaTeste` abaixo).
  // =========================================================================

  // ── Unidades ──────────────────────────────────────────────────
  const unidadesData = [
    { nome: 'FIURJ Campos Centro', cidade: 'Campos dos Goytacazes', uf: 'RJ' },
    { nome: 'UAL Lisboa', cidade: 'Lisboa', uf: null as string | null },
  ];
  for (const u of unidadesData) {
    const existe = await prisma.unidade.findFirst({ where: { nome: u.nome } });
    if (!existe) await prisma.unidade.create({ data: u });
  }
  console.log(`✅ ${unidadesData.length} unidades de teste`);

  // ── Cursos ────────────────────────────────────────────────────
  const cursoDireito = await prisma.curso.upsert({
    where: { codigoEmec: 'DIR2024' },
    update: {},
    create: {
      nome: 'Direito', grau: 'BACHARELADO', modalidade: 'PRESENCIAL', codigoEmec: 'DIR2024',
      cargaHorariaTotal: 3700, prazoIntegralizacaoSemestres: 10, status: 'ATIVO',
    },
  });
  const cursoGestaoPublica = await prisma.curso.upsert({
    where: { codigoEmec: 'GESPUB2024' },
    update: {},
    create: {
      nome: 'Gestão Pública', grau: 'TECNOLOGO', modalidade: 'EAD', codigoEmec: 'GESPUB2024',
      cargaHorariaTotal: 1600, prazoIntegralizacaoSemestres: 6, status: 'ATIVO',
    },
  });
  const cursoAdministracao = await prisma.curso.upsert({
    where: { codigoEmec: 'ADM2024' },
    update: {},
    create: {
      nome: 'Administração', grau: 'BACHARELADO', modalidade: 'PRESENCIAL', codigoEmec: 'ADM2024',
      cargaHorariaTotal: 3000, prazoIntegralizacaoSemestres: 8, status: 'ATIVO',
    },
  });
  console.log('✅ 3 cursos de teste (Direito, Gestão Pública, Administração)');

  // ── Matrizes curriculares (1 por curso) ─────────────────────────
  const matrizDireito = await prisma.matrizCurricular.upsert({
    where: { cursoId_versao: { cursoId: cursoDireito.id, versao: '2024.1' } },
    update: {},
    create: { cursoId: cursoDireito.id, versao: '2024.1', anoVigencia: 2024, status: 'VIGENTE' },
  });
  const matrizGestaoPublica = await prisma.matrizCurricular.upsert({
    where: { cursoId_versao: { cursoId: cursoGestaoPublica.id, versao: '2024.1' } },
    update: {},
    create: { cursoId: cursoGestaoPublica.id, versao: '2024.1', anoVigencia: 2024, status: 'VIGENTE' },
  });
  const matrizAdministracao = await prisma.matrizCurricular.upsert({
    where: { cursoId_versao: { cursoId: cursoAdministracao.id, versao: '2024.1' } },
    update: {},
    create: { cursoId: cursoAdministracao.id, versao: '2024.1', anoVigencia: 2024, status: 'VIGENTE' },
  });
  console.log('✅ 3 matrizes curriculares de teste');

  // ── Disciplinas (4 por curso) ────────────────────────────────────
  const disciplinasData: { matrizId: string; codigo: string; nome: string; periodoSugerido: number }[] = [
    { matrizId: matrizDireito.id, codigo: 'DIR101', nome: 'Introdução ao Direito', periodoSugerido: 1 },
    { matrizId: matrizDireito.id, codigo: 'DIR102', nome: 'Direito Constitucional I', periodoSugerido: 1 },
    { matrizId: matrizDireito.id, codigo: 'DIR103', nome: 'Direito Civil I', periodoSugerido: 2 },
    { matrizId: matrizDireito.id, codigo: 'DIR104', nome: 'Direito Penal I', periodoSugerido: 2 },
    { matrizId: matrizGestaoPublica.id, codigo: 'GP101', nome: 'Administração Pública', periodoSugerido: 1 },
    { matrizId: matrizGestaoPublica.id, codigo: 'GP102', nome: 'Direito Administrativo', periodoSugerido: 1 },
    { matrizId: matrizGestaoPublica.id, codigo: 'GP103', nome: 'Economia do Setor Público', periodoSugerido: 2 },
    { matrizId: matrizGestaoPublica.id, codigo: 'GP104', nome: 'Políticas Públicas', periodoSugerido: 2 },
    { matrizId: matrizAdministracao.id, codigo: 'ADM101', nome: 'Teoria Geral da Administração', periodoSugerido: 1 },
    { matrizId: matrizAdministracao.id, codigo: 'ADM102', nome: 'Contabilidade Geral', periodoSugerido: 1 },
    { matrizId: matrizAdministracao.id, codigo: 'ADM103', nome: 'Matemática Financeira', periodoSugerido: 2 },
    { matrizId: matrizAdministracao.id, codigo: 'ADM104', nome: 'Marketing', periodoSugerido: 2 },
  ];
  const disciplinas: Record<string, { id: string }> = {};
  for (const d of disciplinasData) {
    const disc = await prisma.disciplina.upsert({
      where: { matrizCurricularId_codigo: { matrizCurricularId: d.matrizId, codigo: d.codigo } },
      update: {},
      create: {
        matrizCurricularId: d.matrizId, codigo: d.codigo, nome: d.nome,
        cargaHoraria: 80, creditos: 4, periodoSugerido: d.periodoSugerido,
      },
    });
    disciplinas[d.codigo] = disc;
  }
  console.log(`✅ ${disciplinasData.length} disciplinas de teste`);

  // ── Professores ───────────────────────────────────────────────
  const professoresData = [
    { nome: 'Carlos Eduardo Ramos', cpf: '11122233344', titulacao: 'DOUTOR' as const, regime: 'INTEGRAL' as const, email: 'carlos.ramos@fiurj.edu.br' },
    { nome: 'Fernanda Souza Lima', cpf: '22233344455', titulacao: 'MESTRE' as const, regime: 'PARCIAL' as const, email: 'fernanda.lima@fiurj.edu.br' },
    { nome: 'Ricardo Almeida Santos', cpf: '33344455566', titulacao: 'ESPECIALISTA' as const, regime: 'HORISTA' as const, email: 'ricardo.santos@fiurj.edu.br' },
    { nome: 'Juliana Costa Pereira', cpf: '44455566677', titulacao: 'DOUTOR' as const, regime: 'INTEGRAL' as const, email: 'juliana.pereira@fiurj.edu.br' },
  ];
  const professores: Record<string, { id: string }> = {};
  for (const p of professoresData) {
    const prof = await prisma.professor.upsert({
      where: { email: p.email },
      update: {},
      create: {
        nome: p.nome, cpf: p.cpf, titulacao: p.titulacao, regimeTrabalho: p.regime,
        corRaca: 'NAO_DECLARADO', email: p.email,
      },
    });
    professores[p.email] = prof;
  }
  console.log(`✅ ${professoresData.length} professores de teste`);

  // Usuário de login pro perfil PROFESSOR (Carlos Eduardo Ramos)
  const senhaProfHash = await bcrypt.hash('prof123', 12);
  const professorLogin = professores['carlos.ramos@fiurj.edu.br'];
  await prisma.usuario.upsert({
    where: { email: 'professor@fiurj.edu.br' },
    update: {},
    create: {
      email: 'professor@fiurj.edu.br', senhaHash: senhaProfHash, perfil: 'PROFESSOR',
      mfaAtivo: false, status: 'ATIVO', nome: 'Carlos Eduardo Ramos',
      professorId: professorLogin.id,
    },
  });
  console.log('✅ Usuário professor: professor@fiurj.edu.br  (senha: prof123)');

  // ── Alunos ────────────────────────────────────────────────────
  const alunosData: {
    ra: string; nome: string; cpf: string; email: string; cursoId: string; matrizId: string;
    sexo: 'MASCULINO' | 'FEMININO'; corRaca: 'BRANCA' | 'PRETA' | 'PARDA' | 'AMARELA' | 'INDIGENA';
    formaIngresso: 'VESTIBULAR' | 'ENEM' | 'TRANSFERENCIA_EXTERNA'; situacao: 'CURSANDO' | 'TRANCADO' | 'EVADIDO';
    codigoValidacaoCarteirinha?: string;
  }[] = [
    { ra: '2024001', nome: 'Mariana Alves Ferreira', cpf: '55566677788', email: 'mariana.ferreira@aluno.fiurj.edu.br', cursoId: cursoDireito.id, matrizId: matrizDireito.id, sexo: 'FEMININO', corRaca: 'PARDA', formaIngresso: 'ENEM', situacao: 'CURSANDO', codigoValidacaoCarteirinha: 'FIURJ-2026-000001' },
    { ra: '2024002', nome: 'Pedro Henrique Souza', cpf: '66677788899', email: 'pedro.souza@aluno.fiurj.edu.br', cursoId: cursoDireito.id, matrizId: matrizDireito.id, sexo: 'MASCULINO', corRaca: 'BRANCA', formaIngresso: 'VESTIBULAR', situacao: 'CURSANDO' },
    { ra: '2024003', nome: 'Beatriz Lima Rodrigues', cpf: '77788899900', email: 'beatriz.rodrigues@aluno.fiurj.edu.br', cursoId: cursoGestaoPublica.id, matrizId: matrizGestaoPublica.id, sexo: 'FEMININO', corRaca: 'PRETA', formaIngresso: 'ENEM', situacao: 'CURSANDO' },
    { ra: '2024004', nome: 'Lucas Gabriel Martins', cpf: '88899900011', email: 'lucas.martins@aluno.fiurj.edu.br', cursoId: cursoGestaoPublica.id, matrizId: matrizGestaoPublica.id, sexo: 'MASCULINO', corRaca: 'PARDA', formaIngresso: 'TRANSFERENCIA_EXTERNA', situacao: 'CURSANDO' },
    { ra: '2024005', nome: 'Camila Santos Oliveira', cpf: '99900011122', email: 'camila.oliveira@aluno.fiurj.edu.br', cursoId: cursoAdministracao.id, matrizId: matrizAdministracao.id, sexo: 'FEMININO', corRaca: 'BRANCA', formaIngresso: 'ENEM', situacao: 'CURSANDO' },
    { ra: '2024006', nome: 'Rafael Costa Silva', cpf: '00011122233', email: 'rafael.silva@aluno.fiurj.edu.br', cursoId: cursoAdministracao.id, matrizId: matrizAdministracao.id, sexo: 'MASCULINO', corRaca: 'AMARELA', formaIngresso: 'VESTIBULAR', situacao: 'TRANCADO' },
    { ra: '2024007', nome: 'Amanda Pereira Gomes', cpf: '11223344556', email: 'amanda.gomes@aluno.fiurj.edu.br', cursoId: cursoDireito.id, matrizId: matrizDireito.id, sexo: 'FEMININO', corRaca: 'INDIGENA', formaIngresso: 'ENEM', situacao: 'EVADIDO' },
    { ra: '2024008', nome: 'Gabriel Rocha Barbosa', cpf: '22334455667', email: 'gabriel.barbosa@aluno.fiurj.edu.br', cursoId: cursoAdministracao.id, matrizId: matrizAdministracao.id, sexo: 'MASCULINO', corRaca: 'PARDA', formaIngresso: 'ENEM', situacao: 'CURSANDO' },
  ];
  const alunos: Record<string, { id: string }> = {};
  for (const a of alunosData) {
    const aluno = await prisma.aluno.upsert({
      where: { ra: a.ra },
      update: {},
      create: {
        ra: a.ra, nome: a.nome, cpf: a.cpf, email: a.email,
        cursoId: a.cursoId, matrizCurricularId: a.matrizId,
        dataNascimento: new Date('2003-05-14'), sexo: a.sexo, corRaca: a.corRaca,
        nacionalidade: 'BRASILEIRA', formaIngresso: a.formaIngresso,
        dataIngresso: new Date('2024-02-05'), situacaoVinculo: a.situacao,
        codigoValidacaoCarteirinha: a.codigoValidacaoCarteirinha,
        carteirinhaValidaAte: a.codigoValidacaoCarteirinha ? new Date('2027-12-31') : undefined,
      },
    });
    alunos[a.ra] = aluno;
  }
  console.log(`✅ ${alunosData.length} alunos de teste`);

  // Usuário de login pro perfil ALUNO (Mariana Alves Ferreira, RA 2024001)
  const senhaAlunoHash = await bcrypt.hash('aluno123', 12);
  await prisma.usuario.upsert({
    where: { email: 'aluno@fiurj.edu.br' },
    update: {},
    create: {
      email: 'aluno@fiurj.edu.br', senhaHash: senhaAlunoHash, perfil: 'ALUNO',
      mfaAtivo: false, status: 'ATIVO', alunoId: alunos['2024001'].id,
    },
  });
  console.log('✅ Usuário aluno: aluno@fiurj.edu.br  (senha: aluno123)');

  // ── Bloco grande — protegido por checagem de idempotência única ────────
  const jaTemMassaTeste = await prisma.oferta.findFirst({ where: { disciplina: { codigo: 'DIR101' } } });

  if (!jaTemMassaTeste && periodo2026S2) {
    // Ofertas (turmas) no período 2026/S2
    const ofertasData = [
      { codigo: 'DIR101', profEmail: 'carlos.ramos@fiurj.edu.br', turno: 'NOITE' as const, vagas: 40, sala: '101' },
      { codigo: 'DIR102', profEmail: 'carlos.ramos@fiurj.edu.br', turno: 'NOITE' as const, vagas: 40, sala: '102' },
      { codigo: 'GP101', profEmail: 'fernanda.lima@fiurj.edu.br', turno: 'INTEGRAL' as const, vagas: 50, sala: 'EAD' },
      { codigo: 'GP102', profEmail: 'fernanda.lima@fiurj.edu.br', turno: 'INTEGRAL' as const, vagas: 50, sala: 'EAD' },
      { codigo: 'ADM101', profEmail: 'ricardo.santos@fiurj.edu.br', turno: 'MANHA' as const, vagas: 35, sala: '201' },
      { codigo: 'ADM102', profEmail: 'juliana.pereira@fiurj.edu.br', turno: 'TARDE' as const, vagas: 35, sala: '202' },
    ];
    const ofertas: Record<string, { id: string }> = {};
    for (const o of ofertasData) {
      const oferta = await prisma.oferta.create({
        data: {
          disciplinaId: disciplinas[o.codigo].id,
          periodoLetivoId: periodo2026S2.id,
          professorId: professores[o.profEmail].id,
          vagas: o.vagas, turno: o.turno, sala: o.sala, horario: '19h-22h30',
        },
      });
      ofertas[o.codigo] = oferta;
    }
    console.log(`✅ ${ofertasData.length} ofertas (turmas) de teste`);

    // Matrículas
    const matriculasData = [
      { ra: '2024001', codigo: 'DIR101' },
      { ra: '2024001', codigo: 'DIR102' },
      { ra: '2024002', codigo: 'DIR101' },
      { ra: '2024003', codigo: 'GP101' },
      { ra: '2024004', codigo: 'GP101' },
      { ra: '2024005', codigo: 'ADM101' },
      { ra: '2024005', codigo: 'ADM102' },
      { ra: '2024008', codigo: 'ADM101' },
    ];
    const matriculas: { id: string; ra: string; codigo: string }[] = [];
    for (const m of matriculasData) {
      const matricula = await prisma.matriculaDisciplina.create({
        data: { alunoId: alunos[m.ra].id, ofertaId: ofertas[m.codigo].id, status: 'MATRICULADO' },
      });
      matriculas.push({ id: matricula.id, ra: m.ra, codigo: m.codigo });
    }
    console.log(`✅ ${matriculasData.length} matrículas de teste`);

    // Notas (pauta), frequência e avaliação avulsa pra Mariana em DIR101 —
    // dá pra ver Lançamento de Notas, Frequência, Pauta e Mapão populados.
    const matriculaMarianaDir101 = matriculas.find(m => m.ra === '2024001' && m.codigo === 'DIR101');
    if (matriculaMarianaDir101) {
      await prisma.notaPauta.create({
        data: {
          matriculaDisciplinaId: matriculaMarianaDir101.id,
          av1: 8.0, av2: 7.5, av3: 9.0, av4: 8.5, faltas: 2,
        },
      });
      await prisma.registroFrequencia.create({
        data: {
          matriculaDisciplinaId: matriculaMarianaDir101.id,
          data: new Date('2026-07-06'), quantidadeAulas: 4, faltas: 0,
        },
      });
      await prisma.registroFrequencia.create({
        data: {
          matriculaDisciplinaId: matriculaMarianaDir101.id,
          data: new Date('2026-07-13'), quantidadeAulas: 4, faltas: 2, observacao: 'Atestado médico',
        },
      });
      await prisma.avaliacao.create({
        data: { matriculaDisciplinaId: matriculaMarianaDir101.id, tipo: 'PROVA', nota: 8.0, peso: 1 },
      });
      console.log('✅ Notas/frequência/avaliação de teste (Mariana em Introdução ao Direito)');
    }

    // ── Avisos (mural do Painel inicial) ──────────────────────────
    await prisma.aviso.createMany({
      data: [
        { titulo: 'Bem-vindos ao 2º semestre de 2026', texto: 'As aulas do período 2026/2 começam em 06/07. Confiram o calendário acadêmico.', tag: 'GERAL', autorNome: 'Secretaria Acadêmica', autorId: sec.id },
        { titulo: 'Manutenção programada no sistema', texto: 'No sábado, das 22h às 23h, o sistema ficará indisponível para manutenção.', tag: 'IMPORTANTE', autorNome: 'TI FIURJ', autorId: admin.id },
        { titulo: 'Reunião de coordenação', texto: 'Reunião de coordenadores na sexta-feira às 14h, sala de reuniões.', tag: 'APENAS_EQUIPE', autorNome: 'Direção Acadêmica', autorId: admin.id },
      ],
    });
    console.log('✅ 3 avisos de teste');

    // ── Ficha de saúde (Mariana) ───────────────────────────────────
    await prisma.fichaSaude.create({
      data: {
        alunoId: alunos['2024001'].id, tipoSanguineo: 'O+', alergias: 'Nenhuma conhecida',
        contatoEmergenciaNome: 'Roberto Ferreira', contatoEmergenciaTelefone: '(22) 99999-0001',
      },
    });
    console.log('✅ 1 ficha de saúde de teste');

    // ── Contas bancárias ────────────────────────────────────────────
    await prisma.contaBancaria.createMany({
      data: [
        { banco: 'Banco do Brasil', agencia: '1234-5', numeroConta: '98765-4', tipoConta: 'CORRENTE', titular: 'FIURJ Faculdade', cnpjCpfTitular: '12.345.678/0001-90' },
        { banco: 'Caixa Econômica Federal', agencia: '0001', numeroConta: '11223-4', tipoConta: 'POUPANCA', titular: 'FIURJ Faculdade', cnpjCpfTitular: '12.345.678/0001-90' },
      ],
    });
    console.log('✅ 2 contas bancárias de teste');

    // ── Categorias de receita ────────────────────────────────────────
    await prisma.categoriaReceita.createMany({
      data: [
        { nome: 'Mensalidade', descricao: 'Mensalidade de graduação' },
        { nome: 'Taxa de Matrícula', descricao: 'Taxa cobrada no ato da matrícula' },
        { nome: 'Segunda Via de Documentos', descricao: 'Emissão de segunda via de documentos' },
      ],
    });
    console.log('✅ 3 categorias de receita de teste');

    // ── Documentos digitalizados do aluno ────────────────────────────
    await prisma.documentoAluno.createMany({
      data: [
        { alunoId: alunos['2024001'].id, tipo: 'RG', nomeArquivo: 'rg-mariana.pdf', url: '/uploads/documentos-aluno/rg-mariana-teste.pdf', tamanho: 204800 },
        { alunoId: alunos['2024001'].id, tipo: 'Histórico Escolar', nomeArquivo: 'historico-mariana.pdf', url: '/uploads/documentos-aluno/historico-mariana-teste.pdf', tamanho: 512000 },
      ],
    });
    console.log('✅ 2 documentos de aluno de teste');

    // ── Motivos de ocorrência + ocorrências ──────────────────────────
    const motivoAtraso = await prisma.motivoOcorrencia.create({ data: { nome: 'Atraso' } });
    await prisma.motivoOcorrencia.createMany({ data: [{ nome: 'Falta de material' }, { nome: 'Conduta inadequada' }] });
    await prisma.ocorrencia.create({
      data: { alunoId: alunos['2024002'].id, motivoId: motivoAtraso.id, descricao: 'Chegou atrasado à prova.', data: new Date('2026-07-08'), usuarioId: sec.id },
    });
    console.log('✅ 3 motivos de ocorrência + 1 ocorrência de teste');

    // ── Mensagens (chat 1-a-1) ────────────────────────────────────────
    await prisma.mensagem.create({
      data: { remetenteId: admin.id, destinatarioId: sec.id, assunto: 'Boas-vindas', corpo: 'Olá! Qualquer dúvida sobre o novo sistema, me chama por aqui.' },
    });
    await prisma.mensagem.create({
      data: { remetenteId: sec.id, destinatarioId: admin.id, assunto: 'Re: Boas-vindas', corpo: 'Combinado, obrigada!', lida: true },
    });
    console.log('✅ 2 mensagens de teste');

    // ── Observações financeiras ─────────────────────────────────────
    await prisma.observacaoFinanceira.create({
      data: { alunoId: alunos['2024001'].id, observacao: 'Aluna solicitou parcelamento diferenciado — aprovado pela coordenação financeira.', usuarioId: fin.id },
    });
    console.log('✅ 1 observação financeira de teste');

    // ── Ramais ────────────────────────────────────────────────────────
    await prisma.ramal.createMany({
      data: [
        { nome: 'Secretaria Geral', setor: 'Secretaria', numero: '2000' },
        { nome: 'Financeiro', setor: 'Financeiro', numero: '2001' },
        { nome: 'Coordenação de Direito', setor: 'Coordenação', numero: '2002' },
        { nome: 'Coordenação de Gestão Pública', setor: 'Coordenação', numero: '2003' },
        { nome: 'TI / Suporte', setor: 'TI', numero: '2004' },
      ],
    });
    console.log('✅ 5 ramais de teste');

    // ── Motivos de transferência/cancelamento ────────────────────────
    await prisma.motivoTransferenciaCancelamento.createMany({
      data: [{ nome: 'Mudança de turno' }, { nome: 'Conflito de horário' }, { nome: 'Solicitação do aluno' }],
    });
    console.log('✅ 3 motivos de transferência/cancelamento de teste');

    // ── Bolsista ──────────────────────────────────────────────────────
    await prisma.bolsista.create({
      data: { alunoId: alunos['2024003'].id, tipoBolsa: 'PROUNI Integral', percentual: 100, dataInicio: new Date('2024-02-05'), ativo: true },
    });
    console.log('✅ 1 bolsista de teste');

    // ── Tipos de protocolo + protocolos ──────────────────────────────
    const tipoProtocoloDoc = await prisma.tipoProtocolo.create({ data: { nome: 'Solicitação de Documento' } });
    await prisma.tipoProtocolo.createMany({ data: [{ nome: 'Reclamação' }, { nome: 'Recurso Administrativo' }] });
    await prisma.protocolo.create({
      data: {
        numero: '2026/000001', tipoId: tipoProtocoloDoc.id, alunoId: alunos['2024001'].id,
        assunto: 'Solicitação de declaração de matrícula', status: 'ABERTO', usuarioAberturaId: sec.id,
      },
    });
    console.log('✅ 3 tipos de protocolo + 1 protocolo de teste');

    // ── Contrato de matrícula + parcelas (pra Relatório Financeiro /
    // Inadimplência ter o que mostrar: uma paga, uma pendente, uma vencida) ──
    const contrato = await prisma.contratoMatricula.create({
      data: {
        alunoId: alunos['2024001'].id, periodoLetivoId: periodo2026S2.id,
        valorTotal: 6000, numeroParcelas: 6, diaVencimento: 10, status: 'ATIVO',
      },
    });
    await prisma.parcela.createMany({
      data: [
        { contratoId: contrato.id, numero: 1, valor: 1000, dataVencimento: new Date('2026-07-10'), dataPagamento: new Date('2026-07-08'), valorPago: 1000, status: 'PAGO', formaPagamento: 'PIX' },
        { contratoId: contrato.id, numero: 2, valor: 1000, dataVencimento: new Date('2026-08-10'), status: 'PENDENTE' },
        { contratoId: contrato.id, numero: 3, valor: 1000, dataVencimento: new Date('2026-06-10'), status: 'VENCIDO' },
      ],
    });
    console.log('✅ 1 contrato + 3 parcelas de teste');

    // ── Processo seletivo + candidatos + inscrições (Ingresso) ────────
    const processoSeletivo = await prisma.processoSeletivo.create({
      data: {
        nome: 'Vestibular 2026/2', tipo: 'VESTIBULAR', cursoId: cursoDireito.id,
        periodoLetivoId: periodo2026S2.id, vagas: 60,
        dataAbertura: new Date('2026-05-01'), dataEncerramento: new Date('2026-06-15'), status: 'ENCERRADO',
      },
    });
    const candidato1 = await prisma.candidato.upsert({
      where: { cpf: '33445566778' },
      update: {},
      create: { nome: 'Vitor Hugo Nascimento', cpf: '33445566778', email: 'vitor.nascimento@example.com', dataNascimento: new Date('2005-03-20'), sexo: 'MASCULINO', nacionalidade: 'BRASILEIRA' },
    });
    const candidato2 = await prisma.candidato.upsert({
      where: { cpf: '44556677889' },
      update: {},
      create: { nome: 'Isabela Cristina Rocha', cpf: '44556677889', email: 'isabela.rocha@example.com', dataNascimento: new Date('2005-09-11'), sexo: 'FEMININO', nacionalidade: 'BRASILEIRA' },
    });
    await prisma.inscricao.create({
      data: { candidatoId: candidato1.id, processoSeletivoId: processoSeletivo.id, status: 'APROVADO', notaEnem: 720.5, documentosOk: true },
    });
    await prisma.inscricao.create({
      data: { candidatoId: candidato2.id, processoSeletivoId: processoSeletivo.id, status: 'EM_ANALISE', notaEnem: 680.0, documentosOk: false },
    });
    console.log('✅ 1 processo seletivo + 2 candidatos + 2 inscrições de teste');

    // ── Requerimentos ─────────────────────────────────────────────────
    await prisma.requerimento.create({
      data: { alunoId: alunos['2024001'].id, tipo: 'DECLARACAO_MATRICULA', descricao: 'Preciso da declaração para o estágio.', status: 'ABERTO' },
    });
    await prisma.requerimento.create({
      data: { alunoId: alunos['2024002'].id, tipo: 'HISTORICO_OFICIAL', status: 'DEFERIDO', resposta: 'Histórico emitido e enviado por e-mail.' },
    });
    console.log('✅ 2 requerimentos de teste');
  } else {
    console.log('↷ Massa de teste (ofertas/matrículas/financeiro/ingresso/etc.) já existe, seed não duplicou.');
  }

  console.log('\n⚠️  ATENÇÃO: Altere as senhas em produção!');
  console.log('🏁 Seed concluído.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
