export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-brand-700">
          FIURJ — Plataforma Acadêmica
        </h1>
        <p className="mt-2 text-muted-foreground">
          Fase 0 · Fundação — esqueleto ativo ✅
        </p>
      </div>

      <div className="mt-6 rounded-lg border border-border bg-card p-6 text-sm text-card-foreground shadow-sm">
        <p className="font-medium">Próximos passos:</p>
        <ul className="mt-2 list-disc pl-5 space-y-1 text-muted-foreground">
          <li>Fase 1 — Cadastros base (cursos, matrizes, disciplinas)</li>
          <li>Fase 2 — Pessoas (alunos + professores)</li>
          <li>Fase 3 — Oferta e matrícula por disciplina</li>
          <li>Fase 4 — Diário, notas e histórico</li>
        </ul>
      </div>
    </main>
  );
}
