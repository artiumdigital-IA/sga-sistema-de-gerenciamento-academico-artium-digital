'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';

type StatusProcesso = 'ABERTO' | 'ENCERRADO' | 'CANCELADO';
type TipoProcesso = 'VESTIBULAR' | 'ENEM' | 'SEGUNDA_GRADUACAO' | 'TRANSFERENCIA_EXTERNA' | 'TRANSFERENCIA_INTERNA';

interface Curso { id: string; nome: string; }
interface Periodo { id: string; ano: number; semestre: number; }
interface Processo {
  id: string; nome: string; tipo: TipoProcesso; status: StatusProcesso;
  vagas: number; dataAbertura: string; dataEncerramento: string;
  curso: Curso; periodoLetivo: Periodo;
  _count?: { inscricoes: number };
}

const TIPO_LABEL: Record<TipoProcesso, string> = {
  VESTIBULAR: 'Vestibular', ENEM: 'ENEM', SEGUNDA_GRADUACAO: 'Segunda Graduação',
  TRANSFERENCIA_EXTERNA: 'Transf. Externa', TRANSFERENCIA_INTERNA: 'Transf. Interna',
};
const STATUS_STYLE: Record<StatusProcesso, { bg: string; color: string }> = {
  ABERTO: { bg: '#d1fae5', color: '#065f46' },
  ENCERRADO: { bg: '#f3f4f6', color: '#374151' },
  CANCELADO: { bg: '#fee2e2', color: '#991b1b' },
};

const INPUT: React.CSSProperties = { padding: '7px 10px', borderRadius: 5, border: '1px solid #d1d5db', fontSize: 13, width: '100%', boxSizing: 'border-box' };
const BTN_P: React.CSSProperties = { padding: '7px 16px', borderRadius: 5, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, background: '#1a56db', color: '#fff' };
const BTN_G: React.CSSProperties = { ...BTN_P, background: 'transparent', color: '#374151', border: '1px solid #d1d5db' };
const LBL: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 3 };

interface FormData {
  nome: string; tipo: TipoProcesso; cursoId: string; periodoLetivoId: string;
  vagas: string; dataAbertura: string; dataEncerramento: string; status?: StatusProcesso;
}

function ProcessoModal({ processo, cursos, periodos, onClose, onSave }: {
  processo: Processo | null; cursos: Curso[]; periodos: Periodo[];
  onClose: () => void; onSave: () => void;
}) {
  const [form, setForm] = useState<FormData>({
    nome: processo?.nome ?? '', tipo: processo?.tipo ?? 'VESTIBULAR',
    cursoId: processo?.curso.id ?? '', periodoLetivoId: processo?.periodoLetivo.id ?? '',
    vagas: String(processo?.vagas ?? ''), dataAbertura: processo?.dataAbertura?.slice(0, 10) ?? '',
    dataEncerramento: processo?.dataEncerramento?.slice(0, 10) ?? '',
    status: processo?.status,
  });
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState('');

  const set = (k: keyof FormData, v: string) => setForm(f => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErro(''); setSaving(true);
    try {
      const body = { ...form, vagas: Number(form.vagas) };
      if (processo) await apiFetch(`/processos-seletivos/${processo.id}`, { method: 'PATCH', body: JSON.stringify(body) });
      else await apiFetch('/processos-seletivos', { method: 'POST', body: JSON.stringify(body) });
      onSave(); onClose();
    } catch (e: any) { setErro(e.message ?? 'Erro'); }
    finally { setSaving(false); }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: '#fff', borderRadius: 10, padding: 28, width: 540, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 10px 40px rgba(0,0,0,.18)' }}>
        <h2 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700 }}>{processo ? 'Editar Processo' : 'Novo Processo Seletivo'}</h2>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div><label style={LBL}>Nome *</label><input style={INPUT} value={form.nome} onChange={e => set('nome', e.target.value)} required /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label style={LBL}>Tipo *</label>
              <select style={INPUT} value={form.tipo} onChange={e => set('tipo', e.target.value as TipoProcesso)}>
                {(Object.entries(TIPO_LABEL) as [TipoProcesso, string][]).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div><label style={LBL}>Vagas *</label><input style={INPUT} type="number" min="1" value={form.vagas} onChange={e => set('vagas', e.target.value)} required /></div>
          </div>
          <div><label style={LBL}>Curso *</label>
            <select style={INPUT} value={form.cursoId} onChange={e => set('cursoId', e.target.value)} required>
              <option value="">Selecione...</option>
              {cursos.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
          <div><label style={LBL}>Período Letivo de destino *</label>
            <select style={INPUT} value={form.periodoLetivoId} onChange={e => set('periodoLetivoId', e.target.value)} required>
              <option value="">Selecione...</option>
              {periodos.map(p => <option key={p.id} value={p.id}>{p.ano}/{p.semestre}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label style={LBL}>Abertura *</label><input style={INPUT} type="date" value={form.dataAbertura} onChange={e => set('dataAbertura', e.target.value)} required /></div>
            <div><label style={LBL}>Encerramento *</label><input style={INPUT} type="date" value={form.dataEncerramento} onChange={e => set('dataEncerramento', e.target.value)} required /></div>
          </div>
          {processo && (
            <div><label style={LBL}>Status</label>
              <select style={INPUT} value={form.status} onChange={e => set('status', e.target.value)}>
                <option value="ABERTO">Aberto</option>
                <option value="ENCERRADO">Encerrado</option>
                <option value="CANCELADO">Cancelado</option>
              </select>
            </div>
          )}
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

export default function ProcessosPage() {
  const router = useRouter();
  const [processos, setProcessos] = useState<Processo[]>([]);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [periodos, setPeriodos] = useState<Periodo[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<Processo | 'new' | null>(null);
  const [deleting, setDeleting] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try { setProcessos(await apiFetch<Processo[]>('/processos-seletivos')); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    load();
    apiFetch<Curso[]>('/cursos').then(setCursos).catch(() => {});
    apiFetch<Periodo[]>('/periodos-letivos').then(setPeriodos).catch(() => {});
  }, [load]);

  async function del(id: string) {
    if (!confirm('Excluir este processo seletivo?')) return;
    setDeleting(id);
    try { await apiFetch(`/processos-seletivos/${id}`, { method: 'DELETE' }); await load(); }
    finally { setDeleting(''); }
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Processos Seletivos</h1>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: '#6b7280' }}>{processos.length} processo{processos.length !== 1 ? 's' : ''}</p>
        </div>
        <button style={BTN_P} onClick={() => setModal('new')}>+ Novo Processo</button>
      </div>

      {loading && <p style={{ color: '#6b7280', fontSize: 13 }}>Carregando...</p>}
      {!loading && processos.length === 0 && <p style={{ color: '#6b7280', fontSize: 13 }}>Nenhum processo seletivo cadastrado.</p>}

      {!loading && processos.length > 0 && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ background: '#f9fafb' }}>
              {['Nome', 'Tipo', 'Curso', 'Período', 'Vagas', 'Inscritos', 'Datas', 'Status', ''].map(h => (
                <th key={h} style={{ padding: '10px 12px', fontSize: 11, fontWeight: 600, color: '#6b7280', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>{processos.map(p => {
              const ss = STATUS_STYLE[p.status];
              return (
                <tr key={p.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 500 }}>{p.nome}</td>
                  <td style={{ padding: '10px 12px', fontSize: 12 }}>{TIPO_LABEL[p.tipo]}</td>
                  <td style={{ padding: '10px 12px', fontSize: 12 }}>{p.curso.nome}</td>
                  <td style={{ padding: '10px 12px', fontSize: 12 }}>{p.periodoLetivo.ano}/{p.periodoLetivo.semestre}</td>
                  <td style={{ padding: '10px 12px', fontSize: 13 }}>{p.vagas}</td>
                  <td style={{ padding: '10px 12px', fontSize: 13 }}>{p._count?.inscricoes ?? 0}</td>
                  <td style={{ padding: '10px 12px', fontSize: 11, color: '#6b7280' }}>
                    {new Date(p.dataAbertura).toLocaleDateString('pt-BR')} →<br />
                    {new Date(p.dataEncerramento).toLocaleDateString('pt-BR')}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600, ...ss }}>{p.status}</span>
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => router.push(`/dashboard/ingresso/processos/${p.id}`)} style={{ padding: '4px 10px', fontSize: 12, borderRadius: 4, border: '1px solid #2563eb', background: '#eff6ff', color: '#2563eb', cursor: 'pointer', fontWeight: 500 }}>Inscrições</button>
                      <button onClick={() => setModal(p)} style={{ padding: '4px 10px', fontSize: 12, borderRadius: 4, border: '1px solid #d1d5db', background: '#fff', color: '#374151', cursor: 'pointer' }}>Editar</button>
                      <button onClick={() => del(p.id)} disabled={deleting === p.id} style={{ padding: '4px 10px', fontSize: 12, borderRadius: 4, border: '1px solid #fca5a5', background: '#fef2f2', color: '#dc2626', cursor: 'pointer' }}>{deleting === p.id ? '...' : 'Excluir'}</button>
                    </div>
                  </td>
                </tr>
              );
            })}</tbody>
          </table>
        </div>
      )}

      {modal !== null && (
        <ProcessoModal
          processo={modal === 'new' ? null : modal}
          cursos={cursos} periodos={periodos}
          onClose={() => setModal(null)} onSave={load}
        />
      )}
    </div>
  );
}
