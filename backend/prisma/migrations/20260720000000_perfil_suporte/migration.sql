-- AlterEnum
-- Renomeia o perfil MANUTENCAO para SUPORTE (alinha com o nome já usado em
-- todo o resto do módulo: ApiTags "Suporte — Chamados de Manutenção",
-- rotas /dashboard/suporte/..., etc.). RENAME VALUE preserva os usuários e
-- registros de PermissaoTela que já usam esse perfil -- só o rótulo do
-- enum muda, o valor armazenado continua o mesmo internamente.
ALTER TYPE "Perfil" RENAME VALUE 'MANUTENCAO' TO 'SUPORTE';
