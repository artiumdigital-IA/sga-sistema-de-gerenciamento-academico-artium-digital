-- Calendario Academico: campos de metadata em periodos_letivos + tabela de eventos/marcos

ALTER TABLE "periodos_letivos" ADD COLUMN "semanasLetivas" INTEGER;
ALTER TABLE "periodos_letivos" ADD COLUMN "diasLetivos" INTEGER;

CREATE TABLE "eventos_calendario" (
    "id" TEXT NOT NULL,
    "periodoLetivoId" TEXT NOT NULL,
    "grupo" TEXT,
    "titulo" TEXT NOT NULL,
    "dataInicio" DATE NOT NULL,
    "dataFim" DATE,
    "observacoes" TEXT,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "eventos_calendario_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "eventos_calendario_periodoLetivoId_idx" ON "eventos_calendario"("periodoLetivoId");

ALTER TABLE "eventos_calendario" ADD CONSTRAINT "eventos_calendario_periodoLetivoId_fkey"
  FOREIGN KEY ("periodoLetivoId") REFERENCES "periodos_letivos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
