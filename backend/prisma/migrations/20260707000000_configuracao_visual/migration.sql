-- CreateTable
CREATE TABLE "configuracao_visual" (
    "id"              TEXT NOT NULL DEFAULT 'default',
    "nomeInstituicao" TEXT NOT NULL DEFAULT 'FIURJ',
    "nomeCompleto"    TEXT NOT NULL DEFAULT 'FIURJ — Faculdade Instituto Universitário do Rio de Janeiro',
    "logoUrl"         TEXT,
    "simboloUrl"      TEXT,
    "corPrimaria"     TEXT NOT NULL DEFAULT '#1C3A6B',
    "corSecundaria"   TEXT NOT NULL DEFAULT '#C8102E',
    "criadoEm"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm"    TIMESTAMP(3) NOT NULL,

    CONSTRAINT "configuracao_visual_pkey" PRIMARY KEY ("id")
);

-- Linha singleton inicial — mantém os valores atuais da FIURJ como default
-- pra não quebrar o deploy existente; ADMIN troca depois pela tela nova.
INSERT INTO "configuracao_visual" ("id", "atualizadoEm") VALUES ('default', CURRENT_TIMESTAMP);
