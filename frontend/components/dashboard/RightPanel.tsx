'use client';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { RpanelGroup, type RpanelItem } from './RpanelGroup';
import { MessagesPanel } from './MessagesPanel';

// Mapeamento "Barra Rápida" (nomenclatura/estrutura de menu da Kirsch, levantada no spike de
// migração) -> telas equivalentes já existentes na plataforma nova. href: null = ainda não
// construído aqui (fica visível, porém desabilitado, pra deixar claro o que falta).
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
    { label: 'Emissão de Boletim', href: '/dashboard/secretaria/documentos' },
    { label: 'Relatório Notas/Disciplinas', href: '/dashboard/academico/mapao' },
    { label: 'Emissão de Carteirinha', href: '/dashboard/secretaria/documentos' },
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

export function RightPanel({ width = 220, tab, onTabChange }: { width?: number; tab: 'barra' | 'msg'; onTabChange: (t: 'barra' | 'msg') => void }) {
  const pathname = usePathname();
  const initialOpen = RPANEL_GROUPS.find(g => g.items.some(i => i.href && pathname.startsWith(i.href)))?.title ?? null;
  const [openTitle, setOpenTitle] = useState<string | null>(initialOpen);

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
          <button key={t} onClick={() => onTabChange(t)} style={{
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
          ? RPANEL_GROUPS.map(g => (
              <RpanelGroup key={g.title} title={g.title} items={g.items}
                open={openTitle === g.title}
                onToggle={() => setOpenTitle(t => t === g.title ? null : g.title)} />
            ))
          : <MessagesPanel />
        }
      </div>
    </div>
  );
}
