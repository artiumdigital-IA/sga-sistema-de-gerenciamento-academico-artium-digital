-- Adiciona codigoLegado ao Aluno: preserva o código do aluno na planilha
-- financeira legada (Kirsch), separado do RA (que segue o padrão AAAA0001 do
-- sistema). Opcional e único -- nulo para alunos que não vieram de import legado.
ALTER TABLE "alunos" ADD COLUMN "codigoLegado" TEXT;
CREATE UNIQUE INDEX "alunos_codigoLegado_key" ON "alunos"("codigoLegado");
