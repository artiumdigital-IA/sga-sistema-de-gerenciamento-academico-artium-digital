'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';

type Aluno = { id: string; nome: string; ra: string; curso?: { nome: string } };

export default function DocumentosPage() {
  const router = useRouter();
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  async function buscar() {
    if (!search.trim()) return;
    setLoading(true);
    const r = await apiFetch(`/alunos?search=${encodeURIComponent(search)}`);
    const d = await r.json();
    setAlunos(Array.isArray(d) ? d : d.data ?? []);
    setLoading(false);
  }

  return (
    <div style={{ maxWidth: 700 }}>
      <h2 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 600 }}>Documentos</h2>
      <p style={{ margin: '0 0 20px', fontSize: 13, color: '#6b7280' }}>Busque o aluno para gerar a declaração de matrícula.</p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <input
          placeholder="Nome, RA ou CPF do aluno..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && buscar()}
          style={{ flex: 1, padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 13 }}
        />
        <button onClick={buscar} disabled={loading}
          style={{ padding: '8px 16px', background: '#1e3a5f', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}>
          {loading ? 'Buscando...' : 'Buscar'}
        </button>
      </div>

      {alunos.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Aluno', 'RA', 'Curso', 'Documentos'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {alunos.map(a => (
                <tr key={a.id}>
                  <td style={{ padding: '8px 12px', fontSize: 13, borderBottom: '1px solid #f3f4f6', fontWeight: 500 }}>{a.nome}</td>
                  <td style={{ padding: '8px 12px', fontSize: 13, borderBottom: '1px solid #f3f4f6' }}>{a.ra}</td>
                  <td style={{ padding: '8px 12px', fontSize: 13, borderBottom: '1px solid #f3f4f6', color: '#6b7280' }}>{a.curso?.nome ?? '—'}</td>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid #f3f4f6' }}>
                    <button
                      onClick={() => router.push(`/dashboard/secretaria/documentos/declaracao/${a.id}`)}
                      style={{ padding: '4px 10px', fontSize: 12, border: '1px solid #3b82f6', borderRadius: 4, cursor: 'pointer', background: '#eff6ff', color: '#2563eb' }}>
                      Declaração de Matrícula
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
