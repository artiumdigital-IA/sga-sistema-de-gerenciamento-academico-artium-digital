-- AlterTable
ALTER TABLE "emprestimos_biblioteca" ADD COLUMN "usoInstitucional" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "emprestimos_biblioteca" ADD COLUMN "usoPorAluno" BOOLEAN NOT NULL DEFAULT false;
