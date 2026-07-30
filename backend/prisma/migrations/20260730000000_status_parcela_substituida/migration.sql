-- Adiciona o valor SUBSTITUIDA ao enum StatusParcela: representa uma
-- parcela substituída por outra via Acordo/renegociação entre as partes.
-- Achado na importação da planilha financeira legada: 1.894 parcelas
-- constavam "Quitado" (mapeadas para PAGO) mas tinham Valor Recebido = 0 --
-- na verdade foram substituídas, não pagas.
ALTER TYPE "StatusParcela" ADD VALUE IF NOT EXISTS 'SUBSTITUIDA';
