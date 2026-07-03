'use client';
import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';

interface MotivoTransferencia { id: string; nome: string; ativo: boolean; }

const INPUT: React.CSSProperties = { padding: '8px 10px', borderRadius: 5, border: '1px solid #d1d5db', fontSize: 13, boxSizing: 'border-box', width: '100%' };
const LABEL: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 };
const BTN_P: React.CSSProperties = { padding: '8px 16px', borderRadius: 5, border: 'none', background: '#1a56db', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 };
const BTN_G: React.CSSProperties = { padding: '6px 12px', borderRadius: 5, border: '1px solid #d1d5db', cursor: 'pointer', fontSize: 12, background: '#fff', color: '#374151' };

export default function MotivosTransferenciaPage() {
  const [motivos, setMotivos] = useState<MotivoTransferencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [nome, setNome] = useState('');
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    setLoading(true);
    try { setMotivos(await apiFetch<MotivoTransferencia[]>('/motivos-transferencia')); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  async function salvar() {
    if (!nome.trim()) return;
    setSalvando(true);
    try { await apiFetch('/motivos-transferencia', { method: 'POST', body: JSON.stringify({ nome }) }); setNome(''); carregar(); }
    catch (e: any) { alert(e.message ?? 'Erro ao salvar'); }
    finally { setSalvando(false); }
  }

  async function alternarAtivo(m: MotivoTransferencia) {
    try { await apiFetch(`/motivos-transferencia/${m.id}`, { method: 'PATCH', body: JSON.stringify({ ativo: !m.ativo }) }); carregar(); }
    catch (e: any) { alert(e.message ?? 'Erro'); }
  }

  async function remover(id: string) {
    if (!confirm('Remover este motivo?')) return;
    try { await apiFetch(`/motivos-transferencia/${id}`, { method: 'DELETE' }); carregar(); }
    catch (e: any) { alert(e.message ?? 'Erro ao remover'); }
  }

  return (
    <div style={{ padding: '24px 28px' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700 }}>Motivos de Transferências &amp; Cancelamentos</h1>
        <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>
          Catálogo de motivos sugeridos ao registrar Transferência de Turma ou Mudança de Situação.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20, alignItems: 'end', background: '#f9fafb', padding: 16, borderRadius: 8, border: '1px solid #e5e7eb' }}>
        <div style={{ flex: 1 }}>
          <label style={LABEL}>Novo motivo</label>
          <input style={INPUT} value={nome} placeholder="Ex: Conflito de horário" onChange={e => setNome(e.target.value)} />
        </div>
        <button style={BTN_P} disabled={salvando} onClick={salvar}>Adicionar</button>
      </div>

      {loading ? <p style={{ color: '#6b7280', fontSize: 13 }}>Carregando...</p> : (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                {['Nome', 'Status', ''].map(h => <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: 12 }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {motivos.length === 0 && <tr><td colSpan={3} style={{ padding: 24, textAlign: 'center', color: '#9ca3af' }}>Nenhum motivo cadastrado.</td></tr>}
              {motivos.map(m => (
                <tr key={m.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '10px 14px' }}>{m.nome}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <button onClick={() => alternarAtivo(m)} style={{ padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer', background: m.ativo ? '#d1fae5' : '#f3f4f6', color: m.ativo ? '#065f46' : '#6b7280' }}>
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
