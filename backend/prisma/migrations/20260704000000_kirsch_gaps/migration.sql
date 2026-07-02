-- CreateEnum
CREATE TYPE "StatusProtocolo" AS ENUM ('ABERTO', 'EM_ANDAMENTO', 'CONCLUIDO', 'CANCELADO');

-- CreateTable
CREATE TABLE "registros_frequencia" (
    "id"                    TEXT NOT NULL,
    "matriculaDisciplinaId" TEXT NOT NULL,
    "data"                  DATE NOT NULL,
    "quantidadeAulas"       INTEGER NOT NULL,
    "faltas"                INTEGER NOT NULL,
    "observacao"            TEXT,
    "criadoEm"              TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm"          TIMESTAMP(3) NOT NULL,

    CONSTRAINT "registros_frequencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tipos_protocolo" (
    "id"           TEXT NOT NULL,
    "nome"         TEXT NOT NULL,
    "ativo"        BOOLEAN NOT NULL DEFAULT true,
    "criadoEm"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tipos_protocolo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "protocolos" (
    "id"                TEXT NOT NULL,
    "numero"            TEXT NOT NULL,
    "tipoId"            TEXT NOT NULL,
    "alunoId"           TEXT,
    "assunto"           TEXT NOT NULL,
    "descricao"         TEXT,
    "status"            "StatusProtocolo" NOT NULL DEFAULT 'ABERTO',
    "dataAbertura"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataConclusao"     TIMESTAMP(3),
    "usuarioAberturaId" TEXT,
    "criadoEm"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm"      TIMESTAMP(3) NOT NULL,

    CONSTRAINT "protocolos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "motivos_ocorrencia" (
    "id"           TEXT NOT NULL,
    "nome"         TEXT NOT NULL,
    "ativo"        BOOLEAN NOT NULL DEFAULT true,
    "criadoEm"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "motivos_ocorrencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ocorrencias" (
    "id"        TEXT NOT NULL,
    "alunoId"   TEXT NOT NULL,
    "motivoId"  TEXT NOT NULL,
    "descricao" TEXT,
    "data"      DATE NOT NULL,
    "usuarioId" TEXT,
    "criadoEm"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ocorrencias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mensagens" (
    "id"             TEXT NOT NULL,
    "remetenteId"    TEXT NOT NULL,
    "destinatarioId" TEXT NOT NULL,
    "assunto"        TEXT NOT NULL,
    "corpo"          TEXT NOT NULL,
    "lida"           BOOLEAN NOT NULL DEFAULT false,
    "criadoEm"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mensagens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "observacoes_financeiras" (
    "id"         TEXT NOT NULL,
    "alunoId"    TEXT NOT NULL,
    "observacao" TEXT NOT NULL,
    "data"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuarioId"  TEXT,
    "criadoEm"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "observacoes_financeiras_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "registros_frequencia_matriculaDisciplinaId_data_key" ON "registros_frequencia"("matriculaDisciplinaId", "data");

-- CreateIndex
CREATE UNIQUE INDEX "protocolos_numero_key" ON "protocolos"("numero");

-- AddForeignKey
ALTER TABLE "registros_frequencia" ADD CONSTRAINT "registros_frequencia_matriculaDisciplinaId_fkey"
    FOREIGN KEY ("matriculaDisciplinaId") REFERENCES "matriculas_disciplinas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "protocolos" ADD CONSTRAINT "protocolos_tipoId_fkey"
    FOREIGN KEY ("tipoId") REFERENCES "tipos_protocolo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "protocolos" ADD CONSTRAINT "protocolos_alunoId_fkey"
    FOREIGN KEY ("alunoId") REFERENCES "alunos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ocorrencias" ADD CONSTRAINT "ocorrencias_alunoId_fkey"
    FOREIGN KEY ("alunoId") REFERENCES "alunos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ocorrencias" ADD CONSTRAINT "ocorrencias_motivoId_fkey"
    FOREIGN KEY ("motivoId") REFERENCES "motivos_ocorrencia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensagens" ADD CONSTRAINT "mensagens_remetenteId_fkey"
    FOREIGN KEY ("remetenteId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensagens" ADD CONSTRAINT "mensagens_destinatarioId_fkey"
    FOREIGN KEY ("destinatarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "observacoes_financeiras" ADD CONSTRAINT "observacoes_financeiras_alunoId_fkey"
    FOREIGN KEY ("alunoId") REFERENCES "alunos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
