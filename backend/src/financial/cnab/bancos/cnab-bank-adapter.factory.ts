import { BancoCnab } from '@prisma/client';
import { CnabBankAdapter } from './cnab-bank-adapter.interface';
import { itauAdapter } from './itau.adapter';

// Safra/Santander/Caixa (CNAB 240) ainda não têm adapter — Fase 4 do módulo
// CNAB. Resolver esses bancos aqui lança erro claro em vez de deixar a
// aplicação quebrar silenciosamente.
export function resolveAdapter(banco: BancoCnab): CnabBankAdapter {
  switch (banco) {
    case BancoCnab.ITAU:
      return itauAdapter;
    default:
      throw new Error(`Remessa/retorno CNAB ainda não implementado pro banco ${banco}.`);
  }
}
