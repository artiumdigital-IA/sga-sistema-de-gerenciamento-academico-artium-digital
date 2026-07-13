-- DropForeignKey
ALTER TABLE "bolsistas" DROP CONSTRAINT "bolsistas_alunoId_fkey";

-- DropForeignKey
ALTER TABLE "documentos_aluno" DROP CONSTRAINT "documentos_aluno_alunoId_fkey";

-- DropForeignKey
ALTER TABLE "fichas_saude" DROP CONSTRAINT "fichas_saude_alunoId_fkey";

-- DropForeignKey
ALTER TABLE "historico_situacao_vinculo" DROP CONSTRAINT "historico_situacao_vinculo_alunoId_fkey";

-- DropForeignKey
ALTER TABLE "materias_equiparadas" DROP CONSTRAINT "materias_equiparadas_alunoId_fkey";

-- DropForeignKey
ALTER TABLE "mensagens" DROP CONSTRAINT "mensagens_destinatarioId_fkey";

-- DropForeignKey
ALTER TABLE "mensagens" DROP CONSTRAINT "mensagens_remetenteId_fkey";

-- DropForeignKey
ALTER TABLE "notas_pauta" DROP CONSTRAINT "notas_pauta_matriculaDisciplinaId_fkey";

-- DropForeignKey
ALTER TABLE "observacoes_financeiras" DROP CONSTRAINT "observacoes_financeiras_alunoId_fkey";

-- DropForeignKey
ALTER TABLE "ocorrencias" DROP CONSTRAINT "ocorrencias_alunoId_fkey";

-- DropForeignKey
ALTER TABLE "parcelas" DROP CONSTRAINT "parcelas_contratoId_fkey";

-- DropForeignKey
ALTER TABLE "registros_frequencia" DROP CONSTRAINT "registros_frequencia_matriculaDisciplinaId_fkey";

-- DropIndex
DROP INDEX "eventos_calendario_periodoLetivoId_idx";

-- AddForeignKey
ALTER TABLE "registros_frequencia" ADD CONSTRAINT "registros_frequencia_matriculaDisciplinaId_fkey" FOREIGN KEY ("matriculaDisciplinaId") REFERENCES "matriculas_disciplinas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notas_pauta" ADD CONSTRAINT "notas_pauta_matriculaDisciplinaId_fkey" FOREIGN KEY ("matriculaDisciplinaId") REFERENCES "matriculas_disciplinas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parcelas" ADD CONSTRAINT "parcelas_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "contratos_matricula"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fichas_saude" ADD CONSTRAINT "fichas_saude_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "alunos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos_aluno" ADD CONSTRAINT "documentos_aluno_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "alunos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materias_equiparadas" ADD CONSTRAINT "materias_equiparadas_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "alunos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historico_situacao_vinculo" ADD CONSTRAINT "historico_situacao_vinculo_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "alunos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ocorrencias" ADD CONSTRAINT "ocorrencias_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "alunos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensagens" ADD CONSTRAINT "mensagens_remetenteId_fkey" FOREIGN KEY ("remetenteId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensagens" ADD CONSTRAINT "mensagens_destinatarioId_fkey" FOREIGN KEY ("destinatarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "observacoes_financeiras" ADD CONSTRAINT "observacoes_financeiras_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "alunos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bolsistas" ADD CONSTRAINT "bolsistas_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "alunos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
