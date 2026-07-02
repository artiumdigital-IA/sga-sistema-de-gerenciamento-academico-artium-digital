-- CreateEnum
CREATE TYPE "TipoContaBancaria" AS ENUM ('CORRENTE', 'POUPANCA', 'PAGAMENTO');

-- CreateTable
CREATE TABLE "fichas_saude" (
    "id"                        TEXT NOT NULL,
    "alunoId"                   TEXT NOT NULL,
    "tipoSanguineo"             TEXT,
    "alergias"                  TEXT,
    "medicamentosUso"           TEXT,
    "deficiencia"               TEXT,
    "planoSaude"                TEXT,
    "contatoEmergenciaNome"     TEXT,
    "contatoEmergenciaTelefone" TEXT,
    "observacoes"               TEXT,
    "criadoEm"                  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm"              TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fichas_saude_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contas_bancarias" (
    "id"             TEXT NOT NULL,
    "banco"          TEXT NOT NULL,
    "agencia"        TEXT NOT NULL,
    "numeroConta"    TEXT NOT NULL,
    "tipoConta"      "TipoContaBancaria" NOT NULL DEFAULT 'CORRENTE',
    "titular"        TEXT NOT NULL,
    "cnpjCpfTitular" TEXT,
    "saldoInicial"   DECIMAL(12,2) NOT NULL DEFAULT 0,
    "ativa"          BOOLEAN NOT NULL DEFAULT true,
    "observacoes"    TEXT,
    "criadoEm"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm"   TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contas_bancarias_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "fichas_saude_alunoId_key" ON "fichas_saude"("alunoId");

-- AddForeignKey
ALTER TABLE "fichas_saude" ADD CONSTRAINT "fichas_saude_alunoId_fkey"
    FOREIGN KEY ("alunoId") REFERENCES "alunos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
