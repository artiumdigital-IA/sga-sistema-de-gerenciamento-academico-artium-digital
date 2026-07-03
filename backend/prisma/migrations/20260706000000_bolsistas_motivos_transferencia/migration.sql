-- CreateTable
CREATE TABLE "motivos_transferencia_cancelamento" (
    "id"           TEXT NOT NULL,
    "nome"         TEXT NOT NULL,
    "ativo"        BOOLEAN NOT NULL DEFAULT true,
    "criadoEm"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "motivos_transferencia_cancelamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bolsistas" (
    "id"           TEXT NOT NULL,
    "alunoId"      TEXT NOT NULL,
    "tipoBolsa"    TEXT NOT NULL,
    "percentual"   DECIMAL(5,2) NOT NULL,
    "dataInicio"   DATE NOT NULL,
    "dataFim"      DATE,
    "ativo"        BOOLEAN NOT NULL DEFAULT true,
    "observacoes"  TEXT,
    "criadoEm"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bolsistas_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "bolsistas" ADD CONSTRAINT "bolsistas_alunoId_fkey"
    FOREIGN KEY ("alunoId") REFERENCES "alunos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
