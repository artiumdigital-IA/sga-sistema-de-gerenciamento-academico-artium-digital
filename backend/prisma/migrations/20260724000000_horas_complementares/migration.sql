-- AlterTable
ALTER TABLE "cursos" ADD COLUMN "cargaHorariaComplementarObrigatoria" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "horas_complementares" (
    "id"          TEXT NOT NULL,
    "alunoId"     TEXT NOT NULL,
    "professorId" TEXT NOT NULL,
    "horas"       INTEGER NOT NULL,
    "nomeArquivo" TEXT NOT NULL,
    "url"         TEXT NOT NULL,
    "tamanho"     INTEGER NOT NULL,
    "observacoes" TEXT,
    "criadoEm"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "horas_complementares_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "horas_complementares" ADD CONSTRAINT "horas_complementares_alunoId_fkey"
    FOREIGN KEY ("alunoId") REFERENCES "alunos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "horas_complementares" ADD CONSTRAINT "horas_complementares_professorId_fkey"
    FOREIGN KEY ("professorId") REFERENCES "professores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
