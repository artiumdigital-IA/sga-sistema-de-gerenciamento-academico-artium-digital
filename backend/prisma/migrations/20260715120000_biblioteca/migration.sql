-- CreateEnum
CREATE TYPE "StatusItemBiblioteca" AS ENUM ('DISPONIVEL', 'EMPRESTADO', 'MANUTENCAO', 'EXTRAVIADO', 'BAIXADO');

-- CreateEnum
CREATE TYPE "TipoEquipamento" AS ENUM ('COMPUTADOR', 'NOTEBOOK', 'TABLET', 'OUTRO');

-- CreateEnum
CREATE TYPE "TipoItemEmprestimo" AS ENUM ('LIVRO', 'EQUIPAMENTO');

-- CreateEnum
CREATE TYPE "StatusEmprestimo" AS ENUM ('EM_ANDAMENTO', 'DEVOLVIDO', 'PERDIDO');

-- CreateTable
CREATE TABLE "livros" (
    "id"            TEXT NOT NULL,
    "titulo"        TEXT NOT NULL,
    "autor"         TEXT NOT NULL,
    "editora"       TEXT,
    "isbn"          TEXT,
    "categoria"     TEXT,
    "anoPublicacao" INTEGER,
    "criadoEm"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm"  TIMESTAMP(3) NOT NULL,

    CONSTRAINT "livros_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exemplares_livro" (
    "id"               TEXT NOT NULL,
    "livroId"          TEXT NOT NULL,
    "codigoTombamento" TEXT NOT NULL,
    "localizacao"      TEXT,
    "status"           "StatusItemBiblioteca" NOT NULL DEFAULT 'DISPONIVEL',
    "criadoEm"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm"     TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exemplares_livro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipamentos_biblioteca" (
    "id"           TEXT NOT NULL,
    "patrimonio"   TEXT NOT NULL,
    "tipo"         "TipoEquipamento" NOT NULL,
    "modelo"       TEXT NOT NULL,
    "numeroSerie"  TEXT,
    "status"       "StatusItemBiblioteca" NOT NULL DEFAULT 'DISPONIVEL',
    "observacoes"  TEXT,
    "criadoEm"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "equipamentos_biblioteca_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emprestimos_biblioteca" (
    "id"                    TEXT NOT NULL,
    "tipoItem"              "TipoItemEmprestimo" NOT NULL,
    "exemplarLivroId"       TEXT,
    "equipamentoId"         TEXT,
    "usuarioId"             TEXT NOT NULL,
    "dataEmprestimo"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataPrevistaDevolucao" TIMESTAMP(3) NOT NULL,
    "dataDevolucao"         TIMESTAMP(3),
    "status"                "StatusEmprestimo" NOT NULL DEFAULT 'EM_ANDAMENTO',
    "observacoes"           TEXT,
    "registradoPorId"       TEXT,
    "criadoEm"              TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm"          TIMESTAMP(3) NOT NULL,

    CONSTRAINT "emprestimos_biblioteca_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "exemplares_livro_codigoTombamento_key" ON "exemplares_livro"("codigoTombamento");

-- CreateIndex
CREATE UNIQUE INDEX "equipamentos_biblioteca_patrimonio_key" ON "equipamentos_biblioteca"("patrimonio");

-- CreateIndex
CREATE INDEX "emprestimos_biblioteca_usuarioId_idx" ON "emprestimos_biblioteca"("usuarioId");

-- CreateIndex
CREATE INDEX "emprestimos_biblioteca_status_idx" ON "emprestimos_biblioteca"("status");

-- AddForeignKey
ALTER TABLE "exemplares_livro" ADD CONSTRAINT "exemplares_livro_livroId_fkey"
    FOREIGN KEY ("livroId") REFERENCES "livros"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emprestimos_biblioteca" ADD CONSTRAINT "emprestimos_biblioteca_exemplarLivroId_fkey"
    FOREIGN KEY ("exemplarLivroId") REFERENCES "exemplares_livro"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emprestimos_biblioteca" ADD CONSTRAINT "emprestimos_biblioteca_equipamentoId_fkey"
    FOREIGN KEY ("equipamentoId") REFERENCES "equipamentos_biblioteca"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emprestimos_biblioteca" ADD CONSTRAINT "emprestimos_biblioteca_usuarioId_fkey"
    FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
