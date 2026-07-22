-- Adiciona suporte a enrollment de MFA (segredo pendente de confirmação + códigos de recuperação)
ALTER TABLE "usuarios" ADD COLUMN "mfaSegredoPendente" TEXT;
ALTER TABLE "usuarios" ADD COLUMN "mfaRecoveryCodes" TEXT[] NOT NULL DEFAULT '{}';
