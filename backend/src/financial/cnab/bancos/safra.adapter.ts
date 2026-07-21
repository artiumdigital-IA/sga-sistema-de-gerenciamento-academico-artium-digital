import { BancoCnab } from '@prisma/client';
import { criarAdapterCnab240 } from './cnab240-generico.adapter';

export const safraAdapter = criarAdapterCnab240({
  banco: BancoCnab.SAFRA,
  codigoBancoFebraban: '422',
  nomeBanco: 'BANCO SAFRA SA',
});
