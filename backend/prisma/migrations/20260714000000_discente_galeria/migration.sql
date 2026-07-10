ALTER TABLE "configuracao_visual" ADD COLUMN IF NOT EXISTS "galeriaPublicidade" JSONB NOT NULL DEFAULT '[]';
