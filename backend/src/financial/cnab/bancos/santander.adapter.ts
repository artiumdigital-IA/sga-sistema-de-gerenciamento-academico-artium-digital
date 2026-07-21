import { BancoCnab } from '@prisma/client';
import { criarAdapterCnab240 } from './cnab240-generico.adapter';

export const santanderAdapter = criarAdapterCnab240({
  banco: BancoCnab.SANTANDER,
  codigoBancoFebraban: '033',
  nomeBanco: 'BANCO SANTANDER SA',
});
