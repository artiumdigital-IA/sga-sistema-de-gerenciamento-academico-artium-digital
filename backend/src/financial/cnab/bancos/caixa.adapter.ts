import { BancoCnab } from '@prisma/client';
import { criarAdapterCnab240 } from './cnab240-generico.adapter';

export const caixaAdapter = criarAdapterCnab240({
  banco: BancoCnab.CAIXA,
  codigoBancoFebraban: '104',
  nomeBanco: 'CAIXA ECONOMICA FEDERAL',
});
