-- CreateEnum
CREATE TYPE "TipoProcesso" AS ENUM ('VESTIBULAR', 'ENEM', 'SEGUNDA_GRADUACAO', 'TRANSFERENCIA_EXTERNA', 'TRANSFERENCIA_INTERNA');

-- CreateEnum
CREATE TYPE "StatusProcesso" AS ENUM ('ABERTO', 'ENCERRADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "StatusInscricao" AS ENUM ('INSCRITO', 'EM_ANALISE', 'APROVADO', 'REPROVADO', 'MATRICULADO', 'DESISTENTE');

-- CreateTable
CREATE TABLE "processos_seletivos" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" "TipoProcesso" NOT NULL,
    "cursoId" TEXT NOT NULL,
    "periodoLetivoId" TEXT NOT NULL,
    "vagas" INTEGER NOT NULL,
    "dataAbertura" TIMESTAMP(3) NOT NULL,
    "dataEncerramento" TIMESTAMP(3) NOT NULL,
    "status" "StatusProcesso" NOT NULL DEFAULT 'ABERTO',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "processos_seletivos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidatos" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefone" TEXT,
    "dataNascimento" TIMESTAMP(3) NOT NULL,
    "sexo" TEXT NOT NULL,
    "corRaca" TEXT,
    "nacionalidade" TEXT NOT NULL DEFAULT 'BRASILEIRA',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "candidatos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inscricoes" (
    "id" TEXT NOT NULL,
    "candidatoId" TEXT NOT NULL,
    "processoSeletivoId" TEXT NOT NULL,
    "status" "StatusInscricao" NOT NULL DEFAULT 'INSCRITO',
    "notaEnem" DECIMAL(65,30),
    "documentosOk" BOOLEAN NOT NULL DEFAULT false,
    "observacoes" TEXT,
    "alunoId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inscricoes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "candidatos_cpf_key" ON "candidatos"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "inscricoes_candidatoId_processoSeletivoId_key" ON "inscricoes"("candidatoId", "processoSeletivoId");

-- AddForeignKey
ALTER TABLE "processos_seletivos" ADD CONSTRAINT "processos_seletivos_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "cursos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "processos_seletivos" ADD CONSTRAINT "processos_seletivos_periodoLetivoId_fkey" FOREIGN KEY ("periodoLetivoId") REFERENCES "periodos_letivos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscricoes" ADD CONSTRAINT "inscricoes_candidatoId_fkey" FOREIGN KEY ("candidatoId") REFERENCES "candidatos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscricoes" ADD CONSTRAINT "inscricoes_processoSeletivoId_fkey" FOREIGN KEY ("processoSeletivoId") REFERENCES "processos_seletivos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
