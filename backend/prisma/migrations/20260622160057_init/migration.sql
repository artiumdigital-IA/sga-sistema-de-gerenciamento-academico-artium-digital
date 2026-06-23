-- CreateEnum
CREATE TYPE "Grau" AS ENUM ('BACHARELADO', 'LICENCIATURA', 'TECNOLOGO');

-- CreateEnum
CREATE TYPE "Modalidade" AS ENUM ('PRESENCIAL', 'EAD', 'SEMIPRESENCIAL');

-- CreateEnum
CREATE TYPE "Turno" AS ENUM ('MANHA', 'TARDE', 'NOITE', 'INTEGRAL');

-- CreateEnum
CREATE TYPE "Sexo" AS ENUM ('MASCULINO', 'FEMININO', 'NAO_DECLARADO');

-- CreateEnum
CREATE TYPE "CorRaca" AS ENUM ('BRANCA', 'PRETA', 'PARDA', 'AMARELA', 'INDIGENA', 'NAO_DECLARADO');

-- CreateEnum
CREATE TYPE "FormaIngresso" AS ENUM ('VESTIBULAR', 'ENEM', 'TRANSFERENCIA_EXTERNA', 'TRANSFERENCIA_INTERNA', 'PORTADOR_DIPLOMA', 'CONVENIO', 'OUTRO');

-- CreateEnum
CREATE TYPE "SituacaoVinculo" AS ENUM ('CURSANDO', 'TRANCADO', 'FORMADO', 'EVADIDO', 'TRANSFERIDO_OUT', 'FALECIDO');

-- CreateEnum
CREATE TYPE "Titulacao" AS ENUM ('GRADUADO', 'ESPECIALISTA', 'MESTRE', 'DOUTOR', 'POS_DOUTOR');

-- CreateEnum
CREATE TYPE "RegimeTrabalho" AS ENUM ('HORISTA', 'PARCIAL', 'INTEGRAL');

-- CreateEnum
CREATE TYPE "CursoStatus" AS ENUM ('ATIVO', 'ENCERRADO');

-- CreateEnum
CREATE TYPE "MatrizStatus" AS ENUM ('VIGENTE', 'ENCERRADA');

-- CreateEnum
CREATE TYPE "Semestre" AS ENUM ('S1', 'S2');

-- CreateEnum
CREATE TYPE "PeriodoStatus" AS ENUM ('PLANEJADO', 'EM_ANDAMENTO', 'ENCERRADO');

-- CreateEnum
CREATE TYPE "MatriculaStatus" AS ENUM ('MATRICULADO', 'APROVADO', 'REPROVADO', 'DEPENDENCIA', 'TRANCADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "AvaliacaoTipo" AS ENUM ('PROVA', 'TRABALHO', 'SEMINARIO', 'EXAME_FINAL', 'OUTRO');

-- CreateEnum
CREATE TYPE "SituacaoResultado" AS ENUM ('APROVADO', 'REPROVADO_NOTA', 'REPROVADO_FALTA', 'REPROVADO_NOTA_E_FALTA');

-- CreateEnum
CREATE TYPE "Perfil" AS ENUM ('ADMIN', 'SECRETARIA', 'FINANCEIRO', 'PROFESSOR', 'ALUNO');

-- CreateEnum
CREATE TYPE "UsuarioStatus" AS ENUM ('ATIVO', 'INATIVO', 'BLOQUEADO');

-- CreateTable
CREATE TABLE "cursos" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "grau" "Grau" NOT NULL,
    "modalidade" "Modalidade" NOT NULL,
    "codigoEmec" TEXT NOT NULL,
    "cargaHorariaTotal" INTEGER NOT NULL,
    "prazoIntegralizacaoSemestres" INTEGER NOT NULL,
    "status" "CursoStatus" NOT NULL DEFAULT 'ATIVO',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cursos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matrizes_curriculares" (
    "id" TEXT NOT NULL,
    "cursoId" TEXT NOT NULL,
    "versao" TEXT NOT NULL,
    "anoVigencia" INTEGER NOT NULL,
    "status" "MatrizStatus" NOT NULL DEFAULT 'VIGENTE',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "matrizes_curriculares_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disciplinas" (
    "id" TEXT NOT NULL,
    "matrizCurricularId" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cargaHoraria" INTEGER NOT NULL,
    "creditos" INTEGER NOT NULL,
    "ementa" TEXT,
    "periodoSugerido" INTEGER NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "disciplinas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disciplinas_prerequisitos" (
    "id" TEXT NOT NULL,
    "disciplinaId" TEXT NOT NULL,
    "prerequisitoId" TEXT NOT NULL,

    CONSTRAINT "disciplinas_prerequisitos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "periodos_letivos" (
    "id" TEXT NOT NULL,
    "ano" INTEGER NOT NULL,
    "semestre" "Semestre" NOT NULL,
    "dataInicio" DATE NOT NULL,
    "dataFim" DATE NOT NULL,
    "status" "PeriodoStatus" NOT NULL DEFAULT 'PLANEJADO',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "periodos_letivos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ofertas" (
    "id" TEXT NOT NULL,
    "disciplinaId" TEXT NOT NULL,
    "periodoLetivoId" TEXT NOT NULL,
    "professorId" TEXT NOT NULL,
    "vagas" INTEGER NOT NULL,
    "turno" "Turno" NOT NULL,
    "horario" TEXT,
    "sala" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ofertas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alunos" (
    "id" TEXT NOT NULL,
    "cursoId" TEXT NOT NULL,
    "matrizCurricularId" TEXT NOT NULL,
    "ra" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "dataNascimento" DATE NOT NULL,
    "sexo" "Sexo" NOT NULL,
    "corRaca" "CorRaca" NOT NULL,
    "nacionalidade" TEXT NOT NULL,
    "formaIngresso" "FormaIngresso" NOT NULL,
    "dataIngresso" DATE NOT NULL,
    "situacaoVinculo" "SituacaoVinculo" NOT NULL DEFAULT 'CURSANDO',
    "email" TEXT NOT NULL,
    "telefone" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alunos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "professores" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "titulacao" "Titulacao" NOT NULL,
    "regimeTrabalho" "RegimeTrabalho" NOT NULL,
    "lattes" TEXT,
    "email" TEXT NOT NULL,
    "telefone" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "professores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matriculas_disciplinas" (
    "id" TEXT NOT NULL,
    "alunoId" TEXT NOT NULL,
    "ofertaId" TEXT NOT NULL,
    "status" "MatriculaStatus" NOT NULL DEFAULT 'MATRICULADO',
    "isDependencia" BOOLEAN NOT NULL DEFAULT false,
    "dataMatricula" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "matriculas_disciplinas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "avaliacoes" (
    "id" TEXT NOT NULL,
    "matriculaDisciplinaId" TEXT NOT NULL,
    "tipo" "AvaliacaoTipo" NOT NULL,
    "nota" DECIMAL(5,2) NOT NULL,
    "peso" DECIMAL(5,2) NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "avaliacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resultados_disciplinas" (
    "id" TEXT NOT NULL,
    "matriculaDisciplinaId" TEXT NOT NULL,
    "mediaFinal" DECIMAL(5,2) NOT NULL,
    "faltas" INTEGER NOT NULL,
    "frequenciaPercentual" DECIMAL(5,2) NOT NULL,
    "situacao" "SituacaoResultado" NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resultados_disciplinas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "perfil" "Perfil" NOT NULL,
    "mfaAtivo" BOOLEAN NOT NULL DEFAULT false,
    "mfaSegredo" TEXT,
    "status" "UsuarioStatus" NOT NULL DEFAULT 'ATIVO',
    "alunoId" TEXT,
    "professorId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auditorias" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT,
    "acao" TEXT NOT NULL,
    "entidade" TEXT NOT NULL,
    "entidadeId" TEXT,
    "dadosAntes" JSONB,
    "dadosDepois" JSONB,
    "ip" TEXT,
    "userAgent" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auditorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consentimentos_lgpd" (
    "id" TEXT NOT NULL,
    "alunoId" TEXT NOT NULL,
    "finalidade" TEXT NOT NULL,
    "concedido" BOOLEAN NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip" TEXT,

    CONSTRAINT "consentimentos_lgpd_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cursos_codigoEmec_key" ON "cursos"("codigoEmec");

-- CreateIndex
CREATE UNIQUE INDEX "matrizes_curriculares_cursoId_versao_key" ON "matrizes_curriculares"("cursoId", "versao");

-- CreateIndex
CREATE UNIQUE INDEX "disciplinas_matrizCurricularId_codigo_key" ON "disciplinas"("matrizCurricularId", "codigo");

-- CreateIndex
CREATE UNIQUE INDEX "disciplinas_prerequisitos_disciplinaId_prerequisitoId_key" ON "disciplinas_prerequisitos"("disciplinaId", "prerequisitoId");

-- CreateIndex
CREATE UNIQUE INDEX "periodos_letivos_ano_semestre_key" ON "periodos_letivos"("ano", "semestre");

-- CreateIndex
CREATE UNIQUE INDEX "alunos_ra_key" ON "alunos"("ra");

-- CreateIndex
CREATE UNIQUE INDEX "alunos_cpf_key" ON "alunos"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "alunos_email_key" ON "alunos"("email");

-- CreateIndex
CREATE UNIQUE INDEX "professores_cpf_key" ON "professores"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "professores_email_key" ON "professores"("email");

-- CreateIndex
CREATE UNIQUE INDEX "matriculas_disciplinas_alunoId_ofertaId_key" ON "matriculas_disciplinas"("alunoId", "ofertaId");

-- CreateIndex
CREATE UNIQUE INDEX "resultados_disciplinas_matriculaDisciplinaId_key" ON "resultados_disciplinas"("matriculaDisciplinaId");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_alunoId_key" ON "usuarios"("alunoId");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_professorId_key" ON "usuarios"("professorId");

-- CreateIndex
CREATE INDEX "auditorias_entidade_entidadeId_idx" ON "auditorias"("entidade", "entidadeId");

-- CreateIndex
CREATE INDEX "auditorias_usuarioId_idx" ON "auditorias"("usuarioId");

-- CreateIndex
CREATE INDEX "auditorias_criadoEm_idx" ON "auditorias"("criadoEm");

-- AddForeignKey
ALTER TABLE "matrizes_curriculares" ADD CONSTRAINT "matrizes_curriculares_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "cursos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disciplinas" ADD CONSTRAINT "disciplinas_matrizCurricularId_fkey" FOREIGN KEY ("matrizCurricularId") REFERENCES "matrizes_curriculares"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disciplinas_prerequisitos" ADD CONSTRAINT "disciplinas_prerequisitos_disciplinaId_fkey" FOREIGN KEY ("disciplinaId") REFERENCES "disciplinas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disciplinas_prerequisitos" ADD CONSTRAINT "disciplinas_prerequisitos_prerequisitoId_fkey" FOREIGN KEY ("prerequisitoId") REFERENCES "disciplinas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ofertas" ADD CONSTRAINT "ofertas_disciplinaId_fkey" FOREIGN KEY ("disciplinaId") REFERENCES "disciplinas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ofertas" ADD CONSTRAINT "ofertas_periodoLetivoId_fkey" FOREIGN KEY ("periodoLetivoId") REFERENCES "periodos_letivos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ofertas" ADD CONSTRAINT "ofertas_professorId_fkey" FOREIGN KEY ("professorId") REFERENCES "professores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alunos" ADD CONSTRAINT "alunos_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "cursos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alunos" ADD CONSTRAINT "alunos_matrizCurricularId_fkey" FOREIGN KEY ("matrizCurricularId") REFERENCES "matrizes_curriculares"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matriculas_disciplinas" ADD CONSTRAINT "matriculas_disciplinas_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "alunos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matriculas_disciplinas" ADD CONSTRAINT "matriculas_disciplinas_ofertaId_fkey" FOREIGN KEY ("ofertaId") REFERENCES "ofertas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avaliacoes" ADD CONSTRAINT "avaliacoes_matriculaDisciplinaId_fkey" FOREIGN KEY ("matriculaDisciplinaId") REFERENCES "matriculas_disciplinas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resultados_disciplinas" ADD CONSTRAINT "resultados_disciplinas_matriculaDisciplinaId_fkey" FOREIGN KEY ("matriculaDisciplinaId") REFERENCES "matriculas_disciplinas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "alunos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_professorId_fkey" FOREIGN KEY ("professorId") REFERENCES "professores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditorias" ADD CONSTRAINT "auditorias_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consentimentos_lgpd" ADD CONSTRAINT "consentimentos_lgpd_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "alunos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
