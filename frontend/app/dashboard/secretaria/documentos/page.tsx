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
    try {
      const d = await apiFetch<any>(`/alunos?search=${encodeURIComponent(search)}`);
      setAlunos(Array.isArray(d) ? d : (d as any).data ?? []);
    } finally { setLoading(false); }
  }

  return (
    <div style={{ padding: '24px 28px' }}>
      <h2 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 600 }}>Documentos</h2>
      <p style={{ margin: '0 0 20px', fontSize: 13, color: 'var(--gray-500)' }}>Busque o aluno para gerar a declaração de matrícula ou o boletim.</p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <input
          placeholder="Nome, RA ou CPF do aluno..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && buscar()}
          style={{ flex: 1, padding: '8px 12px', border: '1px solid var(--gray-300)', borderRadius: 4, fontSize: 13 }}
        />
        <button onClick={buscar} disabled={loading}
          style={{ padding: '8px 16px', background: '#1e3a5f', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}>
          {loading ? 'Buscando...' : 'Buscar'}
        </button>
      </div>

      {alunos.length > 0 && (
        <div style={{ background: 'var(--white)', borderRadius: 8, border: '1px solid var(--gray-200)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Aluno', 'RA', 'Curso', 'Documentos'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--gray-500)', borderBottom: '1px solid var(--gray-200)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {alunos.map(a => (
                <tr key={a.id}>
                  <td style={{ padding: '8px 12px', fontSize: 13, borderBottom: '1px solid var(--gray-100)', fontWeight: 500 }}>{a.nome}</td>
                  <td style={{ padding: '8px 12px', fontSize: 13, borderBottom: '1px solid var(--gray-100)' }}>{a.ra}</td>
                  <td style={{ padding: '8px 12px', fontSize: 13, borderBottom: '1px solid var(--gray-100)', color: 'var(--gray-500)' }}>{a.curso?.nome ?? '—'}</td>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--gray-100)' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => router.push(`/dashboard/secretaria/documentos/declaracao/${a.id}`)}
                        style={{ padding: '4px 10px', fontSize: 12, border: '1px solid #3b82f6', borderRadius: 4, cursor: 'pointer', background: '#eff6ff', color: '#2563eb' }}>
                        Declaração de Matrícula
                      </button>
                      <button
                        onClick={() => router.push(`/dashboard/secretaria/documentos/boletim/${a.id}`)}
                        style={{ padding: '4px 10px', fontSize: 12, border: '1px solid #16a34a', borderRadius: 4, cursor: 'pointer', background: '#f0fdf4', color: '#15803d' }}>
                        Boletim
                      </button>
                      <button
                        onClick={() => router.push(`/dashboard/secretaria/documentos/carteirinha/${a.id}`)}
                        style={{ padding: '4px 10px', fontSize: 12, border: '1px solid #7c3aed', borderRadius: 4, cursor: 'pointer', background: '#f5f3ff', color: '#6d28d9' }}>
                        Carteirinha
                      </button>
                      <button
                        onClick={() => router.push(`/dashboard/secretaria/documentos/historico-oficial/${a.id}`)}
                        style={{ padding: '4px 10px', fontSize: 12, border: '1px solid #d97706', borderRadius: 4, cursor: 'pointer', background: '#fffbeb', color: '#b45309' }}>
                        Histórico Escolar
                      </button>
                    </div>
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
