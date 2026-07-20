/**
 * prisma/seed.ts — Cria dados iniciais de desenvolvimento
 *
 * Executar:  npx prisma db seed
 * (ou)       npm run seed
 *
 * ── Massa de cursos (Jul/2026) ───────────────────────────────────────────
 * Os cursos cadastrados abaixo são os 9 cursos REAIS oferecidos pela FIURJ
 * e parceiras internacionais (UAL/UPT/USAL), extraídos dos materiais oficiais
 * de cada programa. Substituem os 3 cursos genéricos de teste (Direito,
 * Gestão Pública, Administração) que existiam antes — o bloco `limparCursosDeTesteAntigos()`
 * remove essa estrutura antiga (e tudo que dependia dela: matrizes, disciplinas,
 * ofertas, matrículas) e realoca os alunos de teste que apontavam pra ela.
 * Script segue idempotente: pode rodar de novo sem duplicar nada.
 */
import { PrismaClient, Grau, Modalidade, Turno } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// =============================================================================
// CATÁLOGO REAL DE CURSOS
// =============================================================================

interface CursoConfig {
  nome: string;
  grau: Grau;
  modalidade: Modalidade;
  codigoEmec: string;
  cargaHorariaTotal: number;
  prazoIntegralizacaoSemestres: number;
  prefixoCodigo: string;
  cargaHorariaDisciplina: number;
  creditosDisciplina: number;
  disciplinasPorPeriodo: string[][];
}

const CURSOS_REAIS: CursoConfig[] = [
  {
    // Fonte: FIURJgraduacaoemdireito.pdf — 10 semestres, 3780h, 100% presencial.
    nome: 'Direito',
    grau: 'BACHARELADO',
    modalidade: 'PRESENCIAL',
    codigoEmec: 'FIURJ-DIR-GRAD',
    cargaHorariaTotal: 3780,
    prazoIntegralizacaoSemestres: 10,
    prefixoCodigo: 'FIURJ-DIR',
    cargaHorariaDisciplina: 80,
    creditosDisciplina: 4,
    disciplinasPorPeriodo: [
      ['Comunicação e Expressão', 'Direitos Humanos, Sociedade e Relações Étnico-Raciais', 'Teoria Geral do Direito Civil', 'Pensamento Jurídico Brasileiro', 'Teoria do Estado Democrático', 'Teoria do Direito Constitucional', 'Crime e Sociedade (Direito Penal I)'],
      ['Economia', 'Metodologia Científica e da Pesquisa', 'Teoria do Direito', 'Penas e Medidas Alternativas (Direito Penal II)', 'Relações e Conflitos Consumeristas', 'Análise Econômica do Direito', 'Organização do Estado e Direitos Fundamentais'],
      ['Responsabilidade Social, Acessibilidade, Educação Ambiental e Recursos Naturais', 'Empreendedorismo, Inovação e Economia Criativa', 'Obrigações e Contratos', 'Teoria Geral da Empresa', 'Teorias da Justiça', 'Direito Global', 'Teoria Geral do Processo', 'Finanças Públicas'],
      ['Neurolinguística', 'Relações Interpessoais e Multiprofissionais', 'Optativa I', 'Teoria do Direito Administrativo', 'Sistema Tributário Nacional', 'Tipos Societários', 'Teoria da Decisão', 'Direito da Propriedade', 'Direito Transnacional'],
      ['Relações de Trabalho', 'Direito da Regulação', 'Processo Civil (Execução e Legislação Especial)', 'Processo do Trabalho', 'Direito Ambiental'],
      ['Optativa II', 'Direito da Concorrência', 'Compliance e Lei de Garantia e Proteção de Dados (LGPD)', 'Processo Penal', 'Integrador Vivências Jurídicas II', 'Laboratório de Prática Jurídica'],
      ['Métodos Adequados de Solução de Conflitos', 'Interpretação Jurisprudencial', 'Direito Ambiental II', 'Direito da Regulação II', 'Núcleo de Prática Jurídica I'],
      ['Direito para Startups', 'Internet e Responsabilidade Civil', 'Concorrência em Mercados Digitais', 'Impacto das Tecnologias no Ordenamento Jurídico', 'Núcleo de Prática Jurídica II'],
      ['Cybersegurança', 'Trabalho de Conclusão de Curso I', 'Comunicação Ativa', 'Contratos Eletrônicos', 'Núcleo de Prática Jurídica III'],
      ['Trabalho de Conclusão de Curso II', 'Business Intelligence', 'Visual Law', 'Núcleo de Prática Jurídica IV', 'Atividade Complementar (120h)'],
    ],
  },
  {
    // Fonte: FIURJposgraduacaoemcienciascriminais.pdf — 18 meses, 360h, sábados 09h-13h.
    nome: 'Pós-Graduação em Ciências Criminais',
    grau: 'ESPECIALIZACAO',
    modalidade: 'PRESENCIAL',
    codigoEmec: 'FIURJ-POS-CRIM',
    cargaHorariaTotal: 360,
    prazoIntegralizacaoSemestres: 3,
    prefixoCodigo: 'FIURJ-CRIM',
    cargaHorariaDisciplina: 60,
    creditosDisciplina: 3,
    disciplinasPorPeriodo: [
      ['Propedêutica e Garantias Fundamentais', 'Direito Penal'],
      ['Direito Penal Econômico', 'Direito Processual Penal', 'Metodologia e Laboratório de Iniciação Científica'],
      ['Criminologia'],
    ],
  },
  {
    // Fonte: UALmestradoemdireitocienciasjuridicopoliciais.pdf — 2 anos, 120 ECTS, semipresencial (1º ano mediado por tecnologia + viagens presenciais a Lisboa).
    nome: 'Mestrado em Direito: Ciências Jurídico-Policiais',
    grau: 'MESTRADO',
    modalidade: 'SEMIPRESENCIAL',
    codigoEmec: 'UAL-MEST-POLICIAIS',
    cargaHorariaTotal: 3360,
    prazoIntegralizacaoSemestres: 4,
    prefixoCodigo: 'UAL-POL',
    cargaHorariaDisciplina: 300,
    creditosDisciplina: 12,
    disciplinasPorPeriodo: [
      ['Metodologia da Investigação', 'Direito da Segurança', 'Filosofia do Direito', 'Direito Contraordenacional'],
      ['Direito Penal Avançado', 'Direito Digital e Cibercriminalidade', 'Direito Constitucional: Direitos Fundamentais no Espaço de Liberdade, Segurança e Justiça', 'Criminologia — Seminário de Investigação: Cooperação'],
    ],
  },
  {
    // Fonte: UALmestradoemdireitocienciasjuridicas.pdf — 2 anos, 120 ECTS.
    nome: 'Mestrado em Direito: Ciências Jurídico-Políticas',
    grau: 'MESTRADO',
    modalidade: 'SEMIPRESENCIAL',
    codigoEmec: 'UAL-MEST-POLITICAS',
    cargaHorariaTotal: 3360,
    prazoIntegralizacaoSemestres: 4,
    prefixoCodigo: 'UAL-PLT',
    cargaHorariaDisciplina: 300,
    creditosDisciplina: 12,
    disciplinasPorPeriodo: [
      ['Ciência Política', 'Direito Constitucional e Administrativo da UE', 'Metodologia da Investigação Jurídica', 'Teoria Política'],
      ['Responsabilidade Internacional', 'Direito do Mar', 'Direitos Humanos'],
    ],
  },
  {
    // Fonte: UPTmestradoEmCineciasJuridicoAdministrativasTributarias.pdf — 2 anos, 120 ECTS.
    nome: 'Mestrado em Direito: Ciências Jurídico-Administrativas e Tributárias',
    grau: 'MESTRADO',
    modalidade: 'SEMIPRESENCIAL',
    codigoEmec: 'UPT-MEST-ADMTRIB',
    cargaHorariaTotal: 3360,
    prazoIntegralizacaoSemestres: 4,
    prefixoCodigo: 'UPT-ADT',
    cargaHorariaDisciplina: 300,
    creditosDisciplina: 12,
    disciplinasPorPeriodo: [
      ['Procedimento Administrativo', 'Contratos Públicos', 'Ciência Política', 'Metodologia da Investigação Jurídica'],
      ['Processo Administrativo', 'Impostos em Especial', 'Teoria Política', 'Direito Tributário Europeu e Internacional'],
    ],
  },
  {
    // Fonte: UPTmestradoEmCineciasJuridicoPoliticas.pdf — 2 anos, 120 ECTS.
    nome: 'Mestrado em Direito: Ciências Jurídico-Políticas',
    grau: 'MESTRADO',
    modalidade: 'SEMIPRESENCIAL',
    codigoEmec: 'UPT-MEST-POLITICAS',
    cargaHorariaTotal: 3360,
    prazoIntegralizacaoSemestres: 4,
    prefixoCodigo: 'UPT-PLT',
    cargaHorariaDisciplina: 300,
    creditosDisciplina: 12,
    disciplinasPorPeriodo: [
      ['Ciência Política', 'Direito Constitucional e Administrativo da UE', 'Metodologia da Investigação Jurídica', 'Teoria Política'],
      ['Responsabilidade Internacional', 'Direito do Mar', 'Direitos Humanos'],
    ],
  },
  {
    // Fonte: UPTmestradoEmDireitoTransnacional.pdf — 2 anos, 120 ECTS.
    nome: 'Mestrado em Direito Transnacional',
    grau: 'MESTRADO',
    modalidade: 'SEMIPRESENCIAL',
    codigoEmec: 'UPT-MEST-TRANSNACIONAL',
    cargaHorariaTotal: 3360,
    prazoIntegralizacaoSemestres: 4,
    prefixoCodigo: 'UPT-TRN',
    cargaHorariaDisciplina: 300,
    creditosDisciplina: 12,
    disciplinasPorPeriodo: [
      ['Direito Administrativo Global', 'Direito Constitucional Europeu', 'Direito Internacional Privado Europeu', 'Direito Transnacional', 'Governança Global e Organizações Internacionais'],
      ['Direito Europeu de Defesa do Consumidor', 'Direito Europeu do Mar e do Ambiente', 'Direito Internacional e Europeu do Trabalho', 'Direito Tributário Europeu e Internacional', 'Sistema Financeiro Internacional e Europeu'],
    ],
  },
  {
    // Fonte: USALdoutoradoDireitoSalamanca.pdf — 4 linhas de pesquisa, seminários presenciais.
    nome: 'Doutorado em Direito',
    grau: 'DOUTORADO',
    modalidade: 'PRESENCIAL',
    codigoEmec: 'USAL-DOUT-DIREITO',
    cargaHorariaTotal: 1600,
    prazoIntegralizacaoSemestres: 2,
    prefixoCodigo: 'USAL-DOU',
    cargaHorariaDisciplina: 400,
    creditosDisciplina: 16,
    disciplinasPorPeriodo: [
      ['Administração, Finanças e Justiça no Estado Social', 'Direito Privado'],
      ['Estado de Direito e Governança Global', 'Estudos Interdisciplinares de Gênero e Políticas de Igualdade'],
    ],
  },
  {
    // Fonte: USALposdoutoradodireitoshumanosfontesinvestigacaoehistoriasalamanca.pdf — seminários presenciais (jun/2026) + trabalho final.
    nome: 'Pós-Doutorado em Direito: Fontes, Investigação e História dos Direitos Humanos',
    grau: 'POS_DOUTORADO',
    modalidade: 'PRESENCIAL',
    codigoEmec: 'USAL-POSDOC-DH',
    cargaHorariaTotal: 200,
    prazoIntegralizacaoSemestres: 2,
    prefixoCodigo: 'USAL-PDC',
    cargaHorariaDisciplina: 100,
    creditosDisciplina: 4,
    disciplinasPorPeriodo: [
      ['Seminários: Fontes, Investigação e História dos Direitos Humanos'],
      ['Trabalho Final de Investigação (Direitos Humanos)'],
    ],
  },
];

async function criarCursoComMatriz(cfg: CursoConfig) {
  const curso = await prisma.curso.upsert({
    where: { codigoEmec: cfg.codigoEmec },
    update: {
      nome: cfg.nome, grau: cfg.grau, modalidade: cfg.modalidade,
      cargaHorariaTotal: cfg.cargaHorariaTotal, prazoIntegralizacaoSemestres: cfg.prazoIntegralizacaoSemestres,
      status: 'ATIVO',
    },
    create: {
      nome: cfg.nome, grau: cfg.grau, modalidade: cfg.modalidade, codigoEmec: cfg.codigoEmec,
      cargaHorariaTotal: cfg.cargaHorariaTotal, prazoIntegralizacaoSemestres: cfg.prazoIntegralizacaoSemestres,
      status: 'ATIVO',
    },
  });
  const matriz = await prisma.matrizCurricular.upsert({
    where: { cursoId_versao: { cursoId: curso.id, versao: '2026.1' } },
    update: {},
    create: { cursoId: curso.id, versao: '2026.1', anoVigencia: 2026, status: 'VIGENTE' },
  });

  const disciplinas: { id: string; codigo: string; nome: string }[] = [];
  let seq = 0;
  for (let periodoIdx = 0; periodoIdx < cfg.disciplinasPorPeriodo.length; periodoIdx++) {
    for (const nomeDisc of cfg.disciplinasPorPeriodo[periodoIdx]) {
      seq += 1;
      const codigo = `${cfg.prefixoCodigo}-${String(seq).padStart(3, '0')}`;
      const disc = await prisma.disciplina.upsert({
        where: { matrizCurricularId_codigo: { matrizCurricularId: matriz.id, codigo } },
        update: { nome: nomeDisc, periodoSugerido: periodoIdx + 1 },
        create: {
          matrizCurricularId: matriz.id, codigo, nome: nomeDisc,
          cargaHoraria: cfg.cargaHorariaDisciplina, creditos: cfg.creditosDisciplina,
          periodoSugerido: periodoIdx + 1,
        },
      });
      disciplinas.push({ id: disc.id, codigo: disc.codigo, nome: disc.nome });
    }
  }
  return { curso, matriz, disciplinas };
}

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

  const periodo2026S1 = await prisma.periodoLetivo.findUnique({ where: { ano_semestre: { ano: 2026, semestre: 'S1' } } });

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
  // pode rodar de novo sem duplicar.
  // =========================================================================

  // ── Unidades ──────────────────────────────────────────────────
  const unidadesData = [
    { nome: 'FIURJ Centro Rio de Janeiro', cidade: 'Rio de Janeiro', uf: 'RJ' as string | null },
    { nome: 'UAL Lisboa', cidade: 'Lisboa', uf: null as string | null },
    { nome: 'UPT Porto', cidade: 'Porto', uf: null as string | null },
    { nome: 'USAL Salamanca', cidade: 'Salamanca', uf: null as string | null },
  ];
  for (const u of unidadesData) {
    const existe = await prisma.unidade.findFirst({ where: { nome: u.nome } });
    if (!existe) await prisma.unidade.create({ data: u });
  }
  console.log(`✅ ${unidadesData.length} unidades de teste`);

  // ── Cursos reais (FIURJ + UAL + UPT + USAL) ─────────────────────
  const [
    { curso: cursoFiurjDireito, matriz: matrizFiurjDireito, disciplinas: discFiurjDireito },
    { curso: cursoFiurjCriminais, matriz: matrizFiurjCriminais, disciplinas: discFiurjCriminais },
    { curso: cursoUalPoliciais, matriz: matrizUalPoliciais, disciplinas: discUalPoliciais },
    { curso: cursoUalPoliticas, matriz: matrizUalPoliticas, disciplinas: discUalPoliticas },
    { curso: cursoUptAdmTrib, matriz: matrizUptAdmTrib, disciplinas: discUptAdmTrib },
    { curso: cursoUptPoliticas, matriz: matrizUptPoliticas, disciplinas: discUptPoliticas },
    { curso: cursoUptTransnacional, matriz: matrizUptTransnacional, disciplinas: discUptTransnacional },
    { curso: cursoUsalDoutorado, matriz: matrizUsalDoutorado, disciplinas: discUsalDoutorado },
    { curso: cursoUsalPosDoc, matriz: matrizUsalPosDoc, disciplinas: discUsalPosDoc },
  ] = await Promise.all(CURSOS_REAIS.map(criarCursoComMatriz));

  console.log(`✅ ${CURSOS_REAIS.length} cursos reais cadastrados (FIURJ Graduação/Pós, UAL x2, UPT x3, USAL x2)`);

  // ── Limpeza dos 3 cursos de teste genéricos antigos (Direito/Gestão
  // Pública/Administração) e de toda a estrutura que dependia deles. Roda só
  // uma vez: se os códigos antigos não existirem mais, é um no-op. ────────
  await limparCursosDeTesteAntigos(cursoFiurjDireito.id, matrizFiurjDireito.id);

  // ── Professores ───────────────────────────────────────────────
  const professoresData = [
    { nome: 'Carlos Eduardo Ramos', cpf: '11122233344', titulacao: 'DOUTOR' as const, regime: 'INTEGRAL' as const, email: 'carlos.ramos@fiurj.edu.br' },
    { nome: 'Fernanda Souza Lima', cpf: '22233344455', titulacao: 'MESTRE' as const, regime: 'PARCIAL' as const, email: 'fernanda.lima@fiurj.edu.br' },
    { nome: 'Ricardo Almeida Santos', cpf: '33344455566', titulacao: 'ESPECIALISTA' as const, regime: 'HORISTA' as const, email: 'ricardo.santos@fiurj.edu.br' },
    { nome: 'Juliana Costa Pereira', cpf: '44455566677', titulacao: 'DOUTOR' as const, regime: 'INTEGRAL' as const, email: 'juliana.pereira@fiurj.edu.br' },
    { nome: 'António Cardoso Guedes', cpf: '55511122233', titulacao: 'DOUTOR' as const, regime: 'PARCIAL' as const, email: 'antonio.guedes@ual.fiurj.edu.br' },
    { nome: 'Inês Salgado Matos', cpf: '55522233344', titulacao: 'DOUTOR' as const, regime: 'PARCIAL' as const, email: 'ines.matos@upt.fiurj.edu.br' },
    { nome: 'Rui Manuel Pinto Duarte', cpf: '55533344455', titulacao: 'DOUTOR' as const, regime: 'PARCIAL' as const, email: 'rui.duarte@upt.fiurj.edu.br' },
    { nome: 'Javier Fernández Ruiz', cpf: '55544455566', titulacao: 'DOUTOR' as const, regime: 'PARCIAL' as const, email: 'javier.fernandez@usal.fiurj.edu.br' },
    { nome: 'Lourenço Bastos Vidal', cpf: '55555566677', titulacao: 'POS_DOUTOR' as const, regime: 'HORISTA' as const, email: 'lourenco.vidal@usal.fiurj.edu.br' },
    { nome: 'Esperanza Martín Quintela', cpf: '55566677788', titulacao: 'POS_DOUTOR' as const, regime: 'HORISTA' as const, email: 'esperanza.quintela@usal.fiurj.edu.br' },
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

  // ── Alunos — 8 já existentes (RAs 2024001-2024008) realocados pros cursos
  // reais + 2 novos (2024009/2024010) pra cobrir Doutorado e Pós-Doutorado
  // da USAL, que não tinham nenhum aluno de teste correspondente. ────────
  const alunosData: {
    ra: string; nome: string; cpf: string; email: string; cursoId: string; matrizId: string;
    sexo: 'MASCULINO' | 'FEMININO'; corRaca: 'BRANCA' | 'PRETA' | 'PARDA' | 'AMARELA' | 'INDIGENA';
    formaIngresso: 'VESTIBULAR' | 'ENEM' | 'TRANSFERENCIA_EXTERNA' | 'CONVENIO'; situacao: 'CURSANDO' | 'TRANCADO' | 'EVADIDO';
    codigoValidacaoCarteirinha?: string;
  }[] = [
    { ra: '2024001', nome: 'Mariana Alves Ferreira', cpf: '55566677788', email: 'mariana.ferreira@aluno.fiurj.edu.br', cursoId: cursoFiurjDireito.id, matrizId: matrizFiurjDireito.id, sexo: 'FEMININO', corRaca: 'PARDA', formaIngresso: 'ENEM', situacao: 'CURSANDO', codigoValidacaoCarteirinha: 'FIURJ-2026-000001' },
    { ra: '2024002', nome: 'Pedro Henrique Souza', cpf: '66677788899', email: 'pedro.souza@aluno.fiurj.edu.br', cursoId: cursoFiurjDireito.id, matrizId: matrizFiurjDireito.id, sexo: 'MASCULINO', corRaca: 'BRANCA', formaIngresso: 'VESTIBULAR', situacao: 'CURSANDO' },
    { ra: '2024003', nome: 'Beatriz Lima Rodrigues', cpf: '77788899900', email: 'beatriz.rodrigues@aluno.fiurj.edu.br', cursoId: cursoFiurjCriminais.id, matrizId: matrizFiurjCriminais.id, sexo: 'FEMININO', corRaca: 'PRETA', formaIngresso: 'ENEM', situacao: 'CURSANDO' },
    { ra: '2024004', nome: 'Lucas Gabriel Martins', cpf: '88899900011', email: 'lucas.martins@aluno.fiurj.edu.br', cursoId: cursoUalPoliciais.id, matrizId: matrizUalPoliciais.id, sexo: 'MASCULINO', corRaca: 'PARDA', formaIngresso: 'CONVENIO', situacao: 'CURSANDO' },
    { ra: '2024005', nome: 'Camila Santos Oliveira', cpf: '99900011122', email: 'camila.oliveira@aluno.fiurj.edu.br', cursoId: cursoUalPoliticas.id, matrizId: matrizUalPoliticas.id, sexo: 'FEMININO', corRaca: 'BRANCA', formaIngresso: 'CONVENIO', situacao: 'CURSANDO' },
    { ra: '2024006', nome: 'Rafael Costa Silva', cpf: '00011122233', email: 'rafael.silva@aluno.fiurj.edu.br', cursoId: cursoUptAdmTrib.id, matrizId: matrizUptAdmTrib.id, sexo: 'MASCULINO', corRaca: 'AMARELA', formaIngresso: 'CONVENIO', situacao: 'TRANCADO' },
    { ra: '2024007', nome: 'Amanda Pereira Gomes', cpf: '11223344556', email: 'amanda.gomes@aluno.fiurj.edu.br', cursoId: cursoUptPoliticas.id, matrizId: matrizUptPoliticas.id, sexo: 'FEMININO', corRaca: 'INDIGENA', formaIngresso: 'CONVENIO', situacao: 'EVADIDO' },
    { ra: '2024008', nome: 'Gabriel Rocha Barbosa', cpf: '22334455667', email: 'gabriel.barbosa@aluno.fiurj.edu.br', cursoId: cursoUptTransnacional.id, matrizId: matrizUptTransnacional.id, sexo: 'MASCULINO', corRaca: 'PARDA', formaIngresso: 'CONVENIO', situacao: 'CURSANDO' },
    { ra: '2024009', nome: 'Rodrigo Nunes Carvalho', cpf: '33445566779', email: 'rodrigo.carvalho@aluno.fiurj.edu.br', cursoId: cursoUsalDoutorado.id, matrizId: matrizUsalDoutorado.id, sexo: 'MASCULINO', corRaca: 'BRANCA', formaIngresso: 'CONVENIO', situacao: 'CURSANDO' },
    { ra: '2024010', nome: 'Patrícia Menezes Duarte', cpf: '44556677890', email: 'patricia.duarte@aluno.fiurj.edu.br', cursoId: cursoUsalPosDoc.id, matrizId: matrizUsalPosDoc.id, sexo: 'FEMININO', corRaca: 'PARDA', formaIngresso: 'CONVENIO', situacao: 'CURSANDO' },
  ];
  const alunos: Record<string, { id: string }> = {};
  for (const a of alunosData) {
    const aluno = await prisma.aluno.upsert({
      where: { ra: a.ra },
      update: {
        cursoId: a.cursoId, matrizCurricularId: a.matrizId, situacaoVinculo: a.situacao,
      },
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
  console.log(`✅ ${alunosData.length} alunos de teste (realocados pros 9 cursos reais)`);

  // Usuário de login pro perfil ALUNO (Mariana Alves Ferreira, RA 2024001 — agora em Direito/FIURJ)
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

  // ── Ofertas (turmas) + matrículas nos 9 cursos reais, período 2026/S2 ──
  // Protegido por checagem de idempotência própria (existência de uma oferta
  // da primeira disciplina de Direito/FIURJ), independente do bloco legado
  // de avisos/financeiro/etc. logo abaixo.
  const jaTemOfertasReais = periodo2026S2
    ? await prisma.oferta.findFirst({ where: { disciplina: { codigo: discFiurjDireito[0].codigo } } })
    : true;

  if (!jaTemOfertasReais && periodo2026S2) {
    type CursoTurma = { disciplinas: { id: string; codigo: string; nome: string }[]; profEmail: string; profEmail2?: string; turno: Turno; sala: string; horario: string };
    const turmasPorCurso: CursoTurma[] = [
      { disciplinas: discFiurjDireito, profEmail: 'carlos.ramos@fiurj.edu.br', turno: 'NOITE', sala: '101', horario: '19h-22h30' },
      { disciplinas: discFiurjCriminais, profEmail: 'fernanda.lima@fiurj.edu.br', turno: 'MANHA', sala: '201', horario: 'Sábados 09h-13h' },
      { disciplinas: discUalPoliciais, profEmail: 'antonio.guedes@ual.fiurj.edu.br', turno: 'TARDE', sala: 'Online', horario: 'Brasil 14h-15h / Lisboa 18h-19h' },
      { disciplinas: discUalPoliticas, profEmail: 'antonio.guedes@ual.fiurj.edu.br', turno: 'TARDE', sala: 'Online', horario: 'Brasil 14h-15h / Lisboa 18h-19h' },
      { disciplinas: discUptAdmTrib, profEmail: 'ines.matos@upt.fiurj.edu.br', turno: 'TARDE', sala: 'Online', horario: 'Brasil 14h-15h / Porto 18h-19h' },
      { disciplinas: discUptPoliticas, profEmail: 'ines.matos@upt.fiurj.edu.br', turno: 'TARDE', sala: 'Online', horario: 'Brasil 14h-15h / Porto 18h-19h' },
      { disciplinas: discUptTransnacional, profEmail: 'rui.duarte@upt.fiurj.edu.br', turno: 'TARDE', sala: 'Online', horario: 'Brasil 14h-15h / Porto 18h-19h' },
      { disciplinas: discUsalDoutorado, profEmail: 'juliana.pereira@fiurj.edu.br', profEmail2: 'javier.fernandez@usal.fiurj.edu.br', turno: 'TARDE', sala: 'Online', horario: 'Brasil 12h30-16h30' },
      { disciplinas: discUsalPosDoc, profEmail: 'lourenco.vidal@usal.fiurj.edu.br', profEmail2: 'esperanza.quintela@usal.fiurj.edu.br', turno: 'MANHA', sala: 'Presencial — Salamanca', horario: 'Espanha 10h-14h30' },
    ];

    const ofertasPorCurso: { id: string; disciplinaCodigo: string }[][] = [];
    for (const t of turmasPorCurso) {
      const ofertasDoCurso: { id: string; disciplinaCodigo: string }[] = [];
      const disciplinasParaOferta = t.disciplinas.slice(0, 2); // 2 primeiras disciplinas de cada curso viram turma
      for (let i = 0; i < disciplinasParaOferta.length; i++) {
        const profEmail = i === 0 ? t.profEmail : (t.profEmail2 ?? t.profEmail);
        const oferta = await prisma.oferta.create({
          data: {
            disciplinaId: disciplinasParaOferta[i].id,
            periodoLetivoId: periodo2026S2.id,
            professorId: professores[profEmail].id,
            vagas: 30, turno: t.turno, sala: t.sala, horario: t.horario,
          },
        });
        ofertasDoCurso.push({ id: oferta.id, disciplinaCodigo: disciplinasParaOferta[i].codigo });
      }
      ofertasPorCurso.push(ofertasDoCurso);
    }
    console.log(`✅ ${ofertasPorCurso.flat().length} ofertas (turmas) de teste, 2 por curso real, em 2026/2`);

    // Matrículas — 1 aluno de cada curso (o 1º cadastrado nele) nas 2 ofertas do curso
    const matriculaPorCursoIdx: { ra: string; cursoIdx: number; status: 'MATRICULADO' | 'TRANCADO' | 'CANCELADO' }[] = [
      { ra: '2024001', cursoIdx: 0, status: 'MATRICULADO' },
      { ra: '2024002', cursoIdx: 0, status: 'MATRICULADO' },
      { ra: '2024003', cursoIdx: 1, status: 'MATRICULADO' },
      { ra: '2024004', cursoIdx: 2, status: 'MATRICULADO' },
      { ra: '2024005', cursoIdx: 3, status: 'MATRICULADO' },
      { ra: '2024006', cursoIdx: 4, status: 'TRANCADO' },
      { ra: '2024007', cursoIdx: 5, status: 'CANCELADO' },
      { ra: '2024008', cursoIdx: 6, status: 'MATRICULADO' },
      { ra: '2024009', cursoIdx: 7, status: 'MATRICULADO' },
      { ra: '2024010', cursoIdx: 8, status: 'MATRICULADO' },
    ];
    let totalMatriculas = 0;
    const matriculaMarianaPorDisciplina: Record<string, string> = {};
    for (const m of matriculaPorCursoIdx) {
      for (const oferta of ofertasPorCurso[m.cursoIdx]) {
        const matricula = await prisma.matriculaDisciplina.create({
          data: { alunoId: alunos[m.ra].id, ofertaId: oferta.id, status: m.status },
        });
        totalMatriculas += 1;
        if (m.ra === '2024001') matriculaMarianaPorDisciplina[oferta.disciplinaCodigo] = matricula.id;
      }
    }
    console.log(`✅ ${totalMatriculas} matrículas de teste nos cursos reais (2026/2)`);

    // Notas (pauta), frequência e avaliação avulsa pra Mariana na 1ª disciplina
    // de Direito/FIURJ — dá pra ver Lançamento de Notas, Frequência, Pauta e
    // Mapão populados.
    const matriculaMarianaDir1 = matriculaMarianaPorDisciplina[discFiurjDireito[0].codigo];
    if (matriculaMarianaDir1) {
      await prisma.notaPauta.create({
        data: {
          matriculaDisciplinaId: matriculaMarianaDir1,
          av1: 8.0, av2: 7.5, av3: 9.0, av4: 8.5, faltas: 2,
        },
      });
      await prisma.registroFrequencia.create({
        data: {
          matriculaDisciplinaId: matriculaMarianaDir1,
          data: new Date('2026-07-06'), quantidadeAulas: 4, faltas: 0,
        },
      });
      await prisma.registroFrequencia.create({
        data: {
          matriculaDisciplinaId: matriculaMarianaDir1,
          data: new Date('2026-07-13'), quantidadeAulas: 4, faltas: 2, observacao: 'Atestado médico',
        },
      });
      await prisma.avaliacao.create({
        data: { matriculaDisciplinaId: matriculaMarianaDir1, tipo: 'PROVA', nota: 8.0, peso: 1 },
      });
      console.log(`✅ Notas/frequência/avaliação de teste (Mariana em ${discFiurjDireito[0].nome})`);
    }

    // Disciplina já concluída por Mariana em 2026/1 (período ENCERRADO) — pra
    // Notas e Histórico / CR / Integralização terem o que mostrar além do
    // período em andamento.
    if (periodo2026S1 && discFiurjDireito[2]) {
      const ofertaConcluida = await prisma.oferta.create({
        data: {
          disciplinaId: discFiurjDireito[2].id, periodoLetivoId: periodo2026S1.id,
          professorId: professores['carlos.ramos@fiurj.edu.br'].id,
          vagas: 40, turno: 'NOITE', sala: '101', horario: '19h-22h30',
        },
      });
      const matriculaConcluida = await prisma.matriculaDisciplina.create({
        data: { alunoId: alunos['2024001'].id, ofertaId: ofertaConcluida.id, status: 'APROVADO' },
      });
      await prisma.resultadoDisciplina.create({
        data: { matriculaDisciplinaId: matriculaConcluida.id, mediaFinal: 8.2, faltas: 3, frequenciaPercentual: 92.5, situacao: 'APROVADO' },
      });
      console.log(`✅ 1 disciplina concluída de teste (Mariana, ${discFiurjDireito[2].nome}, 2026/1 — APROVADO)`);
    }
  } else {
    console.log('↷ Ofertas/matrículas de teste dos cursos reais já existem, seed não duplicou.');
  }

  // ── Bloco legado — avisos, financeiro, secretaria, ingresso etc.
  // Protegido por checagem de idempotência própria (não depende mais dos
  // cursos/disciplinas de teste antigos, que foram removidos). ───────────
  const jaTemMassaTesteLegada = await prisma.aviso.findFirst({ where: { titulo: 'Bem-vindos ao 2º semestre de 2026' } });

  if (!jaTemMassaTesteLegada && periodo2026S2) {
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
        { nome: 'Mensalidade', descricao: 'Mensalidade de graduação/pós-graduação' },
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
        { nome: 'Coordenação de Pós-Graduação e Convênios Internacionais', setor: 'Coordenação', numero: '2003' },
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
      data: { alunoId: alunos['2024003'].id, tipoBolsa: 'Convênio Institucional', percentual: 10, dataInicio: new Date('2024-02-05'), ativo: true },
    });
    console.log('✅ 1 bolsista de teste');

    // ── Tipos de protocolo + protocolos ──────────────────────────────
    const tipoProtocoloDoc = await prisma.tipoProtocolo.create({ data: { nome: 'Solicitação de Documento' } });
    await prisma.tipoProtocolo.createMany({ data: [{ nome: 'Reclamação' }, { nome: 'Recurso Administrativo' }] });
    // upsert (não create) — `numero` é @unique; evita P2002 se sobrar um
    // Protocolo de uma rodada de seed anterior que não chegou a criar o
    // Aviso-marcador (guarda `jaTemMassaTesteLegada` lá em cima), o que faria
    // esse bloco inteiro re-rodar e colidir num `numero` já existente.
    await prisma.protocolo.upsert({
      where: { numero: '2026/000001' },
      update: {},
      create: {
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
        nome: 'Vestibular 2026/2 — Direito', tipo: 'VESTIBULAR', cursoId: cursoFiurjDireito.id,
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
    console.log('↷ Massa de teste legada (avisos/financeiro/ingresso/secretaria/etc.) já existe, seed não duplicou.');
  }

  // ── Perfil Master (Jul/2026) — ferramentas de sistema (Painel do Sistema,
  // Identidade Visual, Ramais, Log de Auditoria), acima do ADMIN comum. ────
  const senhaMasterHash = await bcrypt.hash('master123', 12);
  const master = await prisma.usuario.upsert({
    where: { email: 'master@fiurj.edu.br' },
    update: {},
    create: {
      email: 'master@fiurj.edu.br',
      senhaHash: senhaMasterHash,
      perfil: 'MASTER',
      mfaAtivo: false,
      status: 'ATIVO',
      nome: 'Master',
    },
  });
  console.log(`✅ Usuário master: ${master.email}  (senha: master123)`);

  // ── Suporte / Chamados de Manutenção (Jul/2026) ─────────────────────────
  // Email/senha mantidos como estavam de propósito (perfil MANUTENCAO virou
  // SUPORTE em Jul/2026, mas o seed usa upsert por email como chave de
  // idempotência — trocar o email aqui criaria um usuário novo em produção
  // em vez de atualizar o existente). Só o perfil e o nome de exibição
  // mudam, que é o que a Matriz de Permissões e a UI mostram pro usuário.
  const senhaSuporteHash = await bcrypt.hash('manut123', 12);
  const suporte = await prisma.usuario.upsert({
    where: { email: 'manutencao@fiurj.edu.br' },
    update: {},
    create: {
      email: 'manutencao@fiurj.edu.br',
      senhaHash: senhaSuporteHash,
      perfil: 'SUPORTE',
      mfaAtivo: false,
      status: 'ATIVO',
      nome: 'Equipe de Suporte',
    },
  });
  console.log(`✅ Usuário suporte: ${suporte.email}  (senha: manut123)`);

  const tipoChamadoCount = await prisma.tipoChamadoManutencao.count();
  if (tipoChamadoCount === 0) {
    const tiposChamado = await Promise.all(
      ['Elétrica', 'Hidráulica', 'TI / Informática', 'Mobiliário', 'Ar-condicionado', 'Limpeza'].map(nome =>
        prisma.tipoChamadoManutencao.create({ data: { nome } }),
      ),
    );
    const tipoPorNome = Object.fromEntries(tiposChamado.map(t => [t.nome, t]));
    const solicitante = alunos['2024001']
      ? await prisma.usuario.findFirst({ where: { alunoId: alunos['2024001'].id } })
      : null;
    const solicitanteId = solicitante?.id ?? suporte.id;

    await prisma.chamadoManutencao.create({
      data: {
        numero: 'CM20260001', tipoId: tipoPorNome['Ar-condicionado'].id, local: 'Sala 101',
        prioridade: 'ALTA', titulo: 'Ar-condicionado não liga', descricao: 'Testado o controle, sem resposta do aparelho.',
        status: 'ABERTO', solicitanteId,
      },
    });
    await prisma.chamadoManutencao.create({
      data: {
        numero: 'CM20260002', tipoId: tipoPorNome['TI / Informática'].id, local: 'Laboratório de Informática',
        prioridade: 'MEDIA', titulo: 'Computador não liga', status: 'EM_ANDAMENTO', solicitanteId, responsavelId: suporte.id,
      },
    });
    await prisma.chamadoManutencao.create({
      data: {
        numero: 'CM20260003', tipoId: tipoPorNome['Hidráulica'].id, local: 'Banheiro Térreo',
        prioridade: 'URGENTE', titulo: 'Vazamento na torneira', status: 'CONCLUIDO', solicitanteId,
        responsavelId: suporte.id, dataConclusao: new Date(),
      },
    });
    console.log('✅ 6 tipos de chamado + 3 chamados de manutenção de teste');
  } else {
    console.log('↷ Tipos/chamados de manutenção já existem, seed não duplicou.');
  }

  console.log('\n⚠️  ATENÇÃO: Altere as senhas em produção!');
  console.log('🏁 Seed concluído.');
}

/**
 * Remove os 3 cursos de teste genéricos antigos (Direito/Gestão Pública/
 * Administração — códigos DIR2024/GESPUB2024/ADM2024) e toda a estrutura
 * que dependia deles (matrizes, disciplinas, ofertas, matrículas e o que
 * penduricava nelas). Antes de apagar, realoca qualquer Aluno/ProcessoSeletivo
 * que ainda aponte pra eles pro curso real de Direito da FIURJ (os alunos já
 * são realocados de forma definitiva no upsert de `alunosData` logo depois —
 * isso aqui é só a rede de segurança que libera a FK pra podermos apagar os
 * cursos antigos com segurança, mesmo se a ordem do script mudar no futuro).
 * Idempotente: se os códigos antigos não existirem (2ª execução em diante),
 * é um no-op.
 */
async function limparCursosDeTesteAntigos(cursoFallbackId: string, matrizFallbackId: string) {
  const codigosAntigos = ['DIR2024', 'GESPUB2024', 'ADM2024'];
  const cursosAntigos = await prisma.curso.findMany({ where: { codigoEmec: { in: codigosAntigos } } });
  if (cursosAntigos.length === 0) return;

  const cursoIds = cursosAntigos.map(c => c.id);

  await prisma.aluno.updateMany({
    where: { cursoId: { in: cursoIds } },
    data: { cursoId: cursoFallbackId, matrizCurricularId: matrizFallbackId },
  });
  await prisma.processoSeletivo.updateMany({ where: { cursoId: { in: cursoIds } }, data: { cursoId: cursoFallbackId } });

  const matrizes = await prisma.matrizCurricular.findMany({ where: { cursoId: { in: cursoIds } } });
  const matrizIds = matrizes.map(m => m.id);
  const disciplinasAntigas = await prisma.disciplina.findMany({ where: { matrizCurricularId: { in: matrizIds } } });
  const disciplinaIds = disciplinasAntigas.map(d => d.id);
  const ofertasAntigas = await prisma.oferta.findMany({ where: { disciplinaId: { in: disciplinaIds } } });
  const ofertaIds = ofertasAntigas.map(o => o.id);
  const matriculasAntigas = await prisma.matriculaDisciplina.findMany({ where: { ofertaId: { in: ofertaIds } } });
  const matriculaIds = matriculasAntigas.map(m => m.id);

  await prisma.avaliacao.deleteMany({ where: { matriculaDisciplinaId: { in: matriculaIds } } });
  await prisma.registroFrequencia.deleteMany({ where: { matriculaDisciplinaId: { in: matriculaIds } } });
  await prisma.notaPauta.deleteMany({ where: { matriculaDisciplinaId: { in: matriculaIds } } });
  await prisma.resultadoDisciplina.deleteMany({ where: { matriculaDisciplinaId: { in: matriculaIds } } });
  await prisma.matriculaDisciplina.deleteMany({ where: { id: { in: matriculaIds } } });
  await prisma.oferta.deleteMany({ where: { id: { in: ofertaIds } } });
  await prisma.disciplinaPrerequisito.deleteMany({ where: { OR: [{ disciplinaId: { in: disciplinaIds } }, { prerequisitoId: { in: disciplinaIds } }] } });
  await prisma.materiaEquiparada.deleteMany({ where: { disciplinaId: { in: disciplinaIds } } });
  await prisma.disciplina.deleteMany({ where: { id: { in: disciplinaIds } } });
  await prisma.matrizCurricular.deleteMany({ where: { id: { in: matrizIds } } });
  await prisma.curso.deleteMany({ where: { id: { in: cursoIds } } });

  console.log(`🧹 Removidos ${cursosAntigos.length} cursos de teste antigos (Direito/Gestão Pública/Administração genéricos) e toda a estrutura dependente (matrizes, disciplinas, ofertas, matrículas).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
