-- AlterEnum
ALTER TYPE "Perfil" ADD VALUE 'MANUTENCAO';

-- CreateEnum
CREATE TYPE "PrioridadeChamado" AS ENUM ('BAIXA', 'MEDIA', 'ALTA', 'URGENTE');

-- CreateEnum
CREATE TYPE "StatusChamadoManutencao" AS ENUM ('ABERTO', 'EM_ANDAMENTO', 'CONCLUIDO', 'CANCELADO');

-- CreateTable
CREATE TABLE "tipos_chamado_manutencao" (
    "id"           TEXT NOT NULL,
    "nome"         TEXT NOT NULL,
    "ativo"        BOOLEAN NOT NULL DEFAULT true,
    "criadoEm"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tipos_chamado_manutencao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chamados_manutencao" (
    "id"            TEXT NOT NULL,
    "numero"        TEXT NOT NULL,
    "tipoId"        TEXT NOT NULL,
    "local"         TEXT NOT NULL,
    "prioridade"    "PrioridadeChamado" NOT NULL DEFAULT 'MEDIA',
    "titulo"        TEXT NOT NULL,
    "descricao"     TEXT,
    "status"        "StatusChamadoManutencao" NOT NULL DEFAULT 'ABERTO',
    "solicitanteId" TEXT NOT NULL,
    "responsavelId" TEXT,
    "dataAbertura"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataConclusao" TIMESTAMP(3),
    "criadoEm"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm"  TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chamados_manutencao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "chamados_manutencao_numero_key" ON "chamados_manutencao"("numero");

-- AddForeignKey
ALTER TABLE "chamados_manutencao" ADD CONSTRAINT "chamados_manutencao_tipoId_fkey"
    FOREIGN KEY ("tipoId") REFERENCES "tipos_chamado_manutencao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chamados_manutencao" ADD CONSTRAINT "chamados_manutencao_solicitanteId_fkey"
    FOREIGN KEY ("solicitanteId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chamados_manutencao" ADD CONSTRAINT "chamados_manutencao_responsavelId_fkey"
    FOREIGN KEY ("responsavelId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
