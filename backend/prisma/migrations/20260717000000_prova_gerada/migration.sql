-- CreateTable
CREATE TABLE "provas_geradas" (
    "id"          TEXT NOT NULL,
    "professorId" TEXT NOT NULL,
    "tipoProva"   TEXT NOT NULL,
    "curso"       TEXT NOT NULL,
    "disciplina"  TEXT NOT NULL,
    "turma"       TEXT NOT NULL,
    "data"        DATE NOT NULL,
    "observacoes" TEXT NOT NULL,
    "questoes"    JSONB NOT NULL,
    "criadoEm"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "provas_geradas_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "provas_geradas" ADD CONSTRAINT "provas_geradas_professorId_fkey" FOREIGN KEY ("professorId") REFERENCES "professores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
