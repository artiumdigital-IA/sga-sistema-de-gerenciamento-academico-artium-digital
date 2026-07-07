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
