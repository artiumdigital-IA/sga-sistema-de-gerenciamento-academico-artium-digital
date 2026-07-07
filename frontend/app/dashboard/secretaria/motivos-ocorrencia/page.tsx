'use client';
import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';

interface MotivoOcorrencia { id: string; nome: string; ativo: boolean; }

const INPUT: React.CSSProperties = { padding: '8px 10px', borderRadius: 5, border: '1px solid var(--gray-300)', fontSize: 13, boxSizing: 'border-box', width: '100%' };
const LABEL: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--gray-700)', marginBottom: 4 };
const BTN_P: React.CSSProperties = { padding: '8px 16px', borderRadius: 5, border: 'none', background: '#1a56db', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 };
const BTN_G: React.CSSProperties = { padding: '6px 12px', borderRadius: 5, border: '1px solid var(--gray-300)', cursor: 'pointer', fontSize: 12, background: 'var(--white)', color: 'var(--gray-700)' };

export default function MotivosOcorrenciaPage() {
  const [motivos, setMotivos] = useState<MotivoOcorrencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [nome, setNome] = useState('');
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    setLoading(true);
    try { setMotivos(await apiFetch<MotivoOcorrencia[]>('/motivos-ocorrencia')); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  async function salvar() {
    if (!nome.trim()) return;
    setSalvando(true);
    try { await apiFetch('/motivos-ocorrencia', { method: 'POST', body: JSON.stringify({ nome }) }); setNome(''); carregar(); }
    catch (e: any) { alert(e.message ?? 'Erro ao salvar'); }
    finally { setSalvando(false); }
  }

  async function alternarAtivo(m: MotivoOcorrencia) {
    try { await apiFetch(`/motivos-ocorrencia/${m.id}`, { method: 'PATCH', body: JSON.stringify({ ativo: !m.ativo }) }); carregar(); }
    catch (e: any) { alert(e.message ?? 'Erro'); }
  }

  async function remover(id: string) {
    if (!confirm('Remover este motivo?')) return;
    try { await apiFetch(`/motivos-ocorrencia/${id}`, { method: 'DELETE' }); carregar(); }
    catch (e: any) { alert(e.message ?? 'Erro ao remover'); }
  }

  return (
    <div style={{ padding: '24px 28px' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700 }}>Motivos de Ocorrência</h1>
        <p style={{ margin: 0, fontSize: 12, color: 'var(--gray-500)' }}>Catálogo de motivos usados no lançamento de ocorrências disciplinares.</p>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20, alignItems: 'end', background: 'var(--gray-50)', padding: 16, borderRadius: 8, border: '1px solid var(--gray-200)' }}>
        <div style={{ flex: 1 }}>
          <label style={LABEL}>Novo motivo</label>
          <input style={INPUT} value={nome} placeholder="Ex: Indisciplina em sala" onChange={e => setNome(e.target.value)} />
        </div>
        <button style={BTN_P} disabled={salvando} onClick={salvar}>Adicionar</button>
      </div>

      {loading ? <p style={{ color: 'var(--gray-500)', fontSize: 13 }}>Carregando...</p> : (
        <div style={{ background: 'var(--white)', border: '1px solid var(--gray-200)', borderRadius: 8, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
                {['Nome', 'Status', ''].map(h => <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--gray-700)', fontSize: 12 }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {motivos.length === 0 && <tr><td colSpan={3} style={{ padding: 24, textAlign: 'center', color: 'var(--gray-400)' }}>Nenhum motivo cadastrado.</td></tr>}
              {motivos.map(m => (
                <tr key={m.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                  <td style={{ padding: '10px 14px' }}>{m.nome}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <button onClick={() => alternarAtivo(m)} style={{ padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer', background: m.ativo ? '#d1fae5' : 'var(--gray-100)', color: m.ativo ? '#065f46' : 'var(--gray-500)' }}>
                      {m.ativo ? 'Ativo' : 'Inativo'}
                    </button>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <button style={{ ...BTN_G, color: '#dc2626', borderColor: '#fecaca' }} onClick={() => remover(m.id)}>Remover</button>
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
