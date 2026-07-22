import * as ExcelJS from 'exceljs';

/**
 * Layout esperado (por posição de coluna, não por nome — o export legado não
 * garante grafia idêntica entre versões): A=Banco B=Agência C=Conta Corrente
 * D=Código do Aluno E=Nome F=Tipo de Receita G=Data Vencimento H=Valor de
 * Face I=Valor com Descontos J=Data Recebimento K=Valor Recebido L=Recebedor
 * M=Situação N=CPF O=Nome do Responsável Financeiro.
 */
export interface LinhaParcelaLegado {
  numeroLinha: number;
  banco: string | null;
  agencia: string | null;
  contaCorrente: string | null;
  codigoAlunoLegado: string | null;
  nome: string | null;
  tipoReceita: string | null;
  dataVencimento: Date | null;
  valorFace: number | null;
  valorComDesconto: number | null;
  dataRecebimento: Date | null;
  valorRecebido: number | null;
  recebedor: string | null;
  situacao: string | null;
  cpfRaw: string | null;
  cpfNormalizado: string | null; // 11 dígitos, ou null se ausente/inválido
  nomeResponsavelFinanceiro: string | null;
  colunasOriginais: Record<string, unknown>; // pra gravar em dadosOriginais sem tratamento
}

export interface ResultadoParsePlanilha {
  totalLinhasArquivo: number; // total de linhas de dado (excluindo cabeçalho) — detalhe + resumo ignorado
  linhas: LinhaParcelaLegado[]; // só as linhas de detalhe, já normalizadas
  linhasIgnoradasResumo: number;
}

const MARCADOR_TABELA_RESUMO = 'data de vencimento';

/** Extrai um texto legível de qualquer forma de valor que o exceljs devolve (string, rich text, fórmula, etc). */
function celulaParaTexto(valor: ExcelJS.CellValue): string | null {
  if (valor === null || valor === undefined) return null;
  if (valor instanceof Date) return valor.toISOString();
  if (typeof valor === 'object') {
    if ('richText' in valor && Array.isArray((valor as any).richText)) {
      return (valor as any).richText.map((r: any) => r.text).join('');
    }
    if ('result' in valor) return celulaParaTexto((valor as any).result);
    if ('text' in valor) return String((valor as any).text);
    return null;
  }
  return String(valor).trim();
}

function celulaParaNumero(valor: ExcelJS.CellValue): number | null {
  if (valor === null || valor === undefined) return null;
  if (typeof valor === 'number') return valor;
  const texto = celulaParaTexto(valor);
  if (!texto) return null;
  const normalizado = texto.replace(/\./g, '').replace(',', '.'); // tolera formato pt-BR "1.234,56"
  const comoNumero = parseFloat(/,/.test(texto) ? normalizado : texto);
  return isNaN(comoNumero) ? null : comoNumero;
}

/** Aceita tanto um Date real (célula formatada como data no Excel) quanto texto "M/D/YY"/"M/D/YYYY" (data como texto puro). */
function celulaParaData(valor: ExcelJS.CellValue): Date | null {
  if (valor === null || valor === undefined) return null;
  if (valor instanceof Date) return valor;
  const texto = celulaParaTexto(valor);
  if (!texto) return null;
  const m = texto.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (!m) return null;
  const [, mes, dia, anoStr] = m;
  const ano = anoStr.length === 2 ? 2000 + parseInt(anoStr, 10) : parseInt(anoStr, 10);
  const data = new Date(Date.UTC(ano, parseInt(mes, 10) - 1, parseInt(dia, 10)));
  return isNaN(data.getTime()) ? null : data;
}

function normalizarCpf(valor: ExcelJS.CellValue): { raw: string | null; normalizado: string | null } {
  const texto = celulaParaTexto(valor);
  if (!texto) return { raw: null, normalizado: null };
  const digitos = texto.replace(/\D/g, '');
  return { raw: texto, normalizado: /^\d{11}$/.test(digitos) ? digitos : null };
}

/**
 * Lê o .xlsx de parcelas legadas e separa a tabela de detalhe (uma linha por
 * parcela) do bloco de resumo agregado por data que o export original anexa
 * depois — detectado dinamicamente (procura o texto "Data de Vencimento" de
 * novo na coluna A, marcando o início de um segundo cabeçalho), não por um
 * número de linha fixo, pra sobreviver a uma versão futura do arquivo com
 * tamanho diferente.
 */
export async function parsearPlanilhaParcelasLegado(caminhoArquivo: string): Promise<ResultadoParsePlanilha> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(caminhoArquivo);
  const worksheet = workbook.worksheets[0];
  if (!worksheet) throw new Error('Planilha vazia ou sem abas.');

  const linhas: LinhaParcelaLegado[] = [];
  let linhasIgnoradasResumo = 0;
  let totalLinhasArquivo = 0;
  let dentroDoResumo = false;

  const totalLinhas = worksheet.rowCount;
  for (let numeroLinha = 2; numeroLinha <= totalLinhas; numeroLinha++) {
    const row = worksheet.getRow(numeroLinha);
    if (!row.hasValues) continue;

    const colA = celulaParaTexto(row.getCell(1).value);
    if (!dentroDoResumo && colA && colA.trim().toLowerCase() === MARCADOR_TABELA_RESUMO) {
      dentroDoResumo = true;
    }

    totalLinhasArquivo++;

    if (dentroDoResumo) {
      linhasIgnoradasResumo++;
      continue;
    }

    const { raw: cpfRaw, normalizado: cpfNormalizado } = normalizarCpf(row.getCell(14).value);

    const colunasOriginais = {
      banco: celulaParaTexto(row.getCell(1).value),
      agencia: celulaParaTexto(row.getCell(2).value),
      contaCorrente: celulaParaTexto(row.getCell(3).value),
      aluno: celulaParaTexto(row.getCell(4).value),
      nome: celulaParaTexto(row.getCell(5).value),
      maiorReceita: celulaParaTexto(row.getCell(6).value),
      dataVencimento: celulaParaTexto(row.getCell(7).value),
      valorDeFace: celulaParaTexto(row.getCell(8).value),
      valorComDescontos: celulaParaTexto(row.getCell(9).value),
      dataRecebimento: celulaParaTexto(row.getCell(10).value),
      valorRecebido: celulaParaTexto(row.getCell(11).value),
      recebedor: celulaParaTexto(row.getCell(12).value),
      situacao: celulaParaTexto(row.getCell(13).value),
      cpf: celulaParaTexto(row.getCell(14).value),
      nomeDoResponsavelFin: celulaParaTexto(row.getCell(15).value),
    };

    linhas.push({
      numeroLinha,
      banco: colunasOriginais.banco,
      agencia: colunasOriginais.agencia,
      contaCorrente: colunasOriginais.contaCorrente,
      codigoAlunoLegado: colunasOriginais.aluno,
      nome: colunasOriginais.nome,
      tipoReceita: colunasOriginais.maiorReceita,
      dataVencimento: celulaParaData(row.getCell(7).value),
      valorFace: celulaParaNumero(row.getCell(8).value),
      valorComDesconto: celulaParaNumero(row.getCell(9).value),
      dataRecebimento: celulaParaData(row.getCell(10).value),
      valorRecebido: celulaParaNumero(row.getCell(11).value),
      recebedor: colunasOriginais.recebedor,
      situacao: colunasOriginais.situacao,
      cpfRaw,
      cpfNormalizado,
      nomeResponsavelFinanceiro: colunasOriginais.nomeDoResponsavelFin,
      colunasOriginais,
    });
  }

  return { totalLinhasArquivo, linhas, linhasIgnoradasResumo };
}
