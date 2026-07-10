-- Extende o enum "Grau" para cobrir pós-graduação (lato sensu / stricto
-- sensu), além dos 3 graus de graduação já existentes (usados pelo Censo da
-- Educação Superior). Necessário para cadastrar os cursos reais de
-- mestrado (UAL/UPT), doutorado (USAL), pós-doutorado (USAL) e
-- especialização (FIURJ) no mesmo model Curso.
ALTER TYPE "Grau" ADD VALUE IF NOT EXISTS 'ESPECIALIZACAO';
ALTER TYPE "Grau" ADD VALUE IF NOT EXISTS 'MESTRADO';
ALTER TYPE "Grau" ADD VALUE IF NOT EXISTS 'DOUTORADO';
ALTER TYPE "Grau" ADD VALUE IF NOT EXISTS 'POS_DOUTORADO';
