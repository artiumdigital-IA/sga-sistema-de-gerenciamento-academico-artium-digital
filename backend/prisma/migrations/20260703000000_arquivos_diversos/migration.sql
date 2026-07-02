-- CreateTable
CREATE TABLE "documentos_aluno" (
    "id"          TEXT NOT NULL,
    "alunoId"     TEXT NOT NULL,
    "tipo"        TEXT NOT NULL,
    "nomeArquivo" TEXT NOT NULL,
    "url"         TEXT NOT NULL,
    "tamanho"     INTEGER NOT NULL,
    "criadoEm"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documentos_aluno_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "unidades" (
    "id"           TEXT NOT NULL,
    "nome"         TEXT NOT NULL,
    "cidade"       TEXT,
    "uf"           CHAR(2),
    "ativa"        BOOLEAN NOT NULL DEFAULT true,
    "criadoEm"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "unidades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias_receita" (
    "id"           TEXT NOT NULL,
    "nome"         TEXT NOT NULL,
    "descricao"    TEXT,
    "ativa"        BOOLEAN NOT NULL DEFAULT true,
    "criadoEm"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categorias_receita_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "materias_equiparadas" (
    "id"                 TEXT NOT NULL,
    "alunoId"            TEXT NOT NULL,
    "disciplinaId"       TEXT NOT NULL,
    "instituicaoOrigem"  TEXT NOT NULL,
    "disciplinaOrigem"   TEXT NOT NULL,
    "cargaHorariaOrigem" INTEGER,
    "dataAprovacao"      DATE NOT NULL,
    "observacoes"        TEXT,
    "criadoEm"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "materias_equiparadas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historico_situacao_vinculo" (
    "id"               TEXT NOT NULL,
    "alunoId"          TEXT NOT NULL,
    "situacaoAnterior" "SituacaoVinculo" NOT NULL,
    "situacaoNova"     "SituacaoVinculo" NOT NULL,
    "motivo"           TEXT,
    "data"             DATE NOT NULL,
    "usuarioId"        TEXT,
    "criadoEm"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historico_situacao_vinculo_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "documentos_aluno" ADD CONSTRAINT "documentos_aluno_alunoId_fkey"
    FOREIGN KEY ("alunoId") REFERENCES "alunos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materias_equiparadas" ADD CONSTRAINT "materias_equiparadas_alunoId_fkey"
    FOREIGN KEY ("alunoId") REFERENCES "alunos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materias_equiparadas" ADD CONSTRAINT "materias_equiparadas_disciplinaId_fkey"
    FOREIGN KEY ("disciplinaId") REFERENCES "disciplinas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historico_situacao_vinculo" ADD CONSTRAINT "historico_situacao_vinculo_alunoId_fkey"
    FOREIGN KEY ("alunoId") REFERENCES "alunos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
