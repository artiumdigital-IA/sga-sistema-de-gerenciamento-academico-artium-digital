-- Torna professorId opcional em horas_complementares — passa a aceitar
-- lançamento sem Professor vinculado, gerado pelo COORDENADOR ao deferir um
-- Requerimento de "Hora Complementar" (ver RequerimentoService.update()).
ALTER TABLE "horas_complementares" DROP CONSTRAINT "horas_complementares_professorId_fkey";
ALTER TABLE "horas_complementares" ALTER COLUMN "professorId" DROP NOT NULL;
ALTER TABLE "horas_complementares" ADD CONSTRAINT "horas_complementares_professorId_fkey"
    FOREIGN KEY ("professorId") REFERENCES "professores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Liga o lançamento ao Requerimento que o originou (só quando veio de uma
-- aprovação de Requerimento de Hora Complementar, não do lançamento direto
-- do professor via app mobile-docente).
ALTER TABLE "horas_complementares" ADD COLUMN "requerimentoId" TEXT;

CREATE UNIQUE INDEX "horas_complementares_requerimentoId_key" ON "horas_complementares"("requerimentoId");

ALTER TABLE "horas_complementares" ADD CONSTRAINT "horas_complementares_requerimentoId_fkey"
    FOREIGN KEY ("requerimentoId") REFERENCES "requerimentos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
