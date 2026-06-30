'use client';
import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';

type Resumo = {
  totais: { alunos: number; professores: number; cursos: number };
  alunosPorSituacao: { situacao: string; total: number }[];
  alunosPorIngresso: { forma: string; total: number }[];
  alunosPorSexo: { sexo: string; total: number }[];
  alunosPorCorRaca: { corRaca: string; total: number }[];
  docentesPorTitulacao: { titulacao: string; total: number }[];
  docentesPorRegime: { regime: string; total: number }[];
};

const LABELS: Record<string, string> = {
  CURSANDO: 'Cursando', TRANCADO: 'Trancado', FORMADO: 'Formado',
  EVADIDO: 'Evadido', TRANSFERIDO_OUT: 'Transferido', FALECIDO: 'Falecido',
  VESTIBULAR: 'Vestibular', ENEM: 'ENEM', TRANSFERENCIA_EXTERNA: 'Transf. Externa',
  TRANSFERENCIA_INTERNA: 'Transf. Interna', PORTADOR_DIPLOMA: 'Portador de Diploma',
  CONVENIO: 'Convenio', OUTRO: 'Outro',
  MASCULINO: 'Masculino', FEMININO: 'Feminino', NAO_DECLARADO: 'Nao declarado',
  BRANCA: 'Branca', PRETA: 'Preta', PARDA: 'Parda', AMARELA: 'Amarela',
  INDIGENA: 'Indigena',
  GRADUADO: 'Graduado', ESPECIALISTA: 'Especialista', MESTRE: 'Mestre',
  DOUTOR: 'Doutor', POS_DOUTOR: 'Pos-doutor',
  HORISTA: 'Horista', PARCIAL: 'Parcial (20h)', INTEGRAL: 'Integral (40h)',
};

function downloadCsv(data: Record<string, unknown>[], filename: string) {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const rows = data.map(r => headers.map(h => {
    const v = String(r[h] ?? '');
    return v.includes(',') || v.includes('"') ? '"' + v.replace(/"/g, '""') + '"' : v;
  }).join(','));
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '16px 20px', borderTop: '3px solid ' + color }}>
      <div style={{ fontSize: 28, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>{label}</div>
    </div>
  );
}

function GroupTable({ title, rows, keyLabel }: { title: string; rows: { key: string; total: number }[]; keyLabel: string }) {
  const total = rows.reduce((s, r) => s + r.total, 0);
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ padding: '10px 14px', borderBottom: '1px solid #e5e7eb', fontWeight: 600, fontSize: 13 }}>{title}</div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ padding: '6px 14px', textAlign: 'left', fontSize: 11, color: '#6b7280', borderBottom: '1px solid #f3f4f6' }}>{keyLabel}</th>
            <th style={{ padding: '6px 14px', textAlign: 'right', fontSize: 11, color: '#6b7280', borderBottom: '1px solid #f3f4f6' }}>Total</th>
            <th style={{ padding: '6px 14px', textAlign: 'right', fontSize: 11, color: '#6b7280', borderBottom: '1px solid #f3f4f6' }}>%</th>
          </tr>
        </thead>
        <tbody>
          {rows.sort((a, b) => b.total - a.total).map(r => (
            <tr key={r.key}>
              <td style={{ padding: '6px 14px', fontSize: 13, borderBottom: '1px solid #f9fafb' }}>{LABELS[r.key] ?? r.key}</td>
              <td style={{ padding: '6px 14px', fontSize: 13, textAlign: 'right', fontWeight: 600, borderBottom: '1px solid #f9fafb' }}>{r.total}</td>
              <td style={{ padding: '6px 14px', fontSize: 12, textAlign: 'right', color: '#6b7280', borderBottom: '1px solid #f9fafb' }}>
                {total > 0 ? ((r.total / total) * 100).toFixed(1) + '%' : '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function CensoPage() {
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<Resumo>('/relatorios/censo/resumo')
      .then(setResumo)
      .finally(() => setLoading(false));
  }, []);

  async function exportar(endpoint: string, filename: string) {
    setExportLoading(endpoint);
    try {
      const data = await apiFetch<Record<string, unknown>[]>('/relatorios/censo/' + endpoint);
      downloadCsv(data, filename);
    } finally { setExportLoading(null); }
  }

  if (loading) return <div style={{ padding: 40, color: '#6b7280' }}>Carregando dados do Censo...</div>;
  if (!resumo) return null;

  const yr = new Date().getFullYear();

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 600 }}>Censo da Educacao Superior - INEP</h2>
          <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>Dados com campos exigidos pelo Censo. Exporte em CSV para conferencia.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { key: 'alunos', label: 'Alunos CSV' },
            { key: 'docentes', label: 'Docentes CSV' },
            { key: 'cursos', label: 'Cursos CSV' },
          ].map(({ key, label }) => (
            <button key={key}
              style={{ padding: '7px 14px', border: 'none', borderRadius: 4, cursor: exportLoading ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 500, background: exportLoading === key ? '#e5e7eb' : '#1e3a5f', color: exportLoading === key ? '#6b7280' : '#fff' }}
              disabled={!!exportLoading}
              onClick={() => exportar(key, 'censo_' + key + '_' + yr + '.csv')}>
              {exportLoading === key ? '...' : '↓ ' + label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        <StatCard label="Total de Alunos" value={resumo.totais.alunos} color="#1e3a5f" />
        <StatCard label="Total de Docentes" value={resumo.totais.professores} color="#2563eb" />
        <StatCard label="Cursos" value={resumo.totais.cursos} color="#7c3aed" />
      </div>

      <h3 style={{ fontSize: 14, fontWeight: 600, color: '#374151', margin: '0 0 10px' }}>Alunos</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
        <GroupTable title="Por Situacao de Vinculo" keyLabel="Situacao"
          rows={resumo.alunosPorSituacao.map(r => ({ key: r.situacao, total: r.total }))} />
        <GroupTable title="Por Forma de Ingresso" keyLabel="Forma"
          rows={resumo.alunosPorIngresso.map(r => ({ key: r.forma, total: r.total }))} />
        <GroupTable title="Por Sexo" keyLabel="Sexo"
          rows={resumo.alunosPorSexo.map(r => ({ key: r.sexo, total: r.total }))} />
        <GroupTable title="Por Cor/Raca" keyLabel="Cor/Raca"
          rows={resumo.alunosPorCorRaca.map(r => ({ key: r.corRaca, total: r.total }))} />
      </div>

      <h3 style={{ fontSize: 14, fontWeight: 600, color: '#374151', margin: '0 0 10px' }}>Docentes</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <GroupTable title="Por Titulacao" keyLabel="Titulacao"
          rows={resumo.docentesPorTitulacao.map(r => ({ key: r.titulacao, total: r.total }))} />
        <GroupTable title="Por Regime de Trabalho" keyLabel="Regime"
          rows={resumo.docentesPorRegime.map(r => ({ key: r.regime, total: r.total }))} />
      </div>
    </div>
  );
}
