-- CreateTable
CREATE TABLE "permissoes_tela" (
    "id" TEXT NOT NULL,
    "perfil" "Perfil" NOT NULL,
    "chaveTela" TEXT NOT NULL,
    "habilitada" BOOLEAN NOT NULL DEFAULT true,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permissoes_tela_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "permissoes_tela_perfil_chaveTela_key" ON "permissoes_tela"("perfil", "chaveTela");
