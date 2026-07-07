'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';

type Semestre = 'S1' | 'S2';
type PeriodoStatus = 'PLANEJADO' | 'EM_ANDAMENTO' | 'ENCERRADO';

interface PeriodoLetivo {
  id: string;
  ano: number;
  semestre: Semestre;
  dataInicio: string;
  dataFim: string;
  status: PeriodoStatus;
  semanasLetivas: number | null;
  diasLetivos: number | null;
}

interface EventoCalendario {
  id: string;
  periodoLetivoId: string;
  grupo: string | null;
  titulo: string;
  dataInicio: string;
  dataFim: string | null;
  observacoes: string | null;
  ordem: number;
}

type FormEvento = {
  grupo: string;
  titulo: string;
  dataInicio: string;
  dataFim: string;
  observacoes: string;
  ordem: number;
};

const EMPTY_EVENTO: FormEvento = { grupo: '', titulo: '', dataInicio: '', dataFim: '', observacoes: '', ordem: 0 };

const INPUT: React.CSSProperties = { padding: '8px 10px', borderRadius: 5, border: '1px solid var(--gray-300)', fontSize: 13, boxSizing: 'border-box', width: '100%' };
const LABEL: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--gray-700)', marginBottom: 4 };
const BTN_PRIMARY: React.CSSProperties = { padding: '8px 16px', borderRadius: 5, border: 'none', background: '#1a56db', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 };
const BTN_DANGER: React.CSSProperties = { padding: '6px 12px', borderRadius: 5, border: 'none', background: '#dc2626', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600 };
const BTN_GHOST: React.CSSProperties = { padding: '6px 12px', borderRadius: 5, border: '1px solid var(--gray-300)', cursor: 'pointer', fontSize: 12, background: 'var(--white)', color: 'var(--gray-700)' };

function fmt(d: string | null) {
  if (!d) return '—';
  const [y, m, day] = d.slice(0, 10).split('-');
  return `${day}/${m}/${y}`;
}

function EventoModal({ evento, periodoLetivoId, gruposExistentes, onClose, onSave }: {
  evento: EventoCalendario | null;
  periodoLetivoId: string;
  gruposExistentes: string[];
  onClose: () => void;
  onSave: () => void;
}) {
  const [form, setForm] = useState<FormEvento>(
    evento
      ? {
          grupo: evento.grupo ?? '',
          titulo: evento.titulo,
          dataInicio: evento.dataInicio?.slice(0, 10) ?? '',
          dataFim: evento.dataFim?.slice(0, 10) ?? '',
          observacoes: evento.observacoes ?? '',
          ordem: evento.ordem,
        }
      : EMPTY_EVENTO
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k: keyof FormEvento, v: string | number) => setForm(f => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!form.titulo.trim() || !form.dataInicio) { setError('Preencha título e data de início.'); return; }
    setSaving(true);
    try {
      const body = {
        periodoLetivoId,
        grupo: form.grupo.trim() || undefined,
        titulo: form.titulo.trim(),
        dataInicio: form.dataInicio,
        dataFim: form.dataFim || undefined,
        observacoes: form.observacoes.trim() || undefined,
        ordem: Number(form.ordem) || 0,
      };
      if (evento) {
        await apiFetch(`/eventos-calendario/${evento.id}`, { method: 'PATCH', body: JSON.stringify(body) });
      } else {
        await apiFetch('/eventos-calendario', { method: 'POST', body: JSON.stringify(body) });
      }
      onSave();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: 'var(--white)', borderRadius: 10, padding: 28, width: 480, boxShadow: '0 10px 40px rgba(0,0,0,.18)' }}>
        <h2 style={{ margin: '0 0 20px', fontSize: 17, fontWeight: 700 }}>
          {evento ? 'Editar item do calendário' : 'Novo item do calendário'}
        </h2>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={LABEL}>Grupo (opcional — ex.: &quot;Exames Finais&quot;)</label>
            <input style={INPUT} list="grupos-calendario-list" value={form.grupo}
              placeholder="Deixe em branco para item avulso"
              onChange={e => set('grupo', e.target.value)} />
            <datalist id="grupos-calendario-list">
              {gruposExistentes.map(g => <option key={g} value={g} />)}
            </datalist>
          </div>
          <div>
            <label style={LABEL}>Título / Etapa *</label>
            <input style={INPUT} value={form.titulo} required
              placeholder="Ex.: Início das Aulas"
              onChange={e => set('titulo', e.target.value)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={LABEL}>Data de início *</label>
              <input style={INPUT} type="date" value={form.dataInicio} required onChange={e => set('dataInicio', e.target.value)} />
            </div>
            <div>
              <label style={LABEL}>Data de fim (opcional)</label>
              <input style={INPUT} type="date" value={form.dataFim} onChange={e => set('dataFim', e.target.value)} />
            </div>
          </div>
          <div>
            <label style={LABEL}>Observações (opcional)</label>
            <textarea style={{ ...INPUT, minHeight: 60, resize: 'vertical' as const }} value={form.observacoes}
              onChange={e => set('observacoes', e.target.value)} />
          </div>
          <div>
            <label style={LABEL}>Ordem de exibição</label>
            <input style={{ ...INPUT, width: 100 }} type="number" min={0} value={form.ordem}
              onChange={e => set('ordem', Number(e.target.value))} />
          </div>
          {error && <p style={{ color: '#e02424', fontSize: 13, margin: 0 }}>{error}</p>}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
            <button type="button" style={BTN_GHOST} onClick={onClose}>Cancelar</button>
            <button type="submit" style={BTN_PRIMARY} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CalendarioAcademicoPeriodoPage() {
  const params = useParams();
  const router = useRouter();
  const periodoId = params.id as string;

  const [periodo, setPeriodo] = useState<PeriodoLetivo | null>(null);
  const [eventos, setEventos] = useState<EventoCalendario[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [modal, setModal] = useState<'new' | EventoCalendario | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const [semanasLetivas, setSemanasLetivas] = useState('');
  const [diasLetivos, setDiasLetivos] = useState('');
  const [salvandoMeta, setSalvandoMeta] = useState(false);

  const carregar = useCallback(async () => {
    setLoading(true); setErro('');
    try {
      const [p, ev] = await Promise.all([
        apiFetch<PeriodoLetivo>(`/periodos-letivos/${periodoId}`),
        apiFetch<EventoCalendario[]>(`/eventos-calendario?periodoLetivoId=${periodoId}`),
      ]);
      setPeriodo(p);
      setEventos(ev);
      setSemanasLetivas(p.semanasLetivas != null ? String(p.semanasLetivas) : '');
      setDiasLetivos(p.diasLetivos != null ? String(p.diasLetivos) : '');
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : 'Erro ao carregar');
    } finally {
      setLoading(false);
    }
  }, [periodoId]);

  useEffect(() => { carregar(); }, [carregar]);

  const gruposExistentes = useMemo(() => {
    const set = new Set<string>();
    eventos.forEach(e => { if (e.grupo) set.add(e.grupo); });
    return Array.from(set).sort();
  }, [eventos]);

  async function salvarMeta() {
    setSalvandoMeta(true);
    try {
      await apiFetch(`/periodos-letivos/${periodoId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          semanasLetivas: semanasLetivas ? Number(semanasLetivas) : undefined,
          diasLetivos: diasLetivos ? Number(diasLetivos) : undefined,
        }),
      });
      carregar();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Erro ao salvar');
    } finally {
      setSalvandoMeta(false);
    }
  }

  async function deletar(id: string) {
    if (!confirm('Excluir este item do calendário?')) return;
    setDeleting(id);
    try {
      await apiFetch(`/eventos-calendario/${id}`, { method: 'DELETE' });
      setEventos(ev => ev.filter(x => x.id !== id));
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Erro ao excluir');
    } finally {
      setDeleting(null);
    }
  }

  if (loading) return <div style={{ padding: 28 }}>Carregando...</div>;
  if (erro) return <div style={{ padding: 28, color: '#dc2626' }}>{erro}</div>;
  if (!periodo) return null;

  let ultimoGrupo: string | null = null;

  return (
    <div style={{ padding: '24px 28px' }}>
      <button style={{ ...BTN_GHOST, marginBottom: 16 }} onClick={() => router.back()}>← Voltar</button>

      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700 }}>Calendário Acadêmico</h1>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--gray-500)' }}>
            Período {periodo.ano}/{periodo.semestre === 'S1' ? '1' : '2'} · {fmt(periodo.dataInicio)} a {fmt(periodo.dataFim)}
          </p>
        </div>
        <button style={BTN_PRIMARY}
          onClick={() => window.open(`/dashboard/secretaria/documentos/calendario-academico/${periodoId}`, '_blank')}>
          🖨️ Gerar documento
        </button>
      </div>

      <div style={{ background: 'var(--gray-50)', border: '1px solid var(--gray-200)', borderRadius: 8, padding: 16, marginBottom: 20, display: 'flex', alignItems: 'flex-end', gap: 16 }}>
        <div>
          <label style={LABEL}>Semanas letivas</label>
          <input style={{ ...INPUT, width: 120 }} type="number" min={0} value={semanasLetivas}
            onChange={e => setSemanasLetivas(e.target.value)} />
        </div>
        <div>
          <label style={LABEL}>Dias letivos</label>
          <input style={{ ...INPUT, width: 120 }} type="number" min={0} value={diasLetivos}
            onChange={e => setDiasLetivos(e.target.value)} />
        </div>
        <button style={BTN_PRIMARY} disabled={salvandoMeta} onClick={salvarMeta}>
          {salvandoMeta ? 'Salvando...' : 'Salvar'}
        </button>
        <p style={{ margin: '0 0 8px auto', fontSize: 12, color: 'var(--gray-400)', maxWidth: 260 }}>
          Metadados informativos (não afetam cálculo de frequência/notas).
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Itens do calendário</h3>
        <button style={BTN_PRIMARY} onClick={() => setModal('new')}>+ Novo item</button>
      </div>

      <div style={{ background: 'var(--white)', border: '1px solid var(--gray-200)', borderRadius: 8, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
              {['Grupo', 'Título / Etapa', 'Início', 'Fim', 'Observações', ''].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--gray-700)', fontSize: 12 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {eventos.length === 0 && (
              <tr><td colSpan={6} style={{ padding: 24, textAlign: 'center', color: 'var(--gray-400)' }}>
                Nenhum item cadastrado ainda para este período.
              </td></tr>
            )}
            {eventos.map((e, i) => {
              const mostraGrupo = e.grupo !== ultimoGrupo;
              ultimoGrupo = e.grupo;
              return (
                <tr key={e.id} style={{ borderBottom: '1px solid var(--gray-100)', background: i % 2 ? 'var(--gray-50)' : 'var(--white)' }}>
                  <td style={{ padding: '10px 14px', color: 'var(--gray-500)', fontStyle: e.grupo ? 'normal' : 'italic' }}>
                    {e.grupo ? (mostraGrupo ? e.grupo : '') : '—'}
                  </td>
                  <td style={{ padding: '10px 14px', fontWeight: e.grupo ? 400 : 600, paddingLeft: e.grupo ? 24 : 14 }}>
                    {e.titulo}
                  </td>
                  <td style={{ padding: '10px 14px' }}>{fmt(e.dataInicio)}</td>
                  <td style={{ padding: '10px 14px' }}>{fmt(e.dataFim)}</td>
                  <td style={{ padding: '10px 14px', color: 'var(--gray-500)' }}>{e.observacoes ?? '—'}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button style={{ ...BTN_GHOST, padding: '4px 10px' }} onClick={() => setModal(e)}>Editar</button>
                      <button style={BTN_DANGER} disabled={deleting === e.id} onClick={() => deletar(e.id)}>
                        {deleting === e.id ? '...' : 'Excluir'}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {modal !== null && (
        <EventoModal
          evento={modal === 'new' ? null : modal}
          periodoLetivoId={periodoId}
          gruposExistentes={gruposExistentes}
          onClose={() => setModal(null)}
          onSave={carregar}
        />
      )}
    </div>
  );
}
