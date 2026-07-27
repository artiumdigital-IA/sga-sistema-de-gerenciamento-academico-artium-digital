-- CreateTable
CREATE TABLE "tipos_requerimento_catalogo" (
    "id"             TEXT NOT NULL,
    "nome"           TEXT NOT NULL,
    "prazoDias"      INTEGER,
    "local"          TEXT,
    "taxa"           DECIMAL(10,2) NOT NULL,
    "observacaoTaxa" TEXT,
    "ativo"          BOOLEAN NOT NULL DEFAULT true,
    "ordem"          INTEGER NOT NULL DEFAULT 0,
    "criadoEm"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm"   TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tipos_requerimento_catalogo_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "requerimentos" ADD COLUMN "tipoCatalogoId" TEXT;

-- AddForeignKey
ALTER TABLE "requerimentos" ADD CONSTRAINT "requerimentos_tipoCatalogoId_fkey"
    FOREIGN KEY ("tipoCatalogoId") REFERENCES "tipos_requerimento_catalogo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "requerimentos_tipoCatalogoId_idx" ON "requerimentos"("tipoCatalogoId");

-- Seed — tabela de preços oficial (levantada Jul/2026), campo "Local" fica em
-- branco de propósito (a fonte original não tinha esse dado preenchido).
INSERT INTO "tipos_requerimento_catalogo" ("id", "nome", "prazoDias", "taxa", "observacaoTaxa", "ordem", "atualizadoEm") VALUES
(gen_random_uuid(), 'Aproveitamento de Estudos (preencher quadro aproveitamento de estudos)', 10, 150.00, 'POR DISCIPLINA', 10, NOW()),
(gen_random_uuid(), 'Aproveitamento de Estudos por Reingresso (preencher quadro aproveitamento de estudos)', NULL, 100.00, 'POR DISCIPLINA', 20, NOW()),
(gen_random_uuid(), 'Atestado de Frequência', 3, 50.00, NULL, 30, NOW()),
(gen_random_uuid(), 'Cartão Seguro Escolar 2ª Via', 10, 50.00, NULL, 40, NOW()),
(gen_random_uuid(), 'Carteirinha Biblioteca 2ª Via', 10, 50.00, NULL, 50, NOW()),
(gen_random_uuid(), 'Carteirinha Estudantil FIURJ 2ª Via', 10, 50.00, NULL, 60, NOW()),
(gen_random_uuid(), 'Crachá de Estágio Supervisionado 2ª Via', 10, 50.00, NULL, 70, NOW()),
(gen_random_uuid(), 'Declaração de Frequência', 5, 80.00, NULL, 80, NOW()),
(gen_random_uuid(), 'Declaração de Matrícula', 5, 80.00, NULL, 90, NOW()),
(gen_random_uuid(), 'Extraordinário Aproveitamento de Estudos Art. XX Regimento Geral FIURJ', 15, 300.00, 'POR DISCIPLINA', 100, NOW()),
(gen_random_uuid(), 'Histórico Escolar', 10, 150.00, NULL, 110, NOW()),
(gen_random_uuid(), 'Multa da Biblioteca Diária - Armário', NULL, 20.00, NULL, 120, NOW()),
(gen_random_uuid(), 'Multa da Biblioteca Diária – Material/Livros', NULL, 10.00, 'POR LIVRO', 130, NOW()),
(gen_random_uuid(), 'Programa de Componente Curricular/Disciplina (Ementas)', 10, 100.00, 'POR DISCIPLINA', 140, NOW()),
(gen_random_uuid(), 'Prova Repositiva / Substitutiva', NULL, 200.00, NULL, 150, NOW()),
(gen_random_uuid(), 'Recontagem de Faltas', 5, 50.00, NULL, 160, NOW()),
(gen_random_uuid(), 'Renovação de Matrícula Fora de Prazo', NULL, 200.00, NULL, 170, NOW()),
(gen_random_uuid(), 'Revisão de Nota – (Banca)', NULL, 100.00, NULL, 180, NOW()),
(gen_random_uuid(), 'Solicitação de Certificado de Pós Graduação 2ª Via (anexar cópia de Boletim de Ocorrência Policial)', NULL, 500.00, NULL, 190, NOW()),
(gen_random_uuid(), 'Solicitação de Diploma 2ª Via (anexar cópia de Boletim de Ocorrência Policial)', NULL, 500.00, NULL, 200, NOW());
