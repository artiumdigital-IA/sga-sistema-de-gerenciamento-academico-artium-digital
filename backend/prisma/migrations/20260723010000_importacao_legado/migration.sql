-- Fase 9: bookkeeping do módulo de análise de importação de dados legados
-- (não cria/altera nenhuma tabela de dado financeiro real)

CREATE TYPE "StatusImportacaoLegado" AS ENUM ('PROCESSANDO', 'CONCLUIDA', 'ERRO');

CREATE TYPE "StatusLinhaImportacao" AS ENUM ('PRONTA_CPF', 'SUGESTAO_NOME', 'SEM_CORRESPONDENCIA', 'DADO_INVALIDO');

CREATE TABLE "importacoes_legado" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "arquivoNome" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "status" "StatusImportacaoLegado" NOT NULL DEFAULT 'PROCESSANDO',
    "totalLinhasArquivo" INTEGER NOT NULL,
    "totalLinhasDetalhe" INTEGER NOT NULL,
    "linhasIgnoradasResumo" INTEGER NOT NULL,
    "resumo" JSONB,
    "iniciadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "concluidoEm" TIMESTAMP(3),
    "erro" TEXT,

    CONSTRAINT "importacoes_legado_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "importacoes_legado_linhas" (
    "id" TEXT NOT NULL,
    "importacaoId" TEXT NOT NULL,
    "numeroLinha" INTEGER NOT NULL,
    "dadosOriginais" JSONB NOT NULL,
    "status" "StatusLinhaImportacao" NOT NULL,
    "alunoEncontradoId" TEXT,
    "alunoSugeridoId" TEXT,
    "scoreSugestao" DOUBLE PRECISION,
    "anoInferido" INTEGER,
    "semestreInferido" TEXT,
    "motivoPendencia" TEXT,

    CONSTRAINT "importacoes_legado_linhas_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "importacoes_legado_linhas_importacaoId_status_idx" ON "importacoes_legado_linhas"("importacaoId", "status");

ALTER TABLE "importacoes_legado" ADD CONSTRAINT "importacoes_legado_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "importacoes_legado_linhas" ADD CONSTRAINT "importacoes_legado_linhas_importacaoId_fkey" FOREIGN KEY ("importacaoId") REFERENCES "importacoes_legado"("id") ON DELETE CASCADE ON UPDATE CASCADE;
