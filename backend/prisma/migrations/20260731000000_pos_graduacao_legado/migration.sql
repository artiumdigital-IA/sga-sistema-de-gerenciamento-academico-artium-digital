-- Histórico de Pós-Graduação legado (Kirsch, módulo "Outros Cursos") --
-- financeiro apenas, sem catálogo de cursos fabricado. Ver comentário no
-- schema.prisma (model MatriculaPosGraduacaoLegado) pra explicação da
-- decisão de guardar o nome do programa como texto livre.

CREATE TABLE "matriculas_pos_graduacao_legado" (
    "id"                 TEXT NOT NULL,
    "alunoId"            TEXT NOT NULL,
    "codigoCursoLegado"  TEXT NOT NULL,
    "nomeProgramaLegado" TEXT,
    "criadoEm"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm"       TIMESTAMP(3) NOT NULL,

    CONSTRAINT "matriculas_pos_graduacao_legado_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "matriculas_pos_graduacao_legado_alunoId_codigoCursoLegado_key"
    ON "matriculas_pos_graduacao_legado"("alunoId", "codigoCursoLegado");

ALTER TABLE "matriculas_pos_graduacao_legado"
    ADD CONSTRAINT "matriculas_pos_graduacao_legado_alunoId_fkey"
    FOREIGN KEY ("alunoId") REFERENCES "alunos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "parcelas_pos_graduacao_legado" (
    "id"             TEXT NOT NULL,
    "matriculaId"    TEXT NOT NULL,
    "numeroBoleto"   TEXT,
    "dataVencimento" DATE NOT NULL,
    "dataPagamento"  DATE,
    "valor"          DECIMAL(10,2) NOT NULL,
    "valorDesconto"  DECIMAL(10,2) NOT NULL DEFAULT 0,
    "valorJuros"     DECIMAL(10,2) NOT NULL DEFAULT 0,
    "status"         "StatusParcela" NOT NULL,
    "criadoEm"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm"   TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parcelas_pos_graduacao_legado_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "parcelas_pos_graduacao_legado"
    ADD CONSTRAINT "parcelas_pos_graduacao_legado_matriculaId_fkey"
    FOREIGN KEY ("matriculaId") REFERENCES "matriculas_pos_graduacao_legado"("id") ON DELETE CASCADE ON UPDATE CASCADE;
