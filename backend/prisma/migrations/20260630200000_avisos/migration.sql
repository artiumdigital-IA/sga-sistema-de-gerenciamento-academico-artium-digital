-- CreateEnum
CREATE TYPE "TagAviso" AS ENUM ('GERAL', 'IMPORTANTE', 'APENAS_EQUIPE');

-- CreateTable
CREATE TABLE "avisos" (
    "id"           TEXT NOT NULL,
    "titulo"       TEXT NOT NULL,
    "texto"        TEXT NOT NULL,
    "tag"          "TagAviso" NOT NULL DEFAULT 'GERAL',
    "autorNome"    TEXT NOT NULL,
    "autorId"      TEXT,
    "criadoEm"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "avisos_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "avisos" ADD CONSTRAINT "avisos_autorId_fkey"
    FOREIGN KEY ("autorId") REFERENCES "usuarios"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
