import { BancoCnab } from '@prisma/client';
import { CnabBankAdapter } from './cnab-bank-adapter.interface';
import { itauAdapter } from './itau.adapter';
import { safraAdapter } from './safra.adapter';
import { santanderAdapter } from './santander.adapter';
import { caixaAdapter } from './caixa.adapter';

export function resolveAdapter(banco: BancoCnab): CnabBankAdapter {
  switch (banco) {
    case BancoCnab.ITAU:
      return itauAdapter;
    case BancoCnab.SAFRA:
      return safraAdapter;
    case BancoCnab.SANTANDER:
      return santanderAdapter;
    case BancoCnab.CAIXA:
      return caixaAdapter;
    default:
      throw new Error(`Remessa/retorno CNAB ainda não implementado pro banco ${banco}.`);
  }
}
