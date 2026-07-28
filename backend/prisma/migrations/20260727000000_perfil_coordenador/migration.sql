-- AlterEnum
-- Novo perfil COORDENADOR (Jul/2026): acesso de leitura/escrita a Cursos,
-- Matrizes Curriculares, Disciplinas (incl. pré-requisitos), Ofertas e
-- Professores -- sem acesso a financeiro nem dados sensíveis de RH.
ALTER TYPE "Perfil" ADD VALUE IF NOT EXISTS 'COORDENADOR';
