-- CreateEnum
CREATE TYPE "StatusContrato" AS ENUM ('ATIVO', 'SUSPENSO', 'CANCELADO', 'ENCERRADO');

-- CreateEnum
CREATE TYPE "StatusParcela" AS ENUM ('PENDENTE', 'PAGO', 'VENCIDO', 'CANCELADO');

-- CreateTable
CREATE TABLE "contratos_matricula" (
    "id"              TEXT NOT NULL,
    "alunoId"         TEXT NOT NULL,
    "periodoLetivoId" TEXT NOT NULL,
    "valorTotal"      DECIMAL(10,2) NOT NULL,
    "numeroParcelas"  INTEGER NOT NULL,
    "diaVencimento"   INTEGER NOT NULL,
    "status"          "StatusContrato" NOT NULL DEFAULT 'ATIVO',
    "observacoes"     TEXT,
    "criadoEm"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm"    TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contratos_matricula_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parcelas" (
    "id"             TEXT NOT NULL,
    "contratoId"     TEXT NOT NULL,
    "numero"         INTEGER NOT NULL,
    "valor"          DECIMAL(10,2) NOT NULL,
    "dataVencimento" DATE NOT NULL,
    "dataPagamento"  DATE,
    "valorPago"      DECIMAL(10,2),
    "status"         "StatusParcela" NOT NULL DEFAULT 'PENDENTE',
    "formaPagamento" TEXT,
    "observacoes"    TEXT,
    "criadoEm"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm"  TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parcelas_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "contratos_matricula" ADD CONSTRAINT "contratos_matricula_alunoId_fkey"
    FOREIGN KEY ("alunoId") REFERENCES "alunos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contratos_matricula" ADD CONSTRAINT "contratos_matricula_periodoLetivoId_fkey"
    FOREIGN KEY ("periodoLetivoId") REFERENCES "periodos_letivos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parcelas" ADD CONSTRAINT "parcelas_contratoId_fkey"
    FOREIGN KEY ("contratoId") REFERENCES "contratos_matricula"("id") ON DELETE CASCADE ON UPDATE CASCADE;
