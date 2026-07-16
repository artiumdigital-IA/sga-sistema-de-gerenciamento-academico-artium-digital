'use client';
import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';

interface TipoChamado { id: string; nome: string; ativo: boolean; }

const INPUT: React.CSSProperties = { padding: '8px 10px', borderRadius: 5, border: '1px solid var(--gray-300)', fontSize: 13, boxSizing: 'border-box', width: '100%' };
const LABEL: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--gray-700)', marginBottom: 4 };
const BTN_P: React.CSSProperties = { padding: '8px 16px', borderRadius: 5, border: 'none', background: '#1a56db', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 };
const BTN_G: React.CSSProperties = { padding: '6px 12px', borderRadius: 5, border: '1px solid var(--gray-300)', cursor: 'pointer', fontSize: 12, background: 'var(--white)', color: 'var(--gray-700)' };

export default function TiposChamadoPage() {
  const [tipos, setTipos] = useState<TipoChamado[]>([]);
  const [loading, setLoading] = useState(true);
  const [nome, setNome] = useState('');
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    setLoading(true);
    try { setTipos(await apiFetch<TipoChamado[]>('/tipos-chamado-manutencao')); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  async function salvar() {
    if (!nome.trim()) return;
    setSalvando(true);
    try {
      await apiFetch('/tipos-chamado-manutencao', { method: 'POST', body: JSON.stringify({ nome }) });
      setNome(''); carregar();
    } catch (e: any) { alert(e.message ?? 'Erro ao salvar'); }
    finally { setSalvando(false); }
  }

  async function alternarAtivo(t: TipoChamado) {
    try { await apiFetch(`/tipos-chamado-manutencao/${t.id}`, { method: 'PATCH', body: JSON.stringify({ ativo: !t.ativo }) }); carregar(); }
    catch (e: any) { alert(e.message ?? 'Erro'); }
  }

  async function remover(id: string) {
    if (!confirm('Remover este tipo de chamado?')) return;
    try { await apiFetch(`/tipos-chamado-manutencao/${id}`, { method: 'DELETE' }); carregar(); }
    catch (e: any) { alert(e.message ?? 'Erro ao remover'); }
  }

  return (
    <div style={{ padding: '24px 28px' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700 }}>Tipos de Chamado</h1>
        <p style={{ margin: 0, fontSize: 12, color: 'var(--gray-500)' }}>Catálogo de categorias usadas na abertura de chamados de manutenção.</p>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20, alignItems: 'end', background: 'var(--gray-50)', padding: 16, borderRadius: 8, border: '1px solid var(--gray-200)' }}>
        <div style={{ flex: 1 }}>
          <label style={LABEL}>Novo tipo</label>
          <input style={INPUT} value={nome} placeholder="Ex: Elétrica" onChange={e => setNome(e.target.value)} />
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
              {tipos.length === 0 && <tr><td colSpan={3} style={{ padding: 24, textAlign: 'center', color: 'var(--gray-400)' }}>Nenhum tipo cadastrado.</td></tr>}
              {tipos.map(t => (
                <tr key={t.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                  <td style={{ padding: '10px 14px' }}>{t.nome}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <button onClick={() => alternarAtivo(t)} style={{ padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer', background: t.ativo ? '#d1fae5' : 'var(--gray-100)', color: t.ativo ? '#065f46' : 'var(--gray-500)' }}>
                      {t.ativo ? 'Ativo' : 'Inativo'}
                    </button>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <button style={{ ...BTN_G, color: '#dc2626', borderColor: '#fecaca' }} onClick={() => remover(t.id)}>Remover</button>
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
