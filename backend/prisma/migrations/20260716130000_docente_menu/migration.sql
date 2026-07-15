-- AlterTable
ALTER TABLE "avisos" ADD COLUMN "ofertaId" TEXT;

-- CreateTable
CREATE TABLE "capturas_prova" (
    "id"          TEXT NOT NULL,
    "alunoId"     TEXT NOT NULL,
    "ofertaId"    TEXT NOT NULL,
    "professorId" TEXT NOT NULL,
    "nomeArquivo" TEXT NOT NULL,
    "url"         TEXT NOT NULL,
    "tamanho"     INTEGER NOT NULL,
    "observacoes" TEXT,
    "criadoEm"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "capturas_prova_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "push_tokens" (
    "id"           TEXT NOT NULL,
    "usuarioId"    TEXT NOT NULL,
    "token"        TEXT NOT NULL,
    "plataforma"   TEXT,
    "criadoEm"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "push_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "push_tokens_token_key" ON "push_tokens"("token");

-- AddForeignKey
ALTER TABLE "avisos" ADD CONSTRAINT "avisos_ofertaId_fkey"
    FOREIGN KEY ("ofertaId") REFERENCES "ofertas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "capturas_prova" ADD CONSTRAINT "capturas_prova_alunoId_fkey"
    FOREIGN KEY ("alunoId") REFERENCES "alunos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "capturas_prova" ADD CONSTRAINT "capturas_prova_ofertaId_fkey"
    FOREIGN KEY ("ofertaId") REFERENCES "ofertas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "capturas_prova" ADD CONSTRAINT "capturas_prova_professorId_fkey"
    FOREIGN KEY ("professorId") REFERENCES "professores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "push_tokens" ADD CONSTRAINT "push_tokens_usuarioId_fkey"
    FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
