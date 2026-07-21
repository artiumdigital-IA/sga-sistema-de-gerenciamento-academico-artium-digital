import { BancoCnab } from '@prisma/client';

// Código FEBRABAN de cada banco (3 dígitos) → enum interno. Usado pra
// resolver o banco a partir do que fica cadastrado em ContaBancaria.
const FEBRABAN_PARA_BANCO: Record<string, BancoCnab> = {
  '341': BancoCnab.ITAU,
  '422': BancoCnab.SAFRA,
  '033': BancoCnab.SANTANDER,
  '104': BancoCnab.CAIXA,
};

export function resolveBancoCnab(codigoBancoFebraban: string): BancoCnab {
  const banco = FEBRABAN_PARA_BANCO[codigoBancoFebraban];
  if (!banco) throw new Error(`Código de banco FEBRABAN não reconhecido: "${codigoBancoFebraban}".`);
  return banco;
}

// Bancos com adapter implementado. Itaú (CNAB 400) é o piloto — testado com
// auto-consistência (ver itau.adapter.ts). Safra/Santander/Caixa (CNAB 240,
// Fase 4) usam o adapter genérico cnab240-generico.adapter.ts, com
// confiança MENOR no layout exato (ver aviso no topo daquele arquivo) — não
// usar em produção sem validar contra o manual/homologação de cada banco.
export const BANCOS_IMPLEMENTADOS: BancoCnab[] = [BancoCnab.ITAU, BancoCnab.SAFRA, BancoCnab.SANTANDER, BancoCnab.CAIXA];
