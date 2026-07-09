/**
 * telas-sistema.ts — inventário canônico de "telas" do sistema pra matriz de
 * permissões por perfil.
 *
 * IMPORTANTE: existe uma cópia idêntica em
 * backend/src/permissoes-tela/telas-sistema.ts (mesmo padrão de duplicação
 * intencional já usado no projeto — ver comentário em documento.service.ts
 * sobre cálculo de CR/integralização). Se adicionar/remover uma tela aqui,
 * replica lá — e vice-versa.
 *
 * `chave` é o identificador estável gravado em PermissaoTela.chaveTela.
 * `prefixos` são os paths de rota (sob /dashboard) cobertos por essa tela —
 * usado tanto pra decidir se um link de menu aparece quanto pra bloquear
 * acesso direto por URL a uma página desabilitada. Um prefixo cobre também
 * suas subrotas.
 */
export type TelaSistema = {
  chave: string;
  label: string;
  grupo: string;
  prefixos: string[];
};

export const TELAS_SISTEMA: TelaSistema[] = [
  // ── Acadêmico ────────────────────────────────────────────────────────
  { chave: 'cursos', label: 'Cursos', grupo: 'Acadêmico', prefixos: ['/dashboard/academico/cursos'] },
  { chave: 'matrizes', label: 'Matrizes Curriculares', grupo: 'Acadêmico', prefixos: ['/dashboard/academico/matrizes'] },
  { chave: 'disciplinas', label: 'Disciplinas', grupo: 'Acadêmico', prefixos: ['/dashboard/academico/disciplinas'] },
  { chave: 'periodos', label: 'Períodos Letivos', grupo: 'Acadêmico', prefixos: ['/dashboard/academico/periodos'] },
  { chave: 'unidades', label: 'Unidades de Ensino', grupo: 'Acadêmico', prefixos: ['/dashboard/academico/unidades'] },
  {
    chave: 'alunos', label: 'Alunos', grupo: 'Acadêmico',
    prefixos: [
      '/dashboard/academico/alunos',
      '/dashboard/academico/saude',
      '/dashboard/academico/situacao',
      '/dashboard/academico/historico',
      '/dashboard/academico/documentos',
      '/dashboard/academico/equiparacoes',
      '/dashboard/financeiro/observacoes',
    ],
  },
  { chave: 'professores', label: 'Professores', grupo: 'Acadêmico', prefixos: ['/dashboard/academico/professores'] },
  { chave: 'ofertas', label: 'Ofertas / Turmas', grupo: 'Acadêmico', prefixos: ['/dashboard/academico/ofertas'] },
  { chave: 'matriculas', label: 'Matrículas', grupo: 'Acadêmico', prefixos: ['/dashboard/academico/matriculas'] },
  { chave: 'notas', label: 'Lançamento de Notas', grupo: 'Acadêmico', prefixos: ['/dashboard/academico/notas'] },
  { chave: 'frequencia', label: 'Frequência', grupo: 'Acadêmico', prefixos: ['/dashboard/academico/frequencia'] },
  { chave: 'pauta', label: 'Notas & Frequência por Pauta', grupo: 'Acadêmico', prefixos: ['/dashboard/academico/pauta'] },
  { chave: 'mapao', label: 'Mapa de Notas / Relatório', grupo: 'Acadêmico', prefixos: ['/dashboard/academico/mapao'] },
  { chave: 'ranking', label: 'Ranking de Alunos', grupo: 'Acadêmico', prefixos: ['/dashboard/academico/ranking'] },
  { chave: 'ocorrencias', label: 'Ocorrências', grupo: 'Acadêmico', prefixos: ['/dashboard/academico/ocorrencias'] },
  { chave: 'transferencia', label: 'Transferência de Turma', grupo: 'Acadêmico', prefixos: ['/dashboard/academico/transferencia'] },

  // ── Ingresso ─────────────────────────────────────────────────────────
  { chave: 'processos-seletivos', label: 'Processos Seletivos', grupo: 'Ingresso', prefixos: ['/dashboard/ingresso/processos'] },
  { chave: 'candidatos', label: 'Candidatos', grupo: 'Ingresso', prefixos: ['/dashboard/ingresso/candidatos'] },

  // ── Secretaria ───────────────────────────────────────────────────────
  { chave: 'requerimentos', label: 'Requerimentos', grupo: 'Secretaria', prefixos: ['/dashboard/secretaria/requerimentos'] },
  { chave: 'documentos', label: 'Documentos (declaração, boletim, carteirinha...)', grupo: 'Secretaria', prefixos: ['/dashboard/secretaria/documentos'] },
  { chave: 'avisos', label: 'Avisos', grupo: 'Secretaria', prefixos: ['/dashboard/secretaria/avisos'] },
  { chave: 'mensagens', label: 'Mensagens', grupo: 'Secretaria', prefixos: ['/dashboard/secretaria/mensagens'] },
  { chave: 'protocolos', label: 'Protocolos', grupo: 'Secretaria', prefixos: ['/dashboard/secretaria/protocolos'] },
  { chave: 'tipos-protocolo', label: 'Tipos de Protocolo', grupo: 'Secretaria', prefixos: ['/dashboard/secretaria/tipos-protocolo'] },
  { chave: 'motivos-ocorrencia', label: 'Motivos de Ocorrência', grupo: 'Secretaria', prefixos: ['/dashboard/secretaria/motivos-ocorrencia'] },
  { chave: 'motivos-transferencia', label: 'Motivos de Transferência', grupo: 'Secretaria', prefixos: ['/dashboard/secretaria/motivos-transferencia'] },

  // ── Financeiro ───────────────────────────────────────────────────────
  { chave: 'contratos', label: 'Contratos / Mensalidades', grupo: 'Financeiro', prefixos: ['/dashboard/financeiro/contratos'] },
  { chave: 'receitas', label: 'Receitas', grupo: 'Financeiro', prefixos: ['/dashboard/financeiro/receitas'] },
  { chave: 'contas-bancarias', label: 'Contas Bancárias', grupo: 'Financeiro', prefixos: ['/dashboard/financeiro/contas-bancarias'] },

  // ── Relatórios ───────────────────────────────────────────────────────
  { chave: 'censo', label: 'Censo / INEP', grupo: 'Relatórios', prefixos: ['/dashboard/relatorios/censo'] },
  { chave: 'bolsistas', label: 'Bolsistas', grupo: 'Relatórios', prefixos: ['/dashboard/relatorios/bolsistas', '/dashboard/financeiro/bolsistas'] },
  { chave: 'relatorio-financeiro', label: 'Relatórios Financeiros', grupo: 'Relatórios', prefixos: ['/dashboard/relatorios/financeiro'] },

  // ── Administração ────────────────────────────────────────────────────
  { chave: 'usuarios', label: 'Usuários', grupo: 'Administração', prefixos: ['/dashboard/admin/usuarios'] },
  { chave: 'log', label: 'Log de Auditoria', grupo: 'Administração', prefixos: ['/dashboard/admin/log'] },
  { chave: 'sistema', label: 'Painel do Sistema', grupo: 'Administração', prefixos: ['/dashboard/admin/sistema'] },
  { chave: 'visual', label: 'Identidade Visual', grupo: 'Administração', prefixos: ['/dashboard/admin/visual'] },

  // ── Utilitários ──────────────────────────────────────────────────────
  { chave: 'calculadora', label: 'Calculadora', grupo: 'Utilitários', prefixos: ['/dashboard/utilitarios/calculadora'] },
  { chave: 'ramais', label: 'Ramais', grupo: 'Utilitários', prefixos: ['/dashboard/utilitarios/ramais'] },
];

/** Acha a tela dona de um href (ignorando querystring), comparando prefixo. */
export function encontrarTelaPorHref(href: string | null | undefined): TelaSistema | null {
  if (!href) return null;
  const caminho = href.split('?')[0];
  return TELAS_SISTEMA.find(t => t.prefixos.some(p => caminho.startsWith(p))) ?? null;
}

/**
 * Decide se um link/ícone de menu deve aparecer.
 * - href nulo (funcionalidade ainda não construída) → sempre mostra (o item já
 *   fica visualmente desabilitado por outro motivo, isso aqui não é permissão).
 * - chavesHabilitadas === null (permissões ainda carregando) → esconde
 *   (fail-closed: nunca mostra e depois some, evita "flash" do item).
 * - href sem tela correspondente no inventário (ex: "/dashboard", painel) →
 *   sempre mostra, não é uma tela controlável.
 */
export function hrefHabilitado(href: string | null | undefined, chavesHabilitadas: Set<string> | null): boolean {
  if (!href) return true;
  if (chavesHabilitadas === null) return false;
  const tela = encontrarTelaPorHref(href);
  if (!tela) return true;
  return chavesHabilitadas.has(tela.chave);
}
