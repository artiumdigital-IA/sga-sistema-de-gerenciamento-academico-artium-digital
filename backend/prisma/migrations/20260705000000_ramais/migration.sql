-- CreateTable
CREATE TABLE "ramais" (
    "id"           TEXT NOT NULL,
    "nome"         TEXT NOT NULL,
    "setor"        TEXT,
    "numero"       TEXT NOT NULL,
    "ativo"        BOOLEAN NOT NULL DEFAULT true,
    "criadoEm"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ramais_pkey" PRIMARY KEY ("id")
);
