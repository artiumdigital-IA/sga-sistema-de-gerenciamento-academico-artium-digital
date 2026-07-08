ALTER TABLE "alunos" ADD COLUMN "codigoValidacaoCarteirinha" TEXT;
ALTER TABLE "alunos" ADD COLUMN "carteirinhaValidaAte" TIMESTAMP(3);

CREATE UNIQUE INDEX "alunos_codigoValidacaoCarteirinha_key" ON "alunos"("codigoValidacaoCarteirinha");
