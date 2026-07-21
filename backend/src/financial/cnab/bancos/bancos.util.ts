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

// Bancos com adapter de fato implementado (emissão de boleto + campo livre).
// Remessa (Fase 2) e retorno (Fase 3) hoje só têm adapter pronto pro Itaú —
// ver backend/src/financial/cnab/bancos/itau-campo-livre.util.ts. Safra,
// Santander e Caixa (CNAB 240) ficam de fora até serem homologados (Fase 4).
export const BANCOS_IMPLEMENTADOS: BancoCnab[] = [BancoCnab.ITAU];
