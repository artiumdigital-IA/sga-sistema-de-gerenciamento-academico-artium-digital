-- CreateEnum
CREATE TYPE "TipoVinculo" AS ENUM ('PRESTADOR_SERVICO', 'COLABORADOR');

-- CreateEnum
CREATE TYPE "StatusFolha" AS ENUM ('ABERTA', 'FECHADA', 'PAGA');

-- CreateEnum
CREATE TYPE "TipoLancamentoFolha" AS ENUM ('PROVENTO', 'DESCONTO');

-- CreateEnum
CREATE TYPE "StatusAcordoPagar" AS ENUM ('ATIVO', 'CONCLUIDO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "StatusParcelaPagar" AS ENUM ('PENDENTE', 'PAGO', 'VENCIDO', 'CANCELADO');

-- CreateTable
CREATE TABLE "dados_folha_professor" (
    "id"                TEXT NOT NULL,
    "professorId"       TEXT NOT NULL,
    "salarioBase"       DECIMAL(10,2) NOT NULL,
    "numeroDependentes" INTEGER NOT NULL DEFAULT 0,
    "dataAdmissao"      DATE NOT NULL,
    "dataDemissao"      DATE,
    "ativo"             BOOLEAN NOT NULL DEFAULT true,
    "criadoEm"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm"      TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dados_folha_professor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "dados_folha_professor_professorId_key" ON "dados_folha_professor"("professorId");

-- AddForeignKey
ALTER TABLE "dados_folha_professor" ADD CONSTRAINT "dados_folha_professor_professorId_fkey"
    FOREIGN KEY ("professorId") REFERENCES "professores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "colaboradores" (
    "id"                TEXT NOT NULL,
    "nome"              TEXT NOT NULL,
    "cpf"               TEXT NOT NULL,
    "email"             TEXT,
    "telefone"          TEXT,
    "tipoVinculo"       "TipoVinculo" NOT NULL,
    "cargo"             TEXT,
    "salarioBase"       DECIMAL(10,2),
    "numeroDependentes" INTEGER NOT NULL DEFAULT 0,
    "dataAdmissao"      DATE NOT NULL,
    "dataDemissao"      DATE,
    "ativo"             BOOLEAN NOT NULL DEFAULT true,
    "banco"             TEXT,
    "agencia"           TEXT,
    "contaBancaria"     TEXT,
    "observacoes"       TEXT,
    "criadoEm"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm"      TIMESTAMP(3) NOT NULL,

    CONSTRAINT "colaboradores_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "colaboradores_cpf_key" ON "colaboradores"("cpf");

-- CreateTable
CREATE TABLE "tabelas_inss" (
    "id"             TEXT NOT NULL,
    "vigenciaInicio" DATE NOT NULL,
    "ativa"          BOOLEAN NOT NULL DEFAULT true,
    "criadoEm"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm"   TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tabelas_inss_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faixas_inss" (
    "id"            TEXT NOT NULL,
    "tabelaId"      TEXT NOT NULL,
    "ordem"         INTEGER NOT NULL,
    "limiteInicial" DECIMAL(10,2) NOT NULL,
    "limiteFinal"   DECIMAL(10,2),
    "aliquota"      DECIMAL(5,2) NOT NULL,

    CONSTRAINT "faixas_inss_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "faixas_inss" ADD CONSTRAINT "faixas_inss_tabelaId_fkey"
    FOREIGN KEY ("tabelaId") REFERENCES "tabelas_inss"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "tabelas_irrf" (
    "id"                        TEXT NOT NULL,
    "vigenciaInicio"            DATE NOT NULL,
    "ativa"                     BOOLEAN NOT NULL DEFAULT true,
    "valorDeducaoPorDependente" DECIMAL(10,2) NOT NULL,
    "criadoEm"                  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm"              TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tabelas_irrf_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faixas_irrf" (
    "id"             TEXT NOT NULL,
    "tabelaId"       TEXT NOT NULL,
    "ordem"          INTEGER NOT NULL,
    "limiteInicial"  DECIMAL(10,2) NOT NULL,
    "limiteFinal"    DECIMAL(10,2),
    "aliquota"       DECIMAL(5,2) NOT NULL,
    "parcelaDeduzir" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "faixas_irrf_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "faixas_irrf" ADD CONSTRAINT "faixas_irrf_tabelaId_fkey"
    FOREIGN KEY ("tabelaId") REFERENCES "tabelas_irrf"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "folhas_pagamento" (
    "id"             TEXT NOT NULL,
    "competenciaMes" INTEGER NOT NULL,
    "competenciaAno" INTEGER NOT NULL,
    "status"         "StatusFolha" NOT NULL DEFAULT 'ABERTA',
    "dataFechamento" TIMESTAMP(3),
    "dataPagamento"  TIMESTAMP(3),
    "criadoEm"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm"   TIMESTAMP(3) NOT NULL,

    CONSTRAINT "folhas_pagamento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "folhas_pagamento_competenciaMes_competenciaAno_key" ON "folhas_pagamento"("competenciaMes", "competenciaAno");

-- CreateTable
CREATE TABLE "itens_folha" (
    "id"                   TEXT NOT NULL,
    "folhaId"              TEXT NOT NULL,
    "professorId"          TEXT,
    "colaboradorId"        TEXT,
    "salarioBase"          DECIMAL(10,2) NOT NULL,
    "totalProventos"       DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalDescontosOutros" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "inss"                 DECIMAL(10,2) NOT NULL DEFAULT 0,
    "irrf"                 DECIMAL(10,2) NOT NULL DEFAULT 0,
    "fgts"                 DECIMAL(10,2) NOT NULL DEFAULT 0,
    "salarioLiquido"       DECIMAL(10,2) NOT NULL,
    "status"               "StatusParcelaPagar" NOT NULL DEFAULT 'PENDENTE',
    "criadoEm"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm"         TIMESTAMP(3) NOT NULL,

    CONSTRAINT "itens_folha_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "itens_folha" ADD CONSTRAINT "itens_folha_folhaId_fkey"
    FOREIGN KEY ("folhaId") REFERENCES "folhas_pagamento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_folha" ADD CONSTRAINT "itens_folha_professorId_fkey"
    FOREIGN KEY ("professorId") REFERENCES "dados_folha_professor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_folha" ADD CONSTRAINT "itens_folha_colaboradorId_fkey"
    FOREIGN KEY ("colaboradorId") REFERENCES "colaboradores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "itens_folha_lancamentos" (
    "id"          TEXT NOT NULL,
    "itemFolhaId" TEXT NOT NULL,
    "tipo"        "TipoLancamentoFolha" NOT NULL,
    "descricao"   TEXT NOT NULL,
    "valor"       DECIMAL(10,2) NOT NULL,
    "criadoEm"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "itens_folha_lancamentos_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "itens_folha_lancamentos" ADD CONSTRAINT "itens_folha_lancamentos_itemFolhaId_fkey"
    FOREIGN KEY ("itemFolhaId") REFERENCES "itens_folha"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "pagamentos_prestador" (
    "id"               TEXT NOT NULL,
    "colaboradorId"    TEXT NOT NULL,
    "data"             DATE NOT NULL,
    "descricaoServico" TEXT NOT NULL,
    "numeroNotaFiscal" TEXT,
    "valorBruto"       DECIMAL(10,2) NOT NULL,
    "valorIssRetido"   DECIMAL(10,2),
    "valorLiquido"     DECIMAL(10,2) NOT NULL,
    "status"           "StatusParcelaPagar" NOT NULL DEFAULT 'PENDENTE',
    "criadoEm"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm"     TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pagamentos_prestador_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "pagamentos_prestador" ADD CONSTRAINT "pagamentos_prestador_colaboradorId_fkey"
    FOREIGN KEY ("colaboradorId") REFERENCES "colaboradores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "acordos_pagar" (
    "id"             TEXT NOT NULL,
    "fornecedorNome" TEXT NOT NULL,
    "cnpjCpf"        TEXT,
    "valorTotal"     DECIMAL(10,2) NOT NULL,
    "numeroParcelas" INTEGER NOT NULL,
    "diaVencimento"  INTEGER NOT NULL,
    "status"         "StatusAcordoPagar" NOT NULL DEFAULT 'ATIVO',
    "observacoes"    TEXT,
    "criadoEm"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm"   TIMESTAMP(3) NOT NULL,

    CONSTRAINT "acordos_pagar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parcelas_pagar" (
    "id"             TEXT NOT NULL,
    "acordoId"       TEXT NOT NULL,
    "numero"         INTEGER NOT NULL,
    "valor"          DECIMAL(10,2) NOT NULL,
    "dataVencimento" DATE NOT NULL,
    "dataPagamento"  DATE,
    "valorPago"      DECIMAL(10,2),
    "status"         "StatusParcelaPagar" NOT NULL DEFAULT 'PENDENTE',
    "formaPagamento" TEXT,
    "criadoEm"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm"   TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parcelas_pagar_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "parcelas_pagar" ADD CONSTRAINT "parcelas_pagar_acordoId_fkey"
    FOREIGN KEY ("acordoId") REFERENCES "acordos_pagar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "categorias_despesa" (
    "id"           TEXT NOT NULL,
    "nome"         TEXT NOT NULL,
    "descricao"    TEXT,
    "ativa"        BOOLEAN NOT NULL DEFAULT true,
    "criadoEm"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categorias_despesa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gastos_fixos" (
    "id"            TEXT NOT NULL,
    "categoriaId"   TEXT NOT NULL,
    "descricao"     TEXT NOT NULL,
    "valorMensal"   DECIMAL(10,2) NOT NULL,
    "diaVencimento" INTEGER NOT NULL,
    "ativo"         BOOLEAN NOT NULL DEFAULT true,
    "criadoEm"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm"  TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gastos_fixos_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "gastos_fixos" ADD CONSTRAINT "gastos_fixos_categoriaId_fkey"
    FOREIGN KEY ("categoriaId") REFERENCES "categorias_despesa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "gastos_variaveis" (
    "id"           TEXT NOT NULL,
    "categoriaId"  TEXT NOT NULL,
    "descricao"    TEXT NOT NULL,
    "valor"        DECIMAL(10,2) NOT NULL,
    "data"         DATE NOT NULL,
    "observacoes"  TEXT,
    "criadoEm"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gastos_variaveis_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "gastos_variaveis" ADD CONSTRAINT "gastos_variaveis_categoriaId_fkey"
    FOREIGN KEY ("categoriaId") REFERENCES "categorias_despesa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
