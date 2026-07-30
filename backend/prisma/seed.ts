/**
 * prisma/seed.ts — Cria dados iniciais de desenvolvimento
 *
 * Executar:  npx prisma db seed
 * (ou)       npm run seed
 *
 * ── Massa de cursos (Jul/2026) ───────────────────────────────────────────
 * Os cursos cadastrados abaixo são os 10 cursos REAIS oferecidos pela FIURJ
 * e parceiras internacionais (UAL/UPT/USAL), extraídos dos materiais oficiais
 * de cada programa (Direito e Gestão Pública vêm do PDF "GRADE CURRICULAR
 * DIREITO E GESTÃO PÚBLICA", com carga horária real por disciplina). Substituem
 * os 3 cursos genéricos de teste (Direito, Gestão Pública, Administração) que
 * existiam antes — o bloco `limparCursosDeTesteAntigos()` remove essa estrutura
 * antiga (e tudo que dependia dela: matrizes, disciplinas, ofertas, matrículas).
 *
 * ── Limpeza de dados de teste (Jul/2026) ─────────────────────────────────
 * `limparMassaTesteAtual()` remove, por fingerprint exato, toda a massa
 * sintética de alunos/professores/ofertas/notas/processos/contratos/avisos/
 * períodos letivos criada por rodadas anteriores deste próprio script — não
 * mexe nos cursos reais nem nos logins administrativos.
 *
 * Script segue idempotente: pode rodar de novo sem duplicar nada.
 */
import { PrismaClient, Grau, Modalidade } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';

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
  cargaHorariaComplementarObrigatoria?: number;
  prazoIntegralizacaoSemestres: number;
  prefixoCodigo: string;
  cargaHorariaDisciplina: number;
  creditosDisciplina: number;
  // Cada item é o nome da disciplina (usa cargaHorariaDisciplina/creditosDisciplina do curso),
  // ou um par { nome, ch } quando a disciplina tem carga horária própria — caso de Direito e
  // Gestão Pública, cujas grades reais têm CH variada por disciplina (ver PDF de grade
  // curricular oficial "GRADE CURRICULAR DIREITO E GESTÃO PÚBLICA").
  disciplinasPorPeriodo: (string | { nome: string; ch: number })[][];
}

const CURSOS_REAIS: CursoConfig[] = [
  {
    // Fonte: PDF oficial "GRADE CURRICULAR DIREITO E GESTÃO PÚBLICA" (trilhas 1-6 + Trilha 5:
    // Regulação e Direito 4.0, períodos 7-10) — 10 semestres, 3760h (3660h de disciplinas +
    // 100h de atividade complementar), 100% presencial. CH por disciplina real (não uniforme).
    nome: 'Direito',
    grau: 'BACHARELADO',
    modalidade: 'PRESENCIAL',
    codigoEmec: 'FIURJ-DIR-GRAD',
    cargaHorariaTotal: 3760,
    cargaHorariaComplementarObrigatoria: 100,
    prazoIntegralizacaoSemestres: 10,
    prefixoCodigo: 'FIURJ-DIR',
    cargaHorariaDisciplina: 80,
    creditosDisciplina: 4,
    disciplinasPorPeriodo: [
      [
        { nome: 'Comunicação e Expressão', ch: 60 },
        { nome: 'Direitos Humanos, Sociedade e Relações Étnico-Raciais', ch: 40 },
        { nome: 'Teoria Geral do Direito Civil', ch: 80 },
        { nome: 'Pensamento Jurídico Brasileiro', ch: 40 },
        { nome: 'Teoria do Estado Democrático', ch: 60 },
        { nome: 'Teoria do Direito Constitucional', ch: 60 },
        { nome: 'Crime e Sociedade (Direito Penal I)', ch: 80 },
      ],
      [
        { nome: 'Economia', ch: 40 },
        { nome: 'Metodologia Científica e da Pesquisa', ch: 40 },
        { nome: 'Teoria do Direito', ch: 60 },
        { nome: 'Penas e Medidas Alternativas (Direito Penal II)', ch: 80 },
        { nome: 'Relações e Conflitos Consumeristas', ch: 60 },
        { nome: 'Análise Econômica do Direito', ch: 40 },
        { nome: 'Organização do Estado e Direitos Fundamentais', ch: 40 },
        { nome: 'Sociologia Jurídica', ch: 40 },
      ],
      [
        { nome: 'Responsabilidade Social, Acessibilidade, Educação Ambiental e Recursos Naturais', ch: 40 },
        { nome: 'Empreendedorismo, Inovação e Economia Criativa', ch: 40 },
        { nome: 'Obrigações e Contratos', ch: 60 },
        { nome: 'Teoria Geral da Empresa', ch: 40 },
        { nome: 'Teorias da Justiça', ch: 40 },
        { nome: 'Direito Global', ch: 40 },
        { nome: 'Teoria Geral do Processo', ch: 80 },
        { nome: 'Finanças Públicas', ch: 40 },
      ],
      [
        { nome: 'Neurolinguística', ch: 40 },
        { nome: 'Relações Interpessoais e Multiprofissionais', ch: 40 },
        { nome: 'Teoria do Direito Administrativo', ch: 80 },
        { nome: 'Sistema Tributário Nacional', ch: 40 },
        { nome: 'Tipos Societários', ch: 40 },
        { nome: 'Teoria da Decisão', ch: 60 },
        { nome: 'Direito da Propriedade', ch: 60 },
        { nome: 'Direito Transnacional', ch: 40 },
      ],
      [
        { nome: 'Relações de Trabalho', ch: 80 },
        { nome: 'Direito da Regulação', ch: 40 },
        { nome: 'Processo Civil (Execução e Legislação Especial)', ch: 80 },
        { nome: 'Processo do Trabalho', ch: 80 },
        { nome: 'Direito Ambiental', ch: 40 },
        { nome: 'Projeto Integrador Vivências Jurídicas I', ch: 80 },
      ],
      [
        { nome: 'Optativa II', ch: 40 },
        { nome: 'Direito da Concorrência', ch: 40 },
        { nome: 'Compliance e Lei de Garantia e Proteção de Dados (LGPD)', ch: 40 },
        { nome: 'Processo Penal', ch: 80 },
        { nome: 'Projeto Integrador Vivências Jurídicas II', ch: 80 },
        { nome: 'Laboratório de Prática Jurídica', ch: 80 },
      ],
      [
        { nome: 'Métodos Adequados de Solução de Conflitos', ch: 60 },
        { nome: 'Interpretação Jurisprudencial', ch: 80 },
        { nome: 'Direito Ambiental II', ch: 60 },
        { nome: 'Direito da Regulação II', ch: 80 },
        { nome: 'Núcleo de Prática Jurídica I', ch: 80 },
      ],
      [
        { nome: 'Direito para Startups', ch: 80 },
        { nome: 'Internet e Responsabilidade Civil', ch: 60 },
        { nome: 'Concorrência em Mercados Digitais', ch: 80 },
        { nome: 'Impacto das Tecnologias no Ordenamento Jurídico', ch: 60 },
        { nome: 'Núcleo de Prática Jurídica II', ch: 80 },
      ],
      [
        { nome: 'Cybersegurança', ch: 60 },
        { nome: 'Trabalho de Conclusão de Curso I', ch: 40 },
        { nome: 'Comunicação Ativa', ch: 60 },
        { nome: 'Contratos Eletrônicos', ch: 80 },
        { nome: 'Núcleo de Prática Jurídica III', ch: 80 },
      ],
      [
        { nome: 'Trabalho de Conclusão de Curso II', ch: 40 },
        { nome: 'Business Intelligence', ch: 80 },
        { nome: 'Visual Law', ch: 60 },
        { nome: 'Núcleo de Prática Jurídica IV', ch: 80 },
      ],
    ],
  },
  {
    // Fonte: PDF oficial "GRADE CURRICULAR DIREITO E GESTÃO PÚBLICA" — CST (tecnólogo), 4
    // semestres, 1660h (1620h de disciplinas + 40h de atividades complementares).
    // codigoEmec é PLACEHOLDER (o PDF não traz o código e-MEC real) — corrigir depois pela
    // tela de Cursos quando o código oficial estiver disponível.
    nome: 'Gestão Pública',
    grau: 'TECNOLOGO',
    modalidade: 'PRESENCIAL',
    codigoEmec: 'FIURJ-GESPUB-TEC',
    cargaHorariaTotal: 1660,
    cargaHorariaComplementarObrigatoria: 40,
    prazoIntegralizacaoSemestres: 4,
    prefixoCodigo: 'FIURJ-GESPUB',
    cargaHorariaDisciplina: 60,
    creditosDisciplina: 3,
    disciplinasPorPeriodo: [
      [
        { nome: 'Comunicação e Expressão', ch: 60 },
        { nome: 'Direitos Humanos, Sociedade e Relações Étnico-Raciais', ch: 40 },
        { nome: 'Direito Constitucional e Administrativo', ch: 60 },
        { nome: 'Fundamentos de Contabilidade', ch: 40 },
        { nome: 'Gestão de Projetos', ch: 60 },
        { nome: 'Matemática Financeira', ch: 60 },
        { nome: 'Fundamentos de Administração', ch: 60 },
        { nome: 'Projeto Integrador - Vivências em Gestão Pública I', ch: 40 },
      ],
      [
        { nome: 'Economia', ch: 40 },
        { nome: 'Metodologia Científica e da Pesquisa', ch: 40 },
        { nome: 'Estatística Aplicada', ch: 40 },
        { nome: 'Qualidade no Serviço Público', ch: 60 },
        { nome: 'Gestão Financeira e Orçamentária', ch: 60 },
        { nome: 'Estratégia Empresarial', ch: 60 },
        { nome: 'Gestão de Processos', ch: 60 },
        { nome: 'Projeto Integrador - Vivências em Gestão Pública II', ch: 40 },
      ],
      [
        { nome: 'Responsabilidade Social, Acessibilidade, Educação Ambiental e Recursos Naturais', ch: 40 },
        { nome: 'Empreendedorismo, Inovação e Economia Criativa', ch: 40 },
        { nome: 'Gestão Pública e Políticas Públicas no Brasil', ch: 60 },
        { nome: 'Gestão de Pessoas e Relações Humanas no Setor Público', ch: 60 },
        { nome: 'Ética e Probidade Administrativa', ch: 40 },
        { nome: 'Licitações, Contratos e Convênios', ch: 60 },
        { nome: 'Governo Eletrônico, Transparência e Inclusão', ch: 40 },
        { nome: 'Projeto Integrador - Vivências em Gestão Pública III', ch: 40 },
      ],
      [
        { nome: 'Neurolinguística', ch: 40 },
        { nome: 'Relações Interpessoais e Multiprofissionais', ch: 40 },
        { nome: 'Optativa', ch: 40 },
        { nome: 'Elaboração e Gestão de Projetos e Programas no Setor Público', ch: 60 },
        { nome: 'Laboratório de Prática Profissional em Gestão Pública', ch: 60 },
        { nome: 'Controle e Auditoria', ch: 60 },
        { nome: 'Desafios Contemporâneos e Inovações na Gestão Pública', ch: 60 },
        { nome: 'Projeto Integrador - Vivências em Gestão Pública IV', ch: 60 },
      ],
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
      cargaHorariaComplementarObrigatoria: cfg.cargaHorariaComplementarObrigatoria ?? 0,
      status: 'ATIVO',
    },
    create: {
      nome: cfg.nome, grau: cfg.grau, modalidade: cfg.modalidade, codigoEmec: cfg.codigoEmec,
      cargaHorariaTotal: cfg.cargaHorariaTotal, prazoIntegralizacaoSemestres: cfg.prazoIntegralizacaoSemestres,
      cargaHorariaComplementarObrigatoria: cfg.cargaHorariaComplementarObrigatoria ?? 0,
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
    for (const item of cfg.disciplinasPorPeriodo[periodoIdx]) {
      seq += 1;
      const nomeDisc = typeof item === 'string' ? item : item.nome;
      const chDisc = typeof item === 'string' ? cfg.cargaHorariaDisciplina : item.ch;
      const creditosDisc = typeof item === 'string' ? cfg.creditosDisciplina : Math.round(item.ch / 20);
      const codigo = `${cfg.prefixoCodigo}-${String(seq).padStart(3, '0')}`;
      const disc = await prisma.disciplina.upsert({
        where: { matrizCurricularId_codigo: { matrizCurricularId: matriz.id, codigo } },
        update: { nome: nomeDisc, periodoSugerido: periodoIdx + 1, cargaHoraria: chDisc, creditos: creditosDisc },
        create: {
          matrizCurricularId: matriz.id, codigo, nome: nomeDisc,
          cargaHoraria: chDisc, creditos: creditosDisc,
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

  try {
    await limparMassaTesteAtual();
  } catch (e) {
    console.error('⚠️  limparMassaTesteAtual() falhou (não deveria impedir o resto do seed):', e);
  }
  try {
    await importarAlunosLegadosParcela();
  } catch (e) {
    console.error('⚠️  importarAlunosLegadosParcela() falhou (não deveria impedir o resto do seed):', e);
  }
  try {
    await importarContratosEParcelasLegado();
  } catch (e) {
    console.error('⚠️  importarContratosEParcelasLegado() falhou (não deveria impedir o resto do seed):', e);
  }
  try {
    await corrigirParcelasQuitadoZeroLegado();
  } catch (e) {
    console.error('⚠️  corrigirParcelasQuitadoZeroLegado() falhou (não deveria impedir o resto do seed):', e);
  }

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

  // Períodos letivos e calendário acadêmico deixaram de ser seedados como
  // massa de teste (Jul/2026, limpeza de dados de teste) — passam a vir da
  // importação de dados reais (turmas/matrículas), ainda não implementada.
  // `limparMassaTesteAtual()` (chamada no topo desta função) já apaga os 4
  // períodos de teste (2025/S2..2027/S1) e o calendário que dependia deles.

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
    { curso: cursoFiurjGestaoPublica, matriz: matrizFiurjGestaoPublica, disciplinas: discFiurjGestaoPublica },
  ] = await Promise.all(CURSOS_REAIS.map(criarCursoComMatriz));

  console.log(`✅ ${CURSOS_REAIS.length} cursos reais cadastrados (FIURJ Direito/Gestão Pública/Pós, UAL x2, UPT x3, USAL x2)`);

  // ── Limpeza dos 3 cursos de teste genéricos antigos (Direito/Gestão
  // Pública/Administração) e de toda a estrutura que dependia deles. Roda só
  // uma vez: se os códigos antigos não existirem mais, é um no-op. ────────
  await limparCursosDeTesteAntigos(cursoFiurjDireito.id, matrizFiurjDireito.id);

  // ── Professores reais (Pasta1.xlsx) — Direito + Gestão Pública ─────────
  // Titulação/regime de trabalho/e-mail não constam no arquivo de origem —
  // placeholder (Especialista/Horista/nome.sobrenome@fiurj.edu.br), editável
  // depois pela tela de Professores. Associação de curso — Rogério da Silva
  // Rocha e Elson Gomes: Gestão Pública; Gilberto Jorge F. de Freitas: Gestão
  // Pública e também Direito; os demais 8 (incl. Simão Dolezel Aznar):
  // Direito — é só informativa aqui: o schema não tem FK Professor→Curso,
  // só via Oferta (fase futura de turmas reais).
  const professoresData = [
    { nome: 'Armstrong Cosme de Oliveira', cpf: '94434387715', titulacao: 'ESPECIALISTA' as const, regime: 'HORISTA' as const, email: 'armstrong.oliveira@fiurj.edu.br' },
    { nome: 'Carlos Eugênio Pereira', cpf: '01954047770', titulacao: 'ESPECIALISTA' as const, regime: 'HORISTA' as const, email: 'carlos.pereira@fiurj.edu.br' },
    { nome: 'Elson Gomes', cpf: '05189505731', titulacao: 'ESPECIALISTA' as const, regime: 'HORISTA' as const, email: 'elson.gomes@fiurj.edu.br' },
    { nome: 'Fabiano Guimarães da Rocha', cpf: '08049407705', titulacao: 'ESPECIALISTA' as const, regime: 'HORISTA' as const, email: 'fabiano.rocha@fiurj.edu.br' },
    { nome: 'Gilberto Jorge F. de Freitas', cpf: '20679858768', titulacao: 'ESPECIALISTA' as const, regime: 'HORISTA' as const, email: 'gilberto.freitas@fiurj.edu.br' },
    { nome: 'Lier Pires Ferreira Junior', cpf: '03130723706', titulacao: 'ESPECIALISTA' as const, regime: 'HORISTA' as const, email: 'lier.ferreira@fiurj.edu.br' },
    { nome: 'Mariana Marun', cpf: '04320982754', titulacao: 'ESPECIALISTA' as const, regime: 'HORISTA' as const, email: 'mariana.marun@fiurj.edu.br' },
    { nome: 'Marilza Pereira da Silva Roco', cpf: '00259696765', titulacao: 'ESPECIALISTA' as const, regime: 'HORISTA' as const, email: 'marilza.roco@fiurj.edu.br' },
    { nome: 'Ricardo Basílio Weber', cpf: '03533393771', titulacao: 'ESPECIALISTA' as const, regime: 'HORISTA' as const, email: 'ricardo.weber@fiurj.edu.br' },
    { nome: 'Rogério da Silva Rocha', cpf: '01326370731', titulacao: 'ESPECIALISTA' as const, regime: 'HORISTA' as const, email: 'rogerio.rocha@fiurj.edu.br' },
    { nome: 'Simão Dolezel Aznar', cpf: '12194567720', titulacao: 'ESPECIALISTA' as const, regime: 'HORISTA' as const, email: 'simao.aznar@fiurj.edu.br' },
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
  console.log(`✅ ${professoresData.length} professores reais (Direito/Gestão Pública)`);

  // Alunos, ofertas, matrículas, notas e frequência de teste foram removidos
  // (Jul/2026, limpeza de dados de teste) — `limparMassaTesteAtual()` (topo
  // desta função) já apaga qualquer resquício. A importação de alunos/turmas
  // reais de Direito/Gestão Pública fica para uma fase futura (depende de
  // mapear qual turma numérica da Kirsch — 251/252/261/262/271/2 — é Direito
  // e qual é Gestão Pública, confirmação pendente com o usuário).

  // Bloco legado (avisos/ficha de saúde/contas bancárias/documentos/
  // ocorrências/mensagens/observações financeiras/ramais/bolsista/protocolo/
  // contrato+parcelas/processo seletivo+candidatos/requerimentos) de teste
  // foi removido (Jul/2026, limpeza de dados de teste) — `limparMassaTesteAtual()`
  // (topo desta função) já apaga qualquer resquício pelos fingerprints exatos
  // (RA/CPF/título). Ramais, categorias de receita, contas bancárias, tipos de
  // protocolo e motivos de ocorrência/transferência (catálogos pequenos, sem
  // dado sensível) não foram recriados nem apagados — seguem como estavam.

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
    const solicitanteId = suporte.id;

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

  // Tabelas de INSS/IRRF — referência 2024, confiança razoável mas NÃO
  // validada contra a publicação oficial vigente. Só pro sistema não nascer
  // sem nenhuma tabela cadastrada; confirmar/atualizar com um contador antes
  // de fechar qualquer folha real (ver aviso em backend/prisma/schema.prisma,
  // seção "CPAGAR", e em backend/src/cpagar/calculo-folha.util.ts).
  const tabelaInssCount = await prisma.tabelaInss.count();
  if (tabelaInssCount === 0) {
    await prisma.tabelaInss.create({
      data: {
        vigenciaInicio: new Date('2024-01-01'),
        ativa: true,
        faixas: {
          create: [
            { ordem: 1, limiteInicial: 0, limiteFinal: 1412.00, aliquota: 7.5 },
            { ordem: 2, limiteInicial: 1412.00, limiteFinal: 2666.68, aliquota: 9 },
            { ordem: 3, limiteInicial: 2666.68, limiteFinal: 4000.03, aliquota: 12 },
            { ordem: 4, limiteInicial: 4000.03, limiteFinal: 7786.02, aliquota: 14 },
          ],
        },
      },
    });
    console.log('✅ Tabela de INSS 2024 (referência, precisa validação) cadastrada.');
  } else {
    console.log('↷ Tabela de INSS já existe, seed não duplicou.');
  }

  const tabelaIrrfCount = await prisma.tabelaIrrf.count();
  if (tabelaIrrfCount === 0) {
    await prisma.tabelaIrrf.create({
      data: {
        vigenciaInicio: new Date('2024-01-01'),
        ativa: true,
        valorDeducaoPorDependente: 189.59,
        faixas: {
          create: [
            { ordem: 1, limiteInicial: 0, limiteFinal: 2259.20, aliquota: 0, parcelaDeduzir: 0 },
            { ordem: 2, limiteInicial: 2259.20, limiteFinal: 2826.65, aliquota: 7.5, parcelaDeduzir: 169.44 },
            { ordem: 3, limiteInicial: 2826.65, limiteFinal: 3751.05, aliquota: 15, parcelaDeduzir: 381.44 },
            { ordem: 4, limiteInicial: 3751.05, limiteFinal: 4664.68, aliquota: 22.5, parcelaDeduzir: 662.77 },
            { ordem: 5, limiteInicial: 4664.68, limiteFinal: null, aliquota: 27.5, parcelaDeduzir: 896.00 },
          ],
        },
      },
    });
    console.log('✅ Tabela de IRRF 2024 (referência, precisa validação) cadastrada.');
  } else {
    console.log('↷ Tabela de IRRF já existe, seed não duplicou.');
  }

  console.log('\n⚠️  ATENÇÃO: Altere as senhas em produção!');
  console.log('🏁 Seed concluído.');
}

/**
 * Importa os alunos da planilha financeira legada (Kirsch, "BASE DE DADOS
 * PARCELA DE 2000 A 2030.xlsx") como um primeiro cadastro provisório —
 * identificados pelo código do aluno na planilha (`codigoLegado`), já que
 * ainda não sabemos o curso real de cada um (Direito x Gestão Pública x
 * outros programas — mapeamento de turma pendente de confirmação).
 *
 * Fonte dos dados: `prisma/data/alunos-legado-parcela.json` (gerado a partir
 * da planilha, já sem os registros de teste do próprio Kirsch — "ALUNO
 * TESTE", "TESTE BOLETO" etc. — e sem o 1 código em branco encontrado).
 *
 * Todos entram num curso/matriz placeholder "A Classificar" (status
 * ENCERRADO/ENCERRADA, pra não aparecer em dropdowns de curso ativo) até
 * serem reclassificados manualmente pro curso real.
 *
 * Campos que a planilha não tem (nascimento, sexo, forma de ingresso, e-mail)
 * recebem um placeholder claro (sexo/cor-raça "Não Declarado", forma de
 * ingresso "Outro", nascimento 01/01/1900, e-mail
 * aluno{codigoLegado}@pendente.fiurj.edu.br) — tudo editável depois pela tela
 * de Alunos. CPF: usa o da planilha quando válido (11 dígitos); senão, gera
 * um placeholder óbvio (999 + código com 8 dígitos) só pra satisfazer a
 * coluna única — real chega depois, por fora.
 *
 * RA gerado no padrão do sistema (AAAA0001), agrupado pelo ano da 1ª parcela
 * conhecida do aluno (proxy de quando ele começou a aparecer na base
 * financeira — não é a data de ingresso real, mas é o melhor sinal
 * disponível nesta planilha). O código original do Kirsch fica preservado
 * à parte em `codigoLegado`.
 *
 * Idempotente: cada aluno é único por `codigoLegado` — rodar de novo não
 * duplica nem sobrescreve alunos já importados (mesmo que já tenham sido
 * corrigidos manualmente depois).
 */
async function importarAlunosLegadosParcela() {
  const jsonPath = path.join(__dirname, 'data', 'alunos-legado-parcela.json');
  if (!fs.existsSync(jsonPath)) {
    console.log('↷ prisma/data/alunos-legado-parcela.json não encontrado — pulando importação legada.');
    return;
  }
  const dados: { codigoLegado: string; nome: string; cpf: string | null; dataIngresso: string | null }[] =
    JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

  const cursoClassificar = await prisma.curso.upsert({
    where: { codigoEmec: 'PENDENTE-CLASSIFICACAO' },
    update: {},
    create: {
      nome: 'A Classificar (importação legada)',
      grau: 'BACHARELADO',
      modalidade: 'PRESENCIAL',
      codigoEmec: 'PENDENTE-CLASSIFICACAO',
      cargaHorariaTotal: 0,
      prazoIntegralizacaoSemestres: 0,
      status: 'ENCERRADO',
    },
  });
  const matrizClassificar = await prisma.matrizCurricular.upsert({
    where: { cursoId_versao: { cursoId: cursoClassificar.id, versao: 'PENDENTE' } },
    update: {},
    create: { cursoId: cursoClassificar.id, versao: 'PENDENTE', anoVigencia: 2026, status: 'ENCERRADA' },
  });

  const jaImportados = new Set(
    (await prisma.aluno.findMany({ where: { codigoLegado: { not: null } }, select: { codigoLegado: true } }))
      .map(a => a.codigoLegado as string),
  );

  const contadoresPorAno = new Map<number, number>();
  async function proximoRa(ano: number): Promise<string> {
    if (!contadoresPorAno.has(ano)) {
      const prefixo = String(ano);
      const existente = await prisma.aluno.findFirst({
        where: { ra: { startsWith: prefixo } },
        orderBy: { ra: 'desc' },
      });
      let max = 0;
      if (existente && existente.ra.length === prefixo.length + 4) {
        max = parseInt(existente.ra.slice(prefixo.length), 10) || 0;
      }
      contadoresPorAno.set(ano, max);
    }
    const proximo = (contadoresPorAno.get(ano) as number) + 1;
    contadoresPorAno.set(ano, proximo);
    return `${ano}${String(proximo).padStart(4, '0')}`;
  }

  let criados = 0;
  const colisoes: string[] = [];
  for (const d of dados) {
    if (jaImportados.has(d.codigoLegado)) continue;
    const ano = d.dataIngresso ? new Date(d.dataIngresso).getUTCFullYear() : 2018;
    const ra = await proximoRa(ano);
    const cpf = d.cpf ?? `999${d.codigoLegado.padStart(8, '0')}`;
    try {
      await prisma.aluno.create({
        data: {
          ra,
          codigoLegado: d.codigoLegado,
          nome: d.nome,
          cpf,
          cursoId: cursoClassificar.id,
          matrizCurricularId: matrizClassificar.id,
          dataNascimento: new Date('1900-01-01'),
          sexo: 'NAO_DECLARADO',
          corRaca: 'NAO_DECLARADO',
          nacionalidade: 'BRASILEIRA',
          formaIngresso: 'OUTRO',
          dataIngresso: d.dataIngresso ? new Date(d.dataIngresso) : new Date(`${ano}-01-01`),
          situacaoVinculo: 'CURSANDO',
          email: `aluno${d.codigoLegado}@pendente.fiurj.edu.br`,
        },
      });
      criados += 1;
    } catch (err) {
      // P2002 = unique constraint (cpf/email/ra já usados por outro aluno --
      // provavelmente a mesma pessoa já cadastrada sob outro registro). Não
      // aborta o lote inteiro por causa de 1 colisão; loga e segue pro próximo.
      if ((err as { code?: string })?.code === 'P2002') {
        colisoes.push(`${d.codigoLegado} (${d.nome})`);
      } else {
        throw err;
      }
    }
  }
  console.log(`✅ Importação legada: ${criados} alunos criados (curso placeholder "A Classificar"), ${dados.length - criados - colisoes.length} já existiam, ${colisoes.length} pulados por colisão de CPF/e-mail/RA com aluno já existente.`);
  if (colisoes.length) {
    console.log('⚠️  Colisões (código legado + nome, não importados -- provável mesma pessoa já cadastrada sob outro registro):');
    console.log(colisoes.join(' | '));
  }
}

/**
 * Importa contratos de matrícula + parcelas da planilha financeira legada
 * (mesma fonte de `importarAlunosLegadosParcela`) — `ContratoMatricula`
 * agrupado por (aluno, ano/semestre da data de vencimento) e `Parcela`
 * linha a linha. Cria os `PeriodoLetivo` que faltarem (a planilha cobre
 * 2013-2030, bem além dos períodos já cadastrados). Só processa aluno que
 * já tenha sido importado com `codigoLegado` (ver `importarAlunosLegadosParcela`,
 * precisa rodar antes) e que ainda não tenha nenhum `ContratoMatricula` —
 * idempotente por aluno (não por linha, dado o volume).
 *
 * Fonte: `prisma/data/contratos-parcelas-legado.json` (pré-computado —
 * agrupamento por período e sequência de parcela já feitos fora do seed).
 */
async function importarContratosEParcelasLegado() {
  const jsonPath = path.join(__dirname, 'data', 'contratos-parcelas-legado.json');
  if (!fs.existsSync(jsonPath)) {
    console.log('↷ prisma/data/contratos-parcelas-legado.json não encontrado — pulando importação de contratos/parcelas.');
    return;
  }
  const dados: {
    codigoLegado: string;
    contratos: {
      ano: number; semestre: 'S1' | 'S2'; diaVencimento: number; valorTotal: number;
      parcelas: { numero: number; dataVencimento: string; valor: number; dataPagamento: string | null; valorPago: number | null; status: 'PAGO' | 'EM_ABERTO' }[];
    }[];
  }[] = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

  const hoje = new Date();

  // 1. Períodos letivos necessários — cria os que faltarem.
  const periodosNecessarios = new Set<string>();
  for (const a of dados) for (const c of a.contratos) periodosNecessarios.add(`${c.ano}-${c.semestre}`);

  const periodosExistentes = await prisma.periodoLetivo.findMany({
    where: {
      OR: [...periodosNecessarios].map(chave => {
        const [anoStr, semestre] = chave.split('-');
        return { ano: Number(anoStr), semestre: semestre as 'S1' | 'S2' };
      }),
    },
  });
  const periodoMap = new Map<string, string>();
  for (const p of periodosExistentes) periodoMap.set(`${p.ano}-${p.semestre}`, p.id);

  const periodosParaCriar = [...periodosNecessarios].filter(chave => !periodoMap.has(chave));
  for (const chave of periodosParaCriar) {
    const [anoStr, semestre] = chave.split('-') as [string, 'S1' | 'S2'];
    const ano = Number(anoStr);
    const dataInicio = new Date(semestre === 'S1' ? `${ano}-01-01` : `${ano}-07-01`);
    const dataFim = new Date(semestre === 'S1' ? `${ano}-06-30` : `${ano}-12-31`);
    const status: 'PLANEJADO' | 'EM_ANDAMENTO' | 'ENCERRADO' =
      dataFim < hoje ? 'ENCERRADO' : dataInicio > hoje ? 'PLANEJADO' : 'EM_ANDAMENTO';
    const periodo = await prisma.periodoLetivo.upsert({
      where: { ano_semestre: { ano, semestre } },
      update: {},
      create: { ano, semestre, dataInicio, dataFim, status },
    });
    periodoMap.set(chave, periodo.id);
  }
  if (periodosParaCriar.length) {
    const ordenados = [...periodosNecessarios].sort();
    console.log(`✅ ${periodosParaCriar.length} períodos letivos criados pra cobrir o histórico financeiro legado (${ordenados[0]}..${ordenados[ordenados.length - 1]}).`);
  }

  // 2. Alunos: casa por codigoLegado.
  const codigosLegados = dados.map(a => a.codigoLegado);
  const alunosEncontrados = await prisma.aluno.findMany({ where: { codigoLegado: { in: codigosLegados } }, select: { id: true, codigoLegado: true } });
  const alunoMap = new Map(alunosEncontrados.map(a => [a.codigoLegado as string, a.id]));

  // 3. Idempotência por aluno: pula quem já tem qualquer ContratoMatricula.
  const alunoIdsRelevantes = [...alunoMap.values()];
  const comContrato = await prisma.contratoMatricula.findMany({
    where: { alunoId: { in: alunoIdsRelevantes } },
    select: { alunoId: true },
    distinct: ['alunoId'],
  });
  const alunoIdsComContrato = new Set(comContrato.map(c => c.alunoId));

  // 4. Monta a lista de contratos a criar (só alunos casados e ainda não processados).
  type ContratoParaCriar = {
    alunoId: string; periodoLetivoId: string; valorTotal: number; numeroParcelas: number;
    diaVencimento: number; status: 'ATIVO' | 'ENCERRADO';
    parcelas: { numero: number; dataVencimento: string; valor: number; dataPagamento: string | null; valorPago: number | null; status: 'PAGO' | 'EM_ABERTO' }[];
  };
  const contratosParaCriar: ContratoParaCriar[] = [];
  const semAlunoCorrespondente: string[] = [];
  let pulosPorJaTerContrato = 0;

  for (const a of dados) {
    const alunoId = alunoMap.get(a.codigoLegado);
    if (!alunoId) { semAlunoCorrespondente.push(a.codigoLegado); continue; }
    if (alunoIdsComContrato.has(alunoId)) { pulosPorJaTerContrato += 1; continue; }
    for (const c of a.contratos) {
      const periodoLetivoId = periodoMap.get(`${c.ano}-${c.semestre}`) as string;
      const dataFimPeriodo = c.semestre === 'S1' ? new Date(`${c.ano}-06-30`) : new Date(`${c.ano}-12-31`);
      contratosParaCriar.push({
        alunoId, periodoLetivoId, valorTotal: c.valorTotal, numeroParcelas: c.parcelas.length,
        diaVencimento: c.diaVencimento, status: dataFimPeriodo < hoje ? 'ENCERRADO' : 'ATIVO',
        parcelas: c.parcelas,
      });
    }
  }

  // 5. Cria os contratos em lotes (createMany não retorna id -- refaz um
  //    findMany depois casando por (alunoId, periodoLetivoId), única dentro
  //    deste lote já que cada aluno só tem 1 contrato por período aqui).
  const TAMANHO_LOTE = 2000;
  for (let i = 0; i < contratosParaCriar.length; i += TAMANHO_LOTE) {
    const lote = contratosParaCriar.slice(i, i + TAMANHO_LOTE);
    await prisma.contratoMatricula.createMany({
      data: lote.map(c => ({
        alunoId: c.alunoId, periodoLetivoId: c.periodoLetivoId, valorTotal: c.valorTotal,
        numeroParcelas: c.numeroParcelas, diaVencimento: c.diaVencimento, status: c.status,
      })),
    });
  }

  const contratosCriados = contratosParaCriar.length
    ? await prisma.contratoMatricula.findMany({
        where: { alunoId: { in: [...new Set(contratosParaCriar.map(c => c.alunoId))] } },
        select: { id: true, alunoId: true, periodoLetivoId: true },
      })
    : [];
  const contratoIdMap = new Map(contratosCriados.map(c => [`${c.alunoId}|${c.periodoLetivoId}`, c.id]));

  // 6. Monta e cria as parcelas em lotes.
  const parcelasParaCriar: { contratoId: string; numero: number; valor: number; dataVencimento: Date; dataPagamento: Date | null; valorPago: number | null; status: 'PAGO' | 'PENDENTE' | 'VENCIDO' | 'SUBSTITUIDA' }[] = [];
  for (const c of contratosParaCriar) {
    const contratoId = contratoIdMap.get(`${c.alunoId}|${c.periodoLetivoId}`);
    if (!contratoId) continue; // não deveria acontecer -- defensivo
    for (const p of c.parcelas) {
      const dataVencimento = new Date(p.dataVencimento);
      // "Quitado" com Valor Recebido = 0 na planilha legada não é pago de
      // verdade -- é uma parcela substituída por outra via Acordo/
      // renegociação entre as partes (achado confirmado pelo usuário).
      const status: 'PAGO' | 'PENDENTE' | 'VENCIDO' | 'SUBSTITUIDA' =
        p.status === 'PAGO'
          ? (p.valorPago === 0 ? 'SUBSTITUIDA' : 'PAGO')
          : dataVencimento < hoje ? 'VENCIDO' : 'PENDENTE';
      parcelasParaCriar.push({
        contratoId, numero: p.numero, valor: p.valor, dataVencimento,
        dataPagamento: p.dataPagamento ? new Date(p.dataPagamento) : null,
        valorPago: p.valorPago, status,
      });
    }
  }
  for (let i = 0; i < parcelasParaCriar.length; i += TAMANHO_LOTE) {
    const lote = parcelasParaCriar.slice(i, i + TAMANHO_LOTE);
    await prisma.parcela.createMany({ data: lote });
  }

  console.log(`✅ Contratos/parcelas legados: ${contratosParaCriar.length} contratos e ${parcelasParaCriar.length} parcelas criados para ${new Set(contratosParaCriar.map(c => c.alunoId)).size} alunos.`);
  console.log(`↷ ${pulosPorJaTerContrato} alunos pulados (já tinham contrato de uma execução anterior).`);
  if (semAlunoCorrespondente.length) {
    console.log(`⚠️  ${semAlunoCorrespondente.length} códigos legados da planilha financeira sem Aluno correspondente (não importados como aluno, provável colisão de CPF): ${semAlunoCorrespondente.slice(0, 30).join(', ')}${semAlunoCorrespondente.length > 30 ? '...' : ''}`);
  }
}

/**
 * Correção pontual (Jul/2026): `importarContratosEParcelasLegado()` já tinha
 * rodado em produção antes do enum `StatusParcela` ganhar `SUBSTITUIDA` —
 * o mapeamento antigo tratava toda parcela "Quitado" da planilha como PAGO,
 * mesmo quando o Valor Recebido era 0 (achado confirmado pelo usuário: essas
 * são parcelas substituídas por outra via Acordo/renegociação, não pagas de
 * verdade). Corrige retroativamente os registros que já foram criados.
 * Idempotente: a condição `status = PAGO` deixa de bater assim que corrigido
 * uma vez, então rodar de novo não repete nem desfaz nada.
 */
async function corrigirParcelasQuitadoZeroLegado() {
  const { count } = await prisma.parcela.updateMany({
    where: { status: 'PAGO', valorPago: 0 },
    data: { status: 'SUBSTITUIDA' },
  });
  if (count > 0) {
    console.log(`✅ ${count} parcelas corrigidas de PAGO para SUBSTITUIDA (Valor Recebido = 0 na planilha legada — substituída via Acordo).`);
  }
}

/**
 * Remove toda a massa de teste sintética herdada de rodadas anteriores do
 * seed: alunos fake (RAs 2024001-2024010), professores fake, ofertas/
 * matrículas/notas/frequência, processo seletivo + candidatos + inscrições,
 * contratos + parcelas, requerimentos/documentos de aluno, ficha de saúde/
 * bolsista/ocorrência/observação financeira/protocolo presos aos alunos
 * fake, avisos de teste, e os 4 períodos letivos de teste + calendário
 * acadêmico que dependia deles. NÃO mexe nos 10 cursos reais (Direito/
 * Gestão Pública/Pós-Graduação/UAL/UPT/USAL), nem nos usuários de login
 * (admin/secretaria/financeiro/master/suporte), nem nos catálogos pequenos
 * (ramais, categorias de receita, contas bancárias, tipos de protocolo,
 * motivos de ocorrência/transferência).
 *
 * Usa fingerprints exatos (RA/e-mail/CPF/título literal) desta mesma seed —
 * não é um DELETE genérico. Idempotente: numa 2ª execução os filtros não
 * encontram mais nada e é um no-op.
 */
async function limparMassaTesteAtual() {
  const RAS_TESTE = ['2024001', '2024002', '2024003', '2024004', '2024005', '2024006', '2024007', '2024008', '2024009', '2024010'];
  const EMAILS_PROF_TESTE = [
    'carlos.ramos@fiurj.edu.br', 'fernanda.lima@fiurj.edu.br', 'ricardo.santos@fiurj.edu.br',
    'juliana.pereira@fiurj.edu.br', 'antonio.guedes@ual.fiurj.edu.br', 'ines.matos@upt.fiurj.edu.br',
    'rui.duarte@upt.fiurj.edu.br', 'javier.fernandez@usal.fiurj.edu.br', 'lourenco.vidal@usal.fiurj.edu.br',
    'esperanza.quintela@usal.fiurj.edu.br',
  ];
  const TITULOS_AVISO_TESTE = ['Bem-vindos ao 2º semestre de 2026', 'Manutenção programada no sistema', 'Reunião de coordenação'];
  const CPFS_CANDIDATO_TESTE = ['33445566778', '44556677889'];
  const NOME_PROCESSO_TESTE = 'Vestibular 2026/2 — Direito';

  const alunosTeste = await prisma.aluno.findMany({ where: { ra: { in: RAS_TESTE } } });
  const alunoIds = alunosTeste.map(a => a.id);
  const professoresTeste = await prisma.professor.findMany({ where: { email: { in: EMAILS_PROF_TESTE } } });
  const professorIds = professoresTeste.map(p => p.id);
  const dadosFolhaTeste = await prisma.dadosFolhaProfessor.findMany({ where: { professorId: { in: professorIds } } });
  const dadosFolhaIds = dadosFolhaTeste.map(d => d.id);
  const itensFolhaTeste = await prisma.itemFolha.findMany({ where: { professorId: { in: dadosFolhaIds } } });
  const itensFolhaIds = itensFolhaTeste.map(i => i.id);

  // Sequencial (não $transaction) de propósito: cada passo já é seguro de
  // rodar de novo sozinho (filtros por fingerprint/id específico), então se
  // um passo inesperado falhar, os anteriores não precisam ser desfeitos —
  // ao contrário de uma transação única, onde qualquer erro reverte TUDO
  // (foi exatamente isso que aconteceu antes de cobrir ProvaGerada aqui).

  // 1. Notas/frequência/resultado — só existem presas a MatriculaDisciplina,
  //    e nenhuma matrícula real foi criada ainda (import de turma real fica
  //    pra outra fase) — seguro sem filtro.
  await prisma.avaliacao.deleteMany({});
  await prisma.registroFrequencia.deleteMany({});
  await prisma.notaPauta.deleteMany({});
  await prisma.resultadoDisciplina.deleteMany({});
  // 2. Matrículas e ofertas de teste (mesmo raciocínio).
  await prisma.matriculaDisciplina.deleteMany({});
  await prisma.oferta.deleteMany({});
  // 3. Financeiro de teste — só existe preso a um dos alunos fake.
  await prisma.parcela.deleteMany({});
  await prisma.contratoMatricula.deleteMany({});
  // 4. Ingresso de teste — fingerprintado (Candidato/ProcessoSeletivo não
  //    dependem de Aluno, então não dá pra assumir que só existe fake).
  await prisma.inscricao.deleteMany({ where: { candidato: { cpf: { in: CPFS_CANDIDATO_TESTE } } } });
  await prisma.candidato.deleteMany({ where: { cpf: { in: CPFS_CANDIDATO_TESTE } } });
  await prisma.processoSeletivo.deleteMany({ where: { nome: NOME_PROCESSO_TESTE } });
  // 5. Auxiliares presos aos alunos fake — necessário limpar antes de
  //    poder apagar Aluno (todos RESTRICT).
  await prisma.fichaSaude.deleteMany({ where: { alunoId: { in: alunoIds } } });
  await prisma.bolsista.deleteMany({ where: { alunoId: { in: alunoIds } } });
  await prisma.ocorrencia.deleteMany({ where: { alunoId: { in: alunoIds } } });
  await prisma.observacaoFinanceira.deleteMany({ where: { alunoId: { in: alunoIds } } });
  await prisma.documentoAluno.deleteMany({ where: { alunoId: { in: alunoIds } } });
  await prisma.requerimento.deleteMany({ where: { alunoId: { in: alunoIds } } });
  await prisma.protocolo.deleteMany({ where: { alunoId: { in: alunoIds } } });
  // 5b. Auxiliares presos aos professores fake — necessário limpar antes de
  //     poder apagar Professor (CapturaProva/ProvaGerada/HoraComplementar são
  //     RESTRICT direto; DadosFolhaProfessor é RESTRICT e tem sua própria
  //     cadeia via ItemFolha → ItemFolhaLancamento).
  await prisma.capturaProva.deleteMany({ where: { professorId: { in: professorIds } } });
  await prisma.provaGerada.deleteMany({ where: { professorId: { in: professorIds } } });
  await prisma.horaComplementar.deleteMany({ where: { professorId: { in: professorIds } } });
  await prisma.itemFolhaLancamento.deleteMany({ where: { itemFolhaId: { in: itensFolhaIds } } });
  await prisma.itemFolha.deleteMany({ where: { id: { in: itensFolhaIds } } });
  await prisma.dadosFolhaProfessor.deleteMany({ where: { id: { in: dadosFolhaIds } } });
  // 6. Avisos de teste — fingerprintado (Aviso não depende de Aluno, só
  //    opcionalmente de Usuario, que continua existindo).
  await prisma.aviso.deleteMany({ where: { titulo: { in: TITULOS_AVISO_TESTE } } });
  // 7. Alunos e professores fake.
  await prisma.aluno.deleteMany({ where: { ra: { in: RAS_TESTE } } });
  await prisma.professor.deleteMany({ where: { email: { in: EMAILS_PROF_TESTE } } });
  // 8. Períodos letivos de teste (EventoCalendario é Cascade, some junto).
  await prisma.periodoLetivo.deleteMany({ where: { ano: { in: [2025, 2026, 2027] } } });

  console.log('🧹 Massa de teste sintética removida (alunos/professores/ofertas/notas/processos/documentos/contratos/avisos/períodos de teste).');
}

/**
 * Remove os 3 cursos de teste genéricos antigos (Direito/Gestão Pública/
 * Administração — códigos DIR2024/GESPUB2024/ADM2024) e toda a estrutura
 * que dependia deles (matrizes, disciplinas, ofertas, matrículas e o que
 * penduricava nelas). Antes de apagar, realoca qualquer Aluno/ProcessoSeletivo
 * que ainda aponte pra eles pro curso real de Direito da FIURJ — rede de
 * segurança que libera a FK pra podermos apagar os cursos antigos com
 * segurança, mesmo que não sobre nenhum aluno de teste pra realocar.
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
