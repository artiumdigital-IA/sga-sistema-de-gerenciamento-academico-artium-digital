'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';

interface Candidato {
  id: string; nome: string; cpf: string; email: string;
  telefone?: string; dataNascimento: string; sexo: string;
  corRaca?: string; nacionalidade: string;
}

const SEXO = { M: 'Masculino', F: 'Feminino', NAO_DECLARADO: 'Não declarado' };
const COR_RACA = { BRANCA: 'Branca', PRETA: 'Preta', PARDA: 'Parda', AMARELA: 'Amarela', INDIGENA: 'Indígena', NAO_DECLARADO: 'Não declarado' };
const INPUT: React.CSSProperties = { padding: '7px 10px', borderRadius: 5, border: '1px solid #d1d5db', fontSize: 13, width: '100%', boxSizing: 'border-box' };
const BTN_P: React.CSSProperties = { padding: '7px 16px', borderRadius: 5, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, background: '#1a56db', color: '#fff' };
const BTN_G: React.CSSProperties = { ...BTN_P, background: 'transparent', color: '#374151', border: '1px solid #d1d5db' };
const LBL: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 3 };

interface FormData { nome: string; cpf: string; email: string; telefone: string; dataNascimento: string; sexo: string; corRaca: string; nacionalidade: string; }

function CandidatoModal({ candidato, onClose, onSave }: { candidato: Candidato | null; onClose: () => void; onSave: () => void; }) {
  const [form, setForm] = useState<FormData>({
    nome: candidato?.nome ?? '', cpf: candidato?.cpf ?? '', email: candidato?.email ?? '',
    telefone: candidato?.telefone ?? '', dataNascimento: candidato?.dataNascimento?.slice(0, 10) ?? '',
    sexo: candidato?.sexo ?? 'M', corRaca: candidato?.corRaca ?? 'NAO_DECLARADO',
    nacionalidade: candidato?.nacionalidade ?? 'BRASILEIRA',
  });
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState('');
  const set = (k: keyof FormData, v: string) => setForm(f => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErro(''); setSaving(true);
    try {
      if (candidato) await apiFetch(`/candidatos/${candidato.id}`, { method: 'PATCH', body: JSON.stringify(form) });
      else await apiFetch('/candidatos', { method: 'POST', body: JSON.stringify(form) });
      onSave(); onClose();
    } catch (e: any) { setErro(e.message ?? 'Erro'); }
    finally { setSaving(false); }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: '#fff', borderRadius: 10, padding: 28, width: 520, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 10px 40px rgba(0,0,0,.18)' }}>
        <h2 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700 }}>{candidato ? 'Editar Candidato' : 'Novo Candidato'}</h2>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div><label style={LBL}>Nome *</label><input style={INPUT} value={form.nome} onChange={e => set('nome', e.target.value)} required /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label style={LBL}>CPF *</label><input style={INPUT} value={form.cpf} onChange={e => set('cpf', e.target.value)} required /></div>
            <div><label style={LBL}>Data de Nascimento *</label><input style={INPUT} type="date" value={form.dataNascimento} onChange={e => set('dataNascimento', e.target.value)} required /></div>
          </div>
          <div><label style={LBL}>E-mail *</label><input style={INPUT} type="email" value={form.email} onChange={e => set('email', e.target.value)} required /></div>
          <div><label style={LBL}>Telefone</label><input style={INPUT} value={form.telefone} onChange={e => set('telefone', e.target.value)} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label style={LBL}>Sexo</label>
              <select style={INPUT} value={form.sexo} onChange={e => set('sexo', e.target.value)}>
                {Object.entries(SEXO).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div><label style={LBL}>Cor/Raça</label>
              <select style={INPUT} value={form.corRaca} onChange={e => set('corRaca', e.target.value)}>
                {Object.entries(COR_RACA).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>
          <div><label style={LBL}>Nacionalidade</label><input style={INPUT} value={form.nacionalidade} onChange={e => set('nacionalidade', e.target.value)} /></div>
          {erro && <p style={{ color: '#dc2626', fontSize: 12, margin: 0 }}>{erro}</p>}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
            <button type="button" style={BTN_G} onClick={onClose}>Cancelar</button>
            <button type="submit" style={BTN_P} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CandidatosPage() {
  const [candidatos, setCandidatos] = useState<Candidato[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<Candidato | 'new' | null>(null);
  const [deleting, setDeleting] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try { setCandidatos(await apiFetch<Candidato[]>('/candidatos')); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function del(id: string) {
    if (!confirm('Excluir candidato?')) return;
    setDeleting(id);
    try { await apiFetch(`/candidatos/${id}`, { method: 'DELETE' }); await load(); }
    finally { setDeleting(''); }
  }

  const filtered = candidatos.filter(c =>
    c.nome.toLowerCase().includes(search.toLowerCase()) ||
    c.cpf.includes(search) || c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Candidatos</h1>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: '#6b7280' }}>{candidatos.length} candidato{candidatos.length !== 1 ? 's' : ''}</p>
        </div>
        <button style={BTN_P} onClick={() => setModal('new')}>+ Novo Candidato</button>
      </div>

      <input style={{ ...INPUT, marginBottom: 16, width: 300 }} placeholder="Buscar por nome, CPF ou e-mail..."
        value={search} onChange={e => setSearch(e.target.value)} />

      {loading && <p style={{ color: '#6b7280', fontSize: 13 }}>Carregando...</p>}
      {!loading && filtered.length === 0 && <p style={{ color: '#6b7280', fontSize: 13 }}>Nenhum candidato encontrado.</p>}

      {!loading && filtered.length > 0 && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ background: '#f9fafb' }}>
              {['Nome', 'CPF', 'E-mail', 'Telefone', 'Nascimento', ''].map(h => (
                <th key={h} style={{ padding: '10px 12px', fontSize: 11, fontWeight: 600, color: '#6b7280', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>{filtered.map(c => (
              <tr key={c.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 500 }}>{c.nome}</td>
                <td style={{ padding: '10px 12px', fontSize: 13 }}>{c.cpf}</td>
                <td style={{ padding: '10px 12px', fontSize: 13 }}>{c.email}</td>
                <td style={{ padding: '10px 12px', fontSize: 12, color: '#6b7280' }}>{c.telefone || '—'}</td>
                <td style={{ padding: '10px 12px', fontSize: 12 }}>{new Date(c.dataNascimento).toLocaleDateString('pt-BR')}</td>
                <td style={{ padding: '10px 12px' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => setModal(c)} style={{ padding: '4px 10px', fontSize: 12, borderRadius: 4, border: '1px solid #d1d5db', background: '#fff', color: '#374151', cursor: 'pointer' }}>Editar</button>
                    <button onClick={() => del(c.id)} disabled={deleting === c.id} style={{ padding: '4px 10px', fontSize: 12, borderRadius: 4, border: '1px solid #fca5a5', background: '#fef2f2', color: '#dc2626', cursor: 'pointer' }}>{deleting === c.id ? '...' : 'Excluir'}</button>
                  </div>
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {modal !== null && (
        <CandidatoModal candidato={modal === 'new' ? null : modal} onClose={() => setModal(null)} onSave={load} />
      )}
    </div>
  );
}
