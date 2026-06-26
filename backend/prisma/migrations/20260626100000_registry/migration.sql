-- CreateEnum
CREATE TYPE "TipoRequerimento" AS ENUM ('DECLARACAO_MATRICULA', 'HISTORICO_OFICIAL', 'TRANCAMENTO', 'CANCELAMENTO', 'REVISAO_NOTA', 'APROVEITAMENTO_DISCIPLINA', 'COLACAO_GRAU', 'OUTRO');

-- CreateEnum
CREATE TYPE "StatusRequerimento" AS ENUM ('ABERTO', 'EM_ANALISE', 'DEFERIDO', 'INDEFERIDO', 'CANCELADO');

-- CreateTable
CREATE TABLE "requerimentos" (
    "id" TEXT NOT NULL,
    "alunoId" TEXT NOT NULL,
    "tipo" "TipoRequerimento" NOT NULL,
    "descricao" TEXT,
    "status" "StatusRequerimento" NOT NULL DEFAULT 'ABERTO',
    "resposta" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "requerimentos_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "requerimentos" ADD CONSTRAINT "requerimentos_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "alunos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
