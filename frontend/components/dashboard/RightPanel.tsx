'use client';
import { useState } from 'react';
import { RpanelGroup, type RpanelItem } from './RpanelGroup';
import { MessagesPanel } from './MessagesPanel';

// Mapeamento "Barra Rápida" (nomenclatura/estrutura de menu da Kirsch, levantada no spike de
// migração) -> telas equivalentes já existentes na plataforma nova. href: null = ainda não
// construído aqui (fica visível, porém desabilitado, pra deixar claro o que falta).
const RPANEL_GROUPS: { title: string; items: RpanelItem[] }[] = [
  { title: 'Arquivos', items: [
    { label: 'Cadastro de Alunos', href: '/dashboard/academico/alunos' },
    { label: 'Ficha de Saúde', href: '/dashboard/academico/alunos' },
    { label: 'Digitalização de Documentos', href: null },
    { label: 'Cursos', href: '/dashboard/academico/cursos' },
    { label: 'Matérias', href: '/dashboard/academico/disciplinas' },
    { label: 'Professores', href: '/dashboard/academico/professores' },
    { label: 'Unidades', href: null },
    { label: 'Unidade de Ensino', href: null },
    { label: 'Contas Financeiras', href: '/dashboard/financeiro/contratos' },
    { label: 'Receitas', href: null },
    { label: 'Contas Bancárias', href: '/dashboard/financeiro/contas-bancarias' },
    { label: 'Calendário/Feriados', href: '/dashboard/academico/periodos' },
    { label: 'Cadastro de Usuários', href: '/dashboard/admin/usuarios' },
    { label: 'Consultar Arquivo de Log', href: null },
  ]},
  { title: 'Coordenação', items: [
    { label: 'Consulta posição do Aluno', href: '/dashboard/academico/alunos' },
    { label: 'Pré-requisito', href: '/dashboard/academico/disciplinas' },
    { label: 'Matérias Equiparadas', href: null },
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
    { label: 'Transferência de Turma', href: null },
    { label: 'Mudança de Situação', href: null },
    { label: 'Diário de Classe', href: '/dashboard/academico/notas' },
    { label: 'Emissão de Boletim', href: '/dashboard/secretaria/documentos' },
    { label: 'Relatório Notas/Disciplinas', href: '/dashboard/academico/mapao' },
    { label: 'Mala Direta / Declarações', href: '/dashboard/secretaria/documentos' },
  ]},
  { title: 'Notas e Frequência', items: [
    { label: 'Lançamento de Notas e Frequência por Pauta', href: '/dashboard/academico/notas' },
    { label: 'Lançamento de Notas por Aluno', href: '/dashboard/academico/notas' },
    { label: 'Lançamento de Frequência', href: '/dashboard/academico/notas' },
    { label: 'Gerar Planilha de Notas', href: null },
    { label: 'Importação Planilha Excel', href: null },
    { label: 'Cálculo de Resultados', href: '/dashboard/academico/notas' },
  ]},
  { title: 'Financeiro', items: [
    { label: 'Consulta posição do Aluno', href: '/dashboard/academico/alunos' },
    { label: 'Lançamento Conta Corrente', href: null },
    { label: 'Plano de Pagamentos', href: '/dashboard/financeiro/contratos' },
    { label: 'Ficha Financeira', href: '/dashboard/financeiro/contratos' },
    { label: 'Tesouraria', href: null },
    { label: 'Acordo/Parcelamento', href: '/dashboard/financeiro/contratos' },
    { label: 'Cadastro de Bolsistas', href: null },
    { label: 'Emissão de Títulos', href: null },
    { label: 'Relatórios', href: null },
    { label: 'Contabilidade', href: null },
  ]},
  { title: 'Utilitários', items: [
    { label: 'Calculadora', href: '/dashboard/utilitarios/calculadora' },
    { label: 'Visualizar Relatórios', href: '/dashboard/relatorios/censo' },
    { label: 'Alteração de Senha', href: '/dashboard?view=conta' },
    { label: 'Exporta Moodle', href: null },
  ]},
];

export function RightPanel({ width = 220 }: { width?: number }) {
  const [tab, setTab] = useState<'barra' | 'msg'>('barra');

  return (
    <div style={{
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
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, height: 36, border: 'none', cursor: 'pointer',
            background: tab === t ? 'var(--white)' : 'transparent',
            borderBottom: tab === t ? '2px solid var(--blue-dark)' : '2px solid transparent',
            fontSize: 11, fontWeight: tab === t ? 700 : 400,
            color: tab === t ? 'var(--blue-dark)' : 'var(--gray-400)',
          }}>
            {t === 'barra' ? 'Barra Rapida' : 'Mensagens'}
          </button>
        ))}
      </div>

      {/* Conteudo */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {tab === 'barra'
          ? RPANEL_GROUPS.map(g => <RpanelGroup key={g.title} title={g.title} items={g.items} />)
          : <MessagesPanel />
        }
      </div>
    </div>
  );
}
