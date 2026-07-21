-- AlterTable (ContaBancaria ganha campos CNAB, todos opcionais/com default)
ALTER TABLE "contas_bancarias" ADD COLUMN "cnabHabilitado"      BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "contas_bancarias" ADD COLUMN "codigoBancoFebraban" TEXT;
ALTER TABLE "contas_bancarias" ADD COLUMN "codigoCedente"       TEXT;
ALTER TABLE "contas_bancarias" ADD COLUMN "carteira"            TEXT;
ALTER TABLE "contas_bancarias" ADD COLUMN "variacaoCarteira"    TEXT;
ALTER TABLE "contas_bancarias" ADD COLUMN "layoutCnab"          TEXT;
ALTER TABLE "contas_bancarias" ADD COLUMN "sequencialRemessa"   INTEGER NOT NULL DEFAULT 0;

-- CreateEnum
CREATE TYPE "BancoCnab" AS ENUM ('ITAU', 'SAFRA', 'SANTANDER', 'CAIXA');

-- CreateEnum
CREATE TYPE "LayoutCnab" AS ENUM ('CNAB400', 'CNAB240');

-- CreateEnum
CREATE TYPE "StatusBoleto" AS ENUM ('EMITIDO', 'ENVIADO_REMESSA', 'REGISTRADO', 'LIQUIDADO', 'REJEITADO', 'CANCELADO', 'PROTESTADO');

-- CreateEnum
CREATE TYPE "StatusRemessa" AS ENUM ('GERADA', 'ENVIADA');

-- CreateEnum
CREATE TYPE "StatusOcorrenciaCnab" AS ENUM ('PROCESSADA', 'NAO_LOCALIZADO', 'ERRO');

-- AlterTable (converte a coluna de texto criada acima pro enum de verdade —
-- feito em duas etapas pra poder inserir a coluna antes do enum existir)
ALTER TABLE "contas_bancarias" ALTER COLUMN "layoutCnab" TYPE "LayoutCnab" USING "layoutCnab"::"LayoutCnab";

-- CreateTable
CREATE TABLE "boletos" (
    "id"              TEXT NOT NULL,
    "parcelaId"       TEXT NOT NULL,
    "contaBancariaId" TEXT NOT NULL,
    "banco"           "BancoCnab" NOT NULL,

    "nossoNumero"     TEXT NOT NULL,
    "carteira"        TEXT NOT NULL,
    "especie"         TEXT NOT NULL DEFAULT 'DM',
    "status"          "StatusBoleto" NOT NULL DEFAULT 'EMITIDO',

    "linhaDigitavel"  TEXT NOT NULL,
    "codigoBarras"    TEXT NOT NULL,

    "dataRegistro"    TIMESTAMP(3),
    "dataLiquidacao"  TIMESTAMP(3),
    "valorPago"       DECIMAL(10,2),
    "valorJuros"      DECIMAL(10,2),
    "valorMulta"      DECIMAL(10,2),
    "valorDesconto"   DECIMAL(10,2),

    "ultimaOcorrenciaCodigo"    TEXT,
    "ultimaOcorrenciaDescricao" TEXT,
    "motivoRejeicao"            TEXT,

    "criadoEm"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "boletos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "boletos_parcelaId_key" ON "boletos"("parcelaId");

-- CreateIndex
CREATE UNIQUE INDEX "boletos_nossoNumero_key" ON "boletos"("nossoNumero");

-- AddForeignKey
ALTER TABLE "boletos" ADD CONSTRAINT "boletos_parcelaId_fkey"
    FOREIGN KEY ("parcelaId") REFERENCES "parcelas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boletos" ADD CONSTRAINT "boletos_contaBancariaId_fkey"
    FOREIGN KEY ("contaBancariaId") REFERENCES "contas_bancarias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "remessas_cnab" (
    "id"                  TEXT NOT NULL,
    "contaBancariaId"     TEXT NOT NULL,
    "banco"               "BancoCnab" NOT NULL,
    "layout"              "LayoutCnab" NOT NULL,
    "sequencial"          INTEGER NOT NULL,
    "dataGeracao"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "quantidadeRegistros" INTEGER NOT NULL,
    "valorTotal"          DECIMAL(12,2) NOT NULL,
    "status"              "StatusRemessa" NOT NULL DEFAULT 'GERADA',
    "arquivoNome"         TEXT NOT NULL,
    "arquivoUrl"          TEXT NOT NULL,
    "usuarioId"           TEXT NOT NULL,

    CONSTRAINT "remessas_cnab_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "remessas_cnab" ADD CONSTRAINT "remessas_cnab_contaBancariaId_fkey"
    FOREIGN KEY ("contaBancariaId") REFERENCES "contas_bancarias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "remessas_cnab_itens" (
    "id"        TEXT NOT NULL,
    "remessaId" TEXT NOT NULL,
    "boletoId"  TEXT NOT NULL,
    "criadoEm"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "remessas_cnab_itens_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "remessas_cnab_itens" ADD CONSTRAINT "remessas_cnab_itens_remessaId_fkey"
    FOREIGN KEY ("remessaId") REFERENCES "remessas_cnab"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remessas_cnab_itens" ADD CONSTRAINT "remessas_cnab_itens_boletoId_fkey"
    FOREIGN KEY ("boletoId") REFERENCES "boletos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "retornos_cnab" (
    "id"                    TEXT NOT NULL,
    "contaBancariaId"       TEXT NOT NULL,
    "banco"                 "BancoCnab" NOT NULL,
    "nomeArquivoOriginal"   TEXT NOT NULL,
    "dataImportacao"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "quantidadeRegistros"   INTEGER NOT NULL,
    "valorTotalOcorrencias" DECIMAL(12,2) NOT NULL,
    "usuarioId"             TEXT NOT NULL,

    CONSTRAINT "retornos_cnab_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "retornos_cnab" ADD CONSTRAINT "retornos_cnab_contaBancariaId_fkey"
    FOREIGN KEY ("contaBancariaId") REFERENCES "contas_bancarias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "ocorrencias_cnab" (
    "id"        TEXT NOT NULL,
    "retornoId" TEXT NOT NULL,
    "boletoId"  TEXT,
    "nossoNumero" TEXT NOT NULL,

    "codigoOcorrencia"    TEXT NOT NULL,
    "descricaoOcorrencia" TEXT NOT NULL,
    "dataOcorrencia"      TIMESTAMP(3) NOT NULL,

    "valorPago"     DECIMAL(10,2),
    "valorJuros"    DECIMAL(10,2),
    "valorMulta"    DECIMAL(10,2),
    "valorDesconto" DECIMAL(10,2),

    "statusProcessamento" "StatusOcorrenciaCnab" NOT NULL,
    "mensagemErro"        TEXT,

    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ocorrencias_cnab_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ocorrencias_cnab" ADD CONSTRAINT "ocorrencias_cnab_retornoId_fkey"
    FOREIGN KEY ("retornoId") REFERENCES "retornos_cnab"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ocorrencias_cnab" ADD CONSTRAINT "ocorrencias_cnab_boletoId_fkey"
    FOREIGN KEY ("boletoId") REFERENCES "boletos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
