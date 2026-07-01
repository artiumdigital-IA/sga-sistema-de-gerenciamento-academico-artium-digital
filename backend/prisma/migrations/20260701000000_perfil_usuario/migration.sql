-- AlterTable: campos de perfil pessoal em Usuario (auto-servico via /usuarios/me)
ALTER TABLE "usuarios" ADD COLUMN "nome"     TEXT;
ALTER TABLE "usuarios" ADD COLUMN "telefone" TEXT;
ALTER TABLE "usuarios" ADD COLUMN "fotoUrl"  TEXT;
