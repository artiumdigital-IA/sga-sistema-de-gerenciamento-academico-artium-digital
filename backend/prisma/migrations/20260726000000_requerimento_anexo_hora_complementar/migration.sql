-- AlterTable
ALTER TABLE "requerimentos" ADD COLUMN "arquivoNome" TEXT;
ALTER TABLE "requerimentos" ADD COLUMN "arquivoUrl" TEXT;
ALTER TABLE "requerimentos" ADD COLUMN "arquivoTamanho" INTEGER;

-- AlterTable
ALTER TABLE "tipos_requerimento_catalogo" ADD COLUMN "exigeAnexo" BOOLEAN NOT NULL DEFAULT false;

-- Seed — "Hora Complementar" é gratuito e exige anexo do certificado (foto/PDF)
-- ao solicitar (ver DiscenteController.abrirRequerimento).
INSERT INTO "tipos_requerimento_catalogo" ("id", "nome", "prazoDias", "taxa", "exigeAnexo", "ordem", "atualizadoEm") VALUES
(gen_random_uuid(), 'Hora Complementar', NULL, 0.00, true, 115, NOW());
