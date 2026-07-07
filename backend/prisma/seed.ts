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
