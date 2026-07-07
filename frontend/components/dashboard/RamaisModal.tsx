'use client';
import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';

interface Ramal { id: string; nome: string; setor: string | null; numero: string; ativo: boolean; }

export function RamaisModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [ramais, setRamais] = useState<Ramal[]>([]);
  const [loading, setLoading] = useState(false);
  const [busca, setBusca] = useState('');

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    apiFetch<Ramal[]>('/ramais')
      .then(r => setRamais(r.filter(x => x.ativo)))
      .catch(() => setRamais([]))
      .finally(() => setLoading(false));
  }, [open]);

  if (!open) return null;

  const filtrados = ramais.filter(r => {
    if (!busca.trim()) return true;
    const s = busca.toLowerCase();
    return r.nome.toLowerCase().includes(s) || (r.setor ?? '').toLowerCase().includes(s) || r.numero.includes(s);
  });

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: 'var(--white)', borderRadius: 10, width: 420, maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 10px 40px rgba(0,0,0,.18)' }}>
        <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid var(--gray-200)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Ramais da Instituição</h2>
            <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--gray-400)', lineHeight: 1 }}>×</button>
          </div>
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar por nome, setor ou número..."
            style={{ width: '100%', padding: '8px 10px', borderRadius: 5, border: '1px solid var(--gray-300)', fontSize: 13, boxSizing: 'border-box' }} />
        </div>

        <div style={{ overflowY: 'auto', flex: 1 }}>
          {loading && <p style={{ padding: 20, textAlign: 'center', color: 'var(--gray-500)', fontSize: 13 }}>Carregando...</p>}
          {!loading && filtrados.length === 0 && (
            <p style={{ padding: 20, textAlign: 'center', color: 'var(--gray-400)', fontSize: 13 }}>
              {busca.trim() ? 'Nenhum ramal encontrado.' : 'Nenhum ramal cadastrado ainda.'}
            </p>
          )}
          {!loading && filtrados.map(r => (
            <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 22px', borderBottom: '1px solid var(--gray-100)' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-700)' }}>{r.nome}</div>
                {r.setor && <div style={{ fontSize: 11.5, color: 'var(--gray-400)' }}>{r.setor}</div>}
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#1a56db', fontFamily: 'monospace', flexShrink: 0, marginLeft: 12 }}>
                {r.numero}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
