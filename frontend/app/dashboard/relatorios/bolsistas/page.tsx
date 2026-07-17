'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { formatarData } from '@/lib/format';

interface Bolsa {
  id: string; tipoBolsa: string; percentual: number;
  dataInicio: string; dataFim: string | null; ativo: boolean;
  aluno: { id: string; ra: string; nome: string; curso: { nome: string } };
}

const BTN_G: React.CSSProperties = { padding: '6px 12px', borderRadius: 5, border: '1px solid var(--gray-300)', cursor: 'pointer', fontSize: 12, background: 'var(--white)', color: 'var(--gray-700)' };

export default function ListagemBolsistasPage() {
  const router = useRouter();
  const [bolsas, setBolsas] = useState<Bolsa[]>([]);
  const [somenteAtivos, setSomenteAtivos] = useState(true);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [busca, setBusca] = useState('');

  const carregar = useCallback(async () => {
    setLoading(true); setErro('');
    try { setBolsas(await apiFetch<Bolsa[]>(`/bolsistas?somenteAtivos=${somenteAtivos}`)); }
    catch (e: any) { setErro(e.message ?? 'Erro ao carregar'); }
    finally { setLoading(false); }
  }, [somenteAtivos]);

  useEffect(() => { carregar(); }, [carregar]);

  const filtradas = bolsas.filter(b => {
    const q = busca.toLowerCase();
    return !q || b.aluno.nome.toLowerCase().includes(q) || b.aluno.ra.includes(q) || b.tipoBolsa.toLowerCase().includes(q);
  });

  return (
    <div style={{ padding: '24px 28px' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700 }}>Listagem de Alunos Bolsistas</h1>
        <p style={{ margin: 0, fontSize: 12, color: 'var(--gray-500)' }}>Total: <strong>{filtradas.length}</strong> bolsa{filtradas.length !== 1 ? 's' : ''}.</p>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
        <input
          style={{ flex: 1, padding: '8px 12px', borderRadius: 6, border: '1px solid var(--gray-300)', fontSize: 13 }}
          placeholder="Buscar por nome, RA ou tipo de bolsa..."
          value={busca} onChange={e => setBusca(e.target.value)}
        />
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--gray-700)', whiteSpace: 'nowrap' }}>
          <input type="checkbox" checked={somenteAtivos} onChange={e => setSomenteAtivos(e.target.checked)} />
          Somente ativas
        </label>
      </div>

      {loading && <p style={{ color: 'var(--gray-500)', fontSize: 13 }}>Carregando...</p>}
      {erro && <p style={{ color: '#dc2626', fontSize: 13 }}>{erro}</p>}

      {!loading && (
        <div style={{ background: 'var(--white)', border: '1px solid var(--gray-200)', borderRadius: 8, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
                {['RA', 'Nome', 'Curso', 'Tipo de bolsa', '%', 'Início', 'Fim', 'Status', ''].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--gray-700)', fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtradas.length === 0 && (
                <tr><td colSpan={9} style={{ padding: 24, textAlign: 'center', color: 'var(--gray-400)' }}>Nenhum bolsista encontrado.</td></tr>
              )}
              {filtradas.map(b => (
                <tr key={b.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                  <td style={{ padding: '10px 14px', fontWeight: 600 }}>{b.aluno.ra}</td>
                  <td style={{ padding: '10px 14px' }}>{b.aluno.nome}</td>
                  <td style={{ padding: '10px 14px', color: 'var(--gray-500)' }}>{b.aluno.curso.nome}</td>
                  <td style={{ padding: '10px 14px' }}>{b.tipoBolsa}</td>
                  <td style={{ padding: '10px 14px', fontWeight: 600 }}>{Number(b.percentual)}%</td>
                  <td style={{ padding: '10px 14px' }}>{formatarData(b.dataInicio)}</td>
                  <td style={{ padding: '10px 14px' }}>{b.dataFim ? formatarData(b.dataFim) : '—'}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: b.ativo ? '#d1fae5' : 'var(--gray-100)', color: b.ativo ? '#065f46' : 'var(--gray-500)' }}>
                      {b.ativo ? 'Ativa' : 'Inativa'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <button style={BTN_G} onClick={() => router.push(`/dashboard/financeiro/bolsistas/${b.aluno.id}`)}>Gerenciar</button>
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
