-- CreateTable
CREATE TABLE "notas_pauta" (
    "id"                    TEXT NOT NULL,
    "matriculaDisciplinaId" TEXT NOT NULL,
    "av1"                   DECIMAL(4,2),
    "av2"                   DECIMAL(4,2),
    "av3"                   DECIMAL(4,2),
    "av4"                   DECIMAL(4,2),
    "av5"                   DECIMAL(4,2),
    "segundaChamada"        DECIMAL(4,2),
    "recuperacao"           DECIMAL(4,2),
    "faltas"                INTEGER NOT NULL DEFAULT 0,
    "criadoEm"              TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm"          TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notas_pauta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "notas_pauta_matriculaDisciplinaId_key" ON "notas_pauta"("matriculaDisciplinaId");

-- AddForeignKey
ALTER TABLE "notas_pauta" ADD CONSTRAINT "notas_pauta_matriculaDisciplinaId_fkey"
    FOREIGN KEY ("matriculaDisciplinaId") REFERENCES "matriculas_disciplinas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
