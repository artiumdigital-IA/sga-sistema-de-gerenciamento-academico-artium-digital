'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';

interface Periodo { id: string; ano: number; semestre: number; status: string; }
interface Oferta {
  id: string; vagas: number; turno: string; horario: string | null; disciplinaId: string;
  disciplina: { id: string; nome: string; codigo: string; };
  professor: { nome: string; } | null;
  _count?: { matriculas: number };
}
interface Matricula {
  id: string; status: string; isDependencia: boolean;
  aluno: { id: string; ra: string; nome: string; };
  oferta: { id: string; disciplinaId: string; };
}

const INPUT: React.CSSProperties = { padding: '7px 10px', borderRadius: 5, border: '1px solid #d1d5db', fontSize: 13, boxSizing: 'border-box', width: '100%' };
const LABEL: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 };
const BTN_P: React.CSSProperties = { padding: '6px 14px', borderRadius: 5, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, background: '#1a56db', color: '#fff' };
const BTN_G: React.CSSProperties = { ...BTN_P, background: 'transparent', color: '#374151', border: '1px solid #d1d5db' };

function ModalTransferir({ matricula, periodoId, onClose, onUpdate }: { matricula: Matricula; periodoId: string; onClose: () => void; onUpdate: () => void }) {
  const [ofertasDestino, setOfertasDestino] = useState<Oferta[]>([]);
  const [novaOfertaId, setNovaOfertaId] = useState('');
  const [motivo, setMotivo] = useState('');
  const [motivosSugeridos, setMotivosSugeridos] = useState<{ id: string; nome: string; ativo: boolean }[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    apiFetch<Oferta[]>(`/ofertas?periodoLetivoId=${periodoId}`).then(all => {
      setOfertasDestino(all.filter(o => o.disciplina.id === matricula.oferta.disciplinaId && o.id !== matricula.oferta.id));
    }).catch(() => {});
  }, [periodoId, matricula]);

  useEffect(() => {
    apiFetch<{ id: string; nome: string; ativo: boolean }[]>('/motivos-transferencia').then(setMotivosSugeridos).catch(() => {});
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErro(''); setSalvando(true);
    try {
      await apiFetch(`/matriculas/${matricula.id}/transferir`, {
        method: 'POST',
        body: JSON.stringify({ novaOfertaId, motivo: motivo || undefined }),
      });
      onUpdate(); onClose();
    } catch (e: any) { setErro(e.message ?? 'Erro ao transferir'); }
    finally { setSalvando(false); }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: '#fff', borderRadius: 10, padding: 28, width: 460, boxShadow: '0 10px 40px rgba(0,0,0,.18)' }}>
        <h2 style={{ margin: '0 0 2px', fontSize: 16, fontWeight: 700 }}>Transferir Turma — {matricula.aluno.nome}</h2>
        <p style={{ margin: '0 0 20px', fontSize: 12, color: '#6b7280' }}>RA {matricula.aluno.ra}</p>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={LABEL}>Turma de destino *</label>
            <select style={INPUT} value={novaOfertaId} onChange={e => setNovaOfertaId(e.target.value)} required>
              <option value="">Selecione...</option>
              {ofertasDestino.map(o => (
                <option key={o.id} value={o.id}>{o.turno}{o.horario ? ` — ${o.horario}` : ''} {o.professor ? `(${o.professor.nome})` : ''}</option>
              ))}
            </select>
            {ofertasDestino.length === 0 && (
              <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 6 }}>Nenhuma outra turma dessa disciplina nesse período letivo.</p>
            )}
          </div>
          <div>
            <label style={LABEL}>Motivo (opcional)</label>
            <input style={INPUT} list="motivos-transferencia-list" value={motivo} placeholder="Ex: conflito de horário" onChange={e => setMotivo(e.target.value)} />
            <datalist id="motivos-transferencia-list">
              {motivosSugeridos.filter(m => m.ativo).map(m => <option key={m.id} value={m.nome} />)}
            </datalist>
          </div>
          {erro && <p style={{ color: '#dc2626', fontSize: 12, margin: 0 }}>{erro}</p>}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
            <button type="button" style={BTN_G} onClick={onClose}>Cancelar</button>
            <button type="submit" style={BTN_P} disabled={salvando || !novaOfertaId}>{salvando ? 'Transferindo...' : 'Transferir'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function TransferenciaPage() {
  const [periodos, setPeriodos] = useState<Periodo[]>([]);
  const [ofertas, setOfertas] = useState<Oferta[]>([]);
  const [matriculas, setMatriculas] = useState<Matricula[]>([]);
  const [selectedPeriodo, setSelectedPeriodo] = useState('');
  const [selectedOferta, setSelectedOferta] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [modalMatricula, setModalMatricula] = useState<Matricula | null>(null);

  useEffect(() => { apiFetch<Periodo[]>('/periodos-letivos').then(setPeriodos).catch(() => {}); }, []);

  useEffect(() => {
    if (!selectedPeriodo) { setOfertas([]); setSelectedOferta(''); setMatriculas([]); return; }
    apiFetch<Oferta[]>(`/ofertas?periodoLetivoId=${selectedPeriodo}`).then(setOfertas).catch(() => {});
    setSelectedOferta(''); setMatriculas([]);
  }, [selectedPeriodo]);

  const carregarMatriculas = useCallback(async (ofertaId: string) => {
    if (!ofertaId) { setMatriculas([]); return; }
    setLoading(true); setErro('');
    try { setMatriculas(await apiFetch<Matricula[]>(`/matriculas?ofertaId=${ofertaId}`)); }
    catch (e: any) { setErro(e.message ?? 'Erro ao carregar'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { carregarMatriculas(selectedOferta); }, [selectedOferta, carregarMatriculas]);

  return (
    <div style={{ padding: '24px 28px' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700 }}>Transferência de Turma</h1>
        <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>Selecione a turma de origem e transfira alunos para outra turma da mesma disciplina.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 12, marginBottom: 20, background: '#f9fafb', padding: 16, borderRadius: 8, border: '1px solid #e5e7eb' }}>
        <div>
          <label style={LABEL}>Período Letivo</label>
          <select style={INPUT} value={selectedPeriodo} onChange={e => setSelectedPeriodo(e.target.value)}>
            <option value="">Selecione...</option>
            {periodos.map(p => <option key={p.id} value={p.id}>{p.ano}/{p.semestre}</option>)}
          </select>
        </div>
        <div>
          <label style={LABEL}>Turma de origem</label>
          <select style={INPUT} value={selectedOferta} onChange={e => setSelectedOferta(e.target.value)} disabled={!selectedPeriodo}>
            <option value="">Selecione o período primeiro...</option>
            {ofertas.map(o => <option key={o.id} value={o.id}>{o.disciplina.nome} — {o.turno}{o.horario ? ` (${o.horario})` : ''}</option>)}
          </select>
        </div>
      </div>

      {loading && <p style={{ color: '#6b7280', fontSize: 13 }}>Carregando...</p>}
      {erro && <p style={{ color: '#dc2626', fontSize: 13 }}>{erro}</p>}
      {!loading && selectedOferta && matriculas.length === 0 && (
        <p style={{ color: '#6b7280', fontSize: 13 }}>Nenhum aluno matriculado nesta turma.</p>
      )}

      {!loading && matriculas.length > 0 && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ background: '#f9fafb' }}>
              {['RA', 'Nome', 'Status', 'Ações'].map(h => (
                <th key={h} style={{ padding: '10px 12px', fontSize: 11, fontWeight: 600, color: '#6b7280', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>{matriculas.map(m => (
              <tr key={m.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 600 }}>{m.aluno.ra}</td>
                <td style={{ padding: '10px 12px', fontSize: 13 }}>
                  {m.aluno.nome}
                  {m.isDependencia && <span style={{ marginLeft: 6, fontSize: 10, background: '#f3e8ff', color: '#6b21a8', padding: '1px 6px', borderRadius: 999, fontWeight: 600 }}>DP</span>}
                </td>
                <td style={{ padding: '10px 12px', fontSize: 13 }}>{m.status}</td>
                <td style={{ padding: '10px 12px' }}>
                  <button onClick={() => setModalMatricula(m)} style={{ padding: '4px 10px', fontSize: 12, borderRadius: 4, border: '1px solid #ea580c', background: '#fff7ed', color: '#ea580c', cursor: 'pointer', fontWeight: 500 }}>
                    Transferir
                  </button>
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {modalMatricula && (
        <ModalTransferir matricula={modalMatricula} periodoId={selectedPeriodo} onClose={() => setModalMatricula(null)} onUpdate={() => carregarMatriculas(selectedOferta)} />
      )}
    </div>
  );
}
