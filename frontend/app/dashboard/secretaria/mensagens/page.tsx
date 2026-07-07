'use client';
import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';

interface UsuarioResumo { id: string; email: string; nome: string | null; }
interface Mensagem {
  id: string; assunto: string; corpo: string; lida: boolean; criadoEm: string;
  remetente?: UsuarioResumo; destinatario?: UsuarioResumo;
}

const INPUT: React.CSSProperties = { padding: '8px 10px', borderRadius: 5, border: '1px solid var(--gray-300)', fontSize: 13, boxSizing: 'border-box', width: '100%' };
const LABEL: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--gray-700)', marginBottom: 4 };
const BTN: React.CSSProperties = { padding: '8px 16px', borderRadius: 5, border: 'none', background: '#7c3aed', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 };
const BTN_G: React.CSSProperties = { padding: '6px 12px', borderRadius: 5, border: '1px solid var(--gray-300)', cursor: 'pointer', fontSize: 12, background: 'var(--white)', color: 'var(--gray-700)' };

export default function MensagensPage() {
  const [tab, setTab] = useState<'compor' | 'enviadas' | 'recebidas'>('compor');
  const [usuarios, setUsuarios] = useState<UsuarioResumo[]>([]);
  const [destinatarioId, setDestinatarioId] = useState('');
  const [assunto, setAssunto] = useState('');
  const [corpo, setCorpo] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [enviadas, setEnviadas] = useState<Mensagem[]>([]);
  const [recebidas, setRecebidas] = useState<Mensagem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { apiFetch<UsuarioResumo[]>('/usuarios').then(setUsuarios).catch(() => {}); }, []);

  const carregarEnviadas = useCallback(async () => {
    setLoading(true);
    try { setEnviadas(await apiFetch<Mensagem[]>('/mensagens/enviadas')); }
    finally { setLoading(false); }
  }, []);
  const carregarRecebidas = useCallback(async () => {
    setLoading(true);
    try { setRecebidas(await apiFetch<Mensagem[]>('/mensagens/recebidas')); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (tab === 'enviadas') carregarEnviadas();
    if (tab === 'recebidas') carregarRecebidas();
  }, [tab, carregarEnviadas, carregarRecebidas]);

  async function enviar() {
    if (!destinatarioId || !assunto.trim() || !corpo.trim()) { alert('Preencha destinatário, assunto e mensagem.'); return; }
    setSalvando(true);
    try {
      await apiFetch('/mensagens', { method: 'POST', body: JSON.stringify({ destinatarioId, assunto, corpo }) });
      setDestinatarioId(''); setAssunto(''); setCorpo('');
      alert('Mensagem enviada.');
    } catch (e: any) { alert(e.message ?? 'Erro ao enviar'); }
    finally { setSalvando(false); }
  }

  async function marcarLida(id: string) {
    try { await apiFetch(`/mensagens/${id}/lida`, { method: 'PATCH', body: JSON.stringify({}) }); carregarRecebidas(); }
    catch (e: any) { alert(e.message ?? 'Erro'); }
  }

  return (
    <div style={{ padding: '24px 28px' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700 }}>Mensagens</h1>
        <p style={{ margin: 0, fontSize: 12, color: 'var(--gray-500)' }}>Compor mensagem direcionada a um usuário do sistema, e consultar enviadas/recebidas.</p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: '1px solid var(--gray-200)' }}>
        {(['compor', 'enviadas', 'recebidas'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '8px 16px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13, fontWeight: 600, borderBottom: tab === t ? '2px solid #7c3aed' : '2px solid transparent', color: tab === t ? '#7c3aed' : 'var(--gray-500)', textTransform: 'capitalize' }}>
            {t === 'compor' ? 'Compor' : t === 'enviadas' ? 'Enviadas' : 'Recebidas'}
          </button>
        ))}
      </div>

      {tab === 'compor' && (
        <div style={{ background: 'var(--gray-50)', border: '1px solid var(--gray-200)', borderRadius: 8, padding: 18, maxWidth: 560 }}>
          <div style={{ marginBottom: 12 }}>
            <label style={LABEL}>Destinatário</label>
            <select style={INPUT} value={destinatarioId} onChange={e => setDestinatarioId(e.target.value)}>
              <option value="">Selecione...</option>
              {usuarios.map(u => <option key={u.id} value={u.id}>{u.nome ? `${u.nome} (${u.email})` : u.email}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={LABEL}>Assunto</label>
            <input style={INPUT} value={assunto} onChange={e => setAssunto(e.target.value)} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={LABEL}>Mensagem</label>
            <textarea style={{ ...INPUT, minHeight: 100, resize: 'vertical' }} value={corpo} onChange={e => setCorpo(e.target.value)} />
          </div>
          <button style={BTN} disabled={salvando} onClick={enviar}>{salvando ? 'Enviando...' : 'Enviar'}</button>
        </div>
      )}

      {tab === 'enviadas' && (
        loading ? <p style={{ color: 'var(--gray-500)', fontSize: 13 }}>Carregando...</p> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {enviadas.length === 0 && <p style={{ color: 'var(--gray-400)', fontSize: 13 }}>Nenhuma mensagem enviada.</p>}
            {enviadas.map(m => (
              <div key={m.id} style={{ background: 'var(--white)', border: '1px solid var(--gray-200)', borderRadius: 8, padding: '12px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <strong style={{ fontSize: 13 }}>{m.assunto}</strong>
                  <span style={{ fontSize: 11, color: 'var(--gray-400)' }}>{new Date(m.criadoEm).toLocaleString('pt-BR')}</span>
                </div>
                <p style={{ margin: '0 0 6px', fontSize: 12, color: 'var(--gray-500)' }}>Para: {m.destinatario?.nome ?? m.destinatario?.email}</p>
                <p style={{ margin: 0, fontSize: 13 }}>{m.corpo}</p>
                {m.lida && <span style={{ fontSize: 11, color: '#16a34a' }}>✓ Lida</span>}
              </div>
            ))}
          </div>
        )
      )}

      {tab === 'recebidas' && (
        loading ? <p style={{ color: 'var(--gray-500)', fontSize: 13 }}>Carregando...</p> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {recebidas.length === 0 && <p style={{ color: 'var(--gray-400)', fontSize: 13 }}>Nenhuma mensagem recebida.</p>}
            {recebidas.map(m => (
              <div key={m.id} style={{ background: m.lida ? 'var(--white)' : '#eff6ff', border: '1px solid var(--gray-200)', borderRadius: 8, padding: '12px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <strong style={{ fontSize: 13 }}>{m.assunto}</strong>
                  <span style={{ fontSize: 11, color: 'var(--gray-400)' }}>{new Date(m.criadoEm).toLocaleString('pt-BR')}</span>
                </div>
                <p style={{ margin: '0 0 6px', fontSize: 12, color: 'var(--gray-500)' }}>De: {m.remetente?.nome ?? m.remetente?.email}</p>
                <p style={{ margin: '0 0 8px', fontSize: 13 }}>{m.corpo}</p>
                {!m.lida && <button style={BTN_G} onClick={() => marcarLida(m.id)}>Marcar como lida</button>}
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
