'use client';
import { useState, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { RpanelGroup, type RpanelItem } from './RpanelGroup';
import { MessagesPanel } from './MessagesPanel';
import { hrefHabilitado } from '@/lib/telas-sistema';

const DIACRITICOS = new RegExp(String.fromCharCode(91, 92, 117, 48, 51, 48, 48, 45, 92, 117, 48, 51, 54, 102, 93), 'g');
function normalizar(s: string): string {
  return s.normalize('NFD').replace(DIACRITICOS, '').toLowerCase();
}

// "Menu Discente" — autoatendimento do próprio aluno. Só aparece na Barra Rápida
// quando o perfil logado é ALUNO (ver `gruposBase` abaixo), e SUBSTITUI todos os
// outros grupos (um aluno não navega pelos menus de secretaria/financeiro/admin).
// Cada item já tem uma tela própria em telas-sistema.ts (grupo "Menu Discente"),
// então cada um pode ser ativado/desativado independentemente em
// /dashboard/admin/permissoes — inclusive os ainda "em construção" (eles têm uma
// página real, só que com aviso de que o conteúdo entra depois; por isso, ao
// contrário do resto da Barra Rápida, não usam href: null).
const MENU_DISCENTE_GROUP: { title: string; items: RpanelItem[] } = {
  title: 'Menu Discente',
  items: [
    { label: 'Quadro de Horários', href: '/dashboard/discente/horarios' },
    { label: 'Pendências de Documentos', href: '/dashboard/discente/documentos' },
    { label: 'Protocolo (Abertura/Consulta)', href: '/dashboard/discente/protocolo' },
    { label: 'Carteira de Estudante', href: '/dashboard/discente/carteira' },
    { label: 'Minha Renovação', href: '/dashboard/discente/renovacao' },
    { label: 'Disciplinas e Avaliações', href: '/dashboard/discente/disciplinas' },
    { label: 'Notas e Histórico', href: '/dashboard/discente/historico' },
    { label: 'Conquistas e Avaliações', href: '/dashboard/discente/conquistas' },
    { label: 'Provas no Polo', href: '/dashboard/discente/provas-polo' },
    { label: 'Horas AAC', href: '/dashboard/discente/aac' },
    { label: 'Certificações', href: '/dashboard/discente/certificacoes' },
    { label: 'Conteúdos Extras', href: '/dashboard/discente/conteudos-extras' },
    { label: 'Financeiro', href: '/dashboard/discente/financeiro' },
    { label: 'Carreiras', href: '/dashboard/discente/carreiras' },
    { label: 'Suporte', href: '/dashboard/discente/suporte' },
    { label: 'Perfil', href: '/dashboard/discente/perfil' },
  ],
};

// Mapeamento "Barra Rápida" (nomenclatura/estrutura de menu da Kirsch, levantada no spike de
// migração) -> telas equivalentes já existentes na plataforma nova. href: null = ainda não
// construído aqui (fica visível, porém desabilitado, pra deixar claro o que falta).
// Não é exibido pro perfil ALUNO (ver MENU_DISCENTE_GROUP acima).
const RPANEL_GROUPS: { title: string; items: RpanelItem[] }[] = [
  { title: 'Arquivos', items: [
    { label: 'Cadastro de Alunos', href: '/dashboard/academico/alunos' },
    { label: 'Ficha de Saúde', href: '/dashboard/academico/alunos' },
    { label: 'Digitalização de Documentos', href: '/dashboard/academico/alunos' },
    { label: 'Cursos', href: '/dashboard/academico/cursos' },
    { label: 'Matérias', href: '/dashboard/academico/disciplinas' },
    { label: 'Professores', href: '/dashboard/academico/professores' },
    { label: 'Unidades', href: '/dashboard/academico/unidades' },
    { label: 'Unidade de Ensino', href: '/dashboard/academico/unidades' },
    { label: 'Contas Financeiras', href: '/dashboard/financeiro/contratos' },
    { label: 'Receitas', href: '/dashboard/financeiro/receitas' },
    { label: 'Contas Bancárias', href: '/dashboard/financeiro/contas-bancarias' },
    { label: 'Calendário/Feriados', href: '/dashboard/academico/periodos' },
    { label: 'Cadastro de Usuários', href: '/dashboard/admin/usuarios' },
    { label: 'Consultar Arquivo de Log', href: '/dashboard/admin/log' },
  ]},
  { title: 'Coordenação', items: [
    { label: 'Consulta posição do Aluno', href: '/dashboard/academico/alunos' },
    { label: 'Pré-requisito', href: '/dashboard/academico/disciplinas' },
    { label: 'Matérias Equiparadas', href: '/dashboard/academico/alunos' },
    { label: 'Grade Curricular Fixa', href: '/dashboard/academico/matrizes' },
    { label: 'Formação de Cursos', href: '/dashboard/academico/matrizes' },
    { label: 'Formação de Turmas', href: '/dashboard/academico/ofertas' },
    { label: 'Datas dos Bimestres', href: '/dashboard/academico/periodos' },
    { label: 'Horário de Aulas', href: '/dashboard/academico/ofertas' },
    { label: 'INEP', href: '/dashboard/relatorios/censo' },
    { label: 'Ranking de Alunos', href: '/dashboard/academico/ranking' },
  ]},
  { title: 'Secretaria', items: [
    { label: 'Ingresso no Curso Superior', href: '/dashboard/ingresso/processos' },
    { label: 'Inscrição', href: '/dashboard/ingresso/candidatos' },
    { label: 'Manutenção Histórico Escolar', href: '/dashboard/academico/alunos' },
    { label: 'Transferência de Turma', href: '/dashboard/academico/transferencia' },
    { label: 'Mudança de Situação', href: '/dashboard/academico/alunos' },
    { label: 'Motivos de Transferências & Cancelamentos', href: '/dashboard/secretaria/motivos-transferencia' },
    { label: 'Consulta Log de Inscrições', href: '/dashboard/admin/log' },
    { label: 'Ordenação Turmas', href: '/dashboard/academico/ofertas' },
    { label: 'Manutenção de Frequência', href: '/dashboard/academico/frequencia' },
    { label: 'Listagem de Alunos em Atraso', href: '/dashboard/academico/frequencia?tab=resumo' },
    { label: 'Diário de Classe', href: '/dashboard/academico/notas' },
    { label: 'Notas & Frequência por Pauta', href: '/dashboard/academico/pauta' },
    { label: 'Emissão de Boletim', href: '/dashboard/secretaria/documentos' },
    { label: 'Relatório Notas/Disciplinas', href: '/dashboard/academico/mapao' },
    { label: 'Emissão de Carteirinha', href: '/dashboard/secretaria/documentos' },
    { label: 'Emissão de Histórico Escolar', href: '/dashboard/secretaria/documentos' },
    { label: 'Emissão de Calendário Acadêmico', href: '/dashboard/secretaria/documentos' },
    { label: 'Carômetro', href: null },
    { label: 'Etiqueta', href: null },
    { label: 'Mala Direta / Declarações', href: '/dashboard/secretaria/documentos' },
  ]},
  { title: 'Protocolo', items: [
    { label: 'Lançamento/Consulta', href: '/dashboard/secretaria/protocolos' },
    { label: 'Consultas', href: '/dashboard/secretaria/protocolos' },
    { label: 'Tipos de Protocolos', href: '/dashboard/secretaria/tipos-protocolo' },
    { label: 'Relatório de Protocolos em Aberto', href: '/dashboard/secretaria/protocolos?status=ABERTO' },
  ]},
  { title: 'Ocorrências', items: [
    { label: 'Motivos Ocorrências', href: '/dashboard/secretaria/motivos-ocorrencia' },
    { label: 'Lançamento/Manutenção', href: '/dashboard/academico/alunos' },
    { label: 'Relatório de Ocorrências - CDR - por Aluno', href: '/dashboard/academico/alunos' },
    { label: 'Resumo de Ocorrências por Turmas', href: '/dashboard/academico/ocorrencias/resumo' },
  ]},
  { title: 'Portais', items: [
    { label: 'Compor/Manutenção Pauta por Professor', href: null },
    { label: 'Gerenciamento das Pautas de Notas', href: null },
    { label: 'Liberação de Bimestres no Boletim OnLine', href: null },
    { label: 'Compor Mensagens', href: '/dashboard/secretaria/mensagens' },
    { label: 'Manutenção de Mensagens Enviadas', href: '/dashboard/secretaria/mensagens' },
    { label: 'Renovação de Matrícula', href: null },
    { label: 'Assinatura Digital', href: null },
    { label: 'Gráficos de Acesso aos Portais', href: null },
  ]},
  { title: 'Notas e Frequência', items: [
    { label: 'Lançamento de Notas e Frequência por Pauta', href: '/dashboard/academico/notas' },
    { label: 'Lançamento de Notas por Aluno', href: '/dashboard/academico/notas' },
    { label: 'Lançamento de Frequência', href: '/dashboard/academico/frequencia' },
    { label: 'Gerar Planilha de Notas', href: '/dashboard/academico/notas/planilha' },
    { label: 'Importação Planilha Excel', href: '/dashboard/academico/notas/planilha' },
    { label: 'Cálculo de Resultados', href: '/dashboard/academico/notas' },
  ]},
  { title: 'Financeiro', items: [
    { label: 'Consulta posição do Aluno', href: '/dashboard/academico/alunos' },
    { label: 'Lançamento Conta Corrente', href: null },
    { label: 'Plano de Pagamentos', href: '/dashboard/financeiro/contratos' },
    { label: 'Ficha Financeira', href: '/dashboard/financeiro/contratos' },
    { label: 'Tesouraria', href: null },
    { label: 'Acordo/Parcelamento', href: '/dashboard/financeiro/contratos' },
    { label: 'Cadastro de Bolsistas', href: '/dashboard/academico/alunos' },
    { label: 'Emissão de Títulos', href: null },
  ]},
  { title: 'CReceber', items: [
    { label: 'Consulta posição do Aluno', href: '/dashboard/academico/alunos' },
    { label: 'Observações Financeiras', href: '/dashboard/academico/alunos' },
    { label: 'Associação Alunos x Planos', href: null },
    { label: 'Importação Arquivo Retorno', href: null },
    { label: 'Registro Bancário', href: '/dashboard/financeiro/contas-bancarias' },
    { label: 'Manutenção de Títulos', href: '/dashboard/financeiro/contratos' },
    { label: 'Condições Especiais', href: null },
    { label: 'Relação Conta x Turma', href: null },
    { label: 'Transferência Cartão e Cheque para Dinheiro', href: null },
  ]},
  { title: 'Relatórios', items: [
    { label: 'Relatório de Inadimplência', href: '/dashboard/relatorios/financeiro' },
    { label: 'Resumo Financeiro por Turma', href: '/dashboard/relatorios/financeiro' },
    { label: 'Resumo Financeiro Receita', href: null },
    { label: 'Previsão Financeira Turma x Conta', href: null },
    { label: 'Listagem de Alunos Bolsistas', href: '/dashboard/relatorios/bolsistas' },
    { label: 'Relatório DDM', href: null },
  ]},
  { title: 'Contabilidade', items: [
    { label: 'Resumo Financeiro Curso/Competência', href: '/dashboard/relatorios/financeiro' },
    { label: 'Registro dos Títulos (Apropriação)', href: null },
    { label: 'Apuração ISS', href: null },
    { label: 'Geração do Arquivo XML / Consulta Chave NFS-e', href: null },
  ]},
  { title: 'Utilitários', items: [
    { label: 'Painel do Sistema', href: '/dashboard/admin/sistema' },
    { label: 'Identidade Visual', href: '/dashboard/admin/visual' },
    { label: 'Ramais', href: '/dashboard/utilitarios/ramais' },
    { label: 'Calculadora', href: '/dashboard/utilitarios/calculadora' },
    { label: 'Visualizar Relatórios', href: '/dashboard/relatorios/censo' },
    { label: 'Alteração de Senha', href: '/dashboard?view=conta' },
    { label: 'Pesquisa por Responsável', href: '/dashboard/academico/alunos' },
    { label: 'Pesquisa CPF na Base-De-Dados', href: '/dashboard/academico/alunos' },
    { label: 'Consulta a registro de acesso ao sistema', href: '/dashboard/admin/log' },
    { label: 'Exporta Moodle', href: null },
  ]},
];

export function RightPanel({ width = 220, tab, onTabChange, chavesHabilitadas, perfil }: {
  width?: number; tab: 'barra' | 'msg'; onTabChange: (t: 'barra' | 'msg') => void;
  /** Chaves de tela habilitadas pro perfil logado — esconde da Barra Rápida
   * qualquer item cuja tela esteja desativada. null = ainda carregando (não
   * filtra nada ainda, evita a lista sumir e reaparecer sem necessidade —
   * diferente da sidebar, aqui não há risco de vazar uma tela sensível
   * porque são só rótulos/atalhos, o bloqueio de fato é o guard de rota). */
  chavesHabilitadas: Set<string> | null;
  /** Perfil do usuário logado — ALUNO vê SÓ o "Menu Discente" na Barra Rápida
   * (nada dos menus de secretaria/financeiro/admin); os demais perfis veem os
   * grupos de sempre, sem o Menu Discente. undefined/null = ainda carregando
   * o JWT, trata como não-aluno até saber (evita mostrar o Menu Discente e
   * sumir em seguida). */
  perfil?: string | null;
}) {
  const pathname = usePathname();
  const gruposBase = perfil === 'ALUNO' ? [MENU_DISCENTE_GROUP] : RPANEL_GROUPS;
  const initialOpen = gruposBase.find(g => g.items.some(i => i.href && pathname.startsWith(i.href)))?.title ?? null;
  const [openTitle, setOpenTitle] = useState<string | null>(initialOpen);
  const [busca, setBusca] = useState('');

  const buscando = busca.trim().length > 0;

  const gruposPermitidos = useMemo(() => {
    if (chavesHabilitadas === null) return gruposBase;
    return gruposBase
      .map(g => ({ ...g, items: g.items.filter(i => hrefHabilitado(i.href, chavesHabilitadas)) }))
      .filter(g => g.items.length > 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chavesHabilitadas, perfil]);

  const gruposFiltrados = useMemo(() => {
    if (!buscando) return gruposPermitidos;
    const alvo = normalizar(busca.trim());
    return gruposPermitidos
      .map(g => ({ ...g, items: g.items.filter(i => normalizar(i.label).includes(alvo)) }))
      .filter(g => g.items.length > 0);
  }, [busca, buscando, gruposPermitidos]);

  return (
    <div className="print-hide" style={{
      width, flexShrink: 0, background: 'var(--white)',
      borderLeft: '1px solid var(--gray-200)',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {/* Abas */}
      <div style={{
        display: 'flex', borderBottom: '1px solid var(--gray-200)',
        background: 'var(--gray-50)', flexShrink: 0,
      }}>
        {(['barra','msg'] as const).map(t => (
          <button key={t} onClick={() => onTabChange(t)} style={{
            flex: 1, height: 36, border: 'none', cursor: 'pointer',
            background: tab === t ? 'var(--white)' : 'transparent',
            borderBottom: tab === t ? '2px solid var(--accent-blue-text)' : '2px solid transparent',
            fontSize: 11, fontWeight: tab === t ? 700 : 400,
            color: tab === t ? 'var(--accent-blue-text)' : 'var(--gray-400)',
          }}>
            {t === 'barra' ? 'Barra Rapida' : 'Mensagens'}
          </button>
        ))}
      </div>

      {/* Pesquisa */}
      {tab === 'barra' && (
        <div style={{ padding: 8, borderBottom: '1px solid var(--gray-200)', flexShrink: 0 }}>
          <div style={{ position: 'relative' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }}>
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Pesquisar na barra rápida..."
              style={{
                width: '100%', boxSizing: 'border-box', padding: '6px 8px 6px 26px',
                fontSize: 11.5, borderRadius: 5, border: '1px solid var(--gray-200)',
                background: 'var(--gray-50)', color: 'var(--gray-700)', outline: 'none',
              }}
            />
            {buscando && (
              <button
                onClick={() => setBusca('')}
                title="Limpar"
                style={{
                  position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)',
                  border: 'none', background: 'transparent', cursor: 'pointer',
                  fontSize: 13, color: 'var(--gray-400)', lineHeight: 1, padding: 2,
                }}
              >
                ×
              </button>
            )}
          </div>
        </div>
      )}

      {/* Conteudo */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {tab === 'barra'
          ? (gruposFiltrados.length > 0
              ? gruposFiltrados.map(g => (
                  <RpanelGroup key={g.title} title={g.title} items={g.items}
                    open={buscando ? true : openTitle === g.title}
                    onToggle={() => setOpenTitle(t => t === g.title ? null : g.title)} />
                ))
              : (
                <p style={{ padding: '16px 12px', fontSize: 11.5, color: 'var(--gray-400)' }}>
                  Nenhum item encontrado para &quot;{busca}&quot;.
                </p>
              )
            )
          : <MessagesPanel />
        }
      </div>
    </div>
  );
}
