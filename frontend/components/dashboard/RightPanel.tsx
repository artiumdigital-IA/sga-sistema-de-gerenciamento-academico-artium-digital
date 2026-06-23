'use client';
import { useState } from 'react';
import { RpanelGroup } from './RpanelGroup';
import { MessagesPanel } from './MessagesPanel';

const RPANEL_GROUPS = [
  { title: 'Arquivos', items: ['Cadastro de Alunos','Ficha de Saude','Digitalizacao de Documentos','Cursos','Materias','Professores','Unidades','Unidade de Ensino','Contas Financeiras','Receitas','Contas Bancarias','Calendario Feriados','Cadastro de Usuarios','Consultar Arquivo de Log'] },
  { title: 'Coordenacao', items: ['Consulta posicao do Aluno','Pre-requisito','Materias Equiparadas','Grade Curricular Fixa','Formacao de Cursos','Formacao de Turmas','Datas dos Bimestres','Horario de Aulas','INEP','Ranking de Alunos'] },
  { title: 'Secretaria', items: ['Ingresso no Curso Superior','Inscricao','Manutencao Historico Escolar','Transferencia de Turma','Mudanca de Situacao','Diario de Classe','Emissao de Boletim','Relatorio Notas/Disciplinas','Mala Direta / Declaracoes'] },
  { title: 'Notas e Frequencia', items: ['Lancamento de Notas e Frequencia por Pauta','Lancamento de Notas por Aluno','Lancamento de Frequencia','Gerar Planilha de Notas','Importacao Planilha Excel','Calculo de Resultados'] },
  { title: 'Financeiro', items: ['Consulta posicao do Aluno','Lancamento Conta Corrente','Plano de Pagamentos','Ficha Financeira','Tesouraria','Acordo/Parcelamento','Cadastro de Bolsistas','Emissao de Titulos','Relatorios','Contabilidade'] },
  { title: 'Utilitarios', items: ['Calculadora','Visualizar Relatorios','Alteracao de Senha','Exporta Moodle'] },
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
