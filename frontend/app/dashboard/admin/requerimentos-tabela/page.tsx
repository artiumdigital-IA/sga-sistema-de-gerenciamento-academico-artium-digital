'use client';
import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';

interface TipoRequerimento {
  id: string;
  nome: string;
  prazoDias: number | null;
  local: string | null;
  taxa: number | string;
  observacaoTaxa: string | null;
  exigeAnexo: boolean;
  ativo: boolean;
  ordem: number;
}

type FormData = {
  nome: string;
  prazoDias: string;
  local: string;
  taxa: string;
  observacaoTaxa: string;
  ordem: string;
  exigeAnexo: boolean;
};

const EMPTY: FormData = { nome: '', prazoDias: '', local: '', taxa: '', observacaoTaxa: '', ordem: '0', exigeAnexo: false };

const INPUT: React.CSSProperties = { padding: '8px 10px', borderRadius: 5, border: '1px solid var(--gray-300)', fontSize: 13, boxSizing: 'border-box', width: '100%' };
const LABEL: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--gray-700)', marginBottom: 4 };
const BTN_P: React.CSSProperties = { padding: '8px 16px', borderRadius: 5, border: 'none', background: '#1a56db', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 };
const BTN_G: React.CSSProperties = { padding: '6px 12px', borderRadius: 5, border: '1px solid var(--gray-300)', cursor: 'pointer', fontSize: 12, background: 'var(--white)', color: 'var(--gray-700)' };

function formatarTaxa(t: TipoRequerimento): string {
  if (Number(t.taxa) === 0) return t.observacaoTaxa ? `Gratuito (${t.observacaoTaxa})` : 'Gratuito';
  const valor = Number(t.taxa).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return t.observacaoTaxa ? `${valor} (${t.observacaoTaxa})` : valor;
}

function ModalForm({ item, onClose, onSaved }: { item: TipoRequerimento | 'novo' | null; onClose: () => void; onSaved: () => void }) {
  const editando = item !== 'novo' && item !== null;
  const [form, setForm] = useState<FormData>(
    editando
      ? {
          nome: item.nome,
          prazoDias: item.prazoDias?.toString() ?? '',
          local: item.local ?? '',
          taxa: String(item.taxa),
          observacaoTaxa: item.observacaoTaxa ?? '',
          ordem: String(item.ordem),
          exigeAnexo: item.exigeAnexo,
        }
      : EMPTY,
  );
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  const set = (k: keyof FormData, v: string | boolean) => setForm(f => ({ ...f, [k]: v }));

  async function salvar() {
    if (!form.nome.trim() || !form.taxa.trim()) { setErro('Preencha nome e taxa.'); return; }
    setErro('');
    setSalvando(true);
    const body = {
      nome: form.nome.trim(),
      prazoDias: form.prazoDias.trim() ? Number(form.prazoDias) : undefined,
      local: form.local.trim() || undefined,
      taxa: Number(form.taxa.replace(',', '.')),
      observacaoTaxa: form.observacaoTaxa.trim() || undefined,
      ordem: form.ordem.trim() ? Number(form.ordem) : undefined,
      exigeAnexo: form.exigeAnexo,
    };
    try {
      if (editando) {
        await apiFetch(`/tipos-requerimento/${item.id}`, { method: 'PATCH', body: JSON.stringify(body) });
      } else {
        await apiFetch('/tipos-requerimento', { method: 'POST', body: JSON.stringify(body) });
      }
      onSaved();
      onClose();
    } catch (e: any) {
      setErro(e.message ?? 'Erro ao salvar.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ background: 'var(--white)', borderRadius: 8, padding: 24, width: 460, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>{editando ? 'Editar Requerimento' : 'Novo Requerimento'}</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={LABEL}>Nome *</label>
            <input style={INPUT} value={form.nome} onChange={e => set('nome', e.target.value)} placeholder="Ex: Declaração de Matrícula" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={LABEL}>Prazo (dias)</label>
              <input style={INPUT} type="number" min={0} value={form.prazoDias} onChange={e => set('prazoDias', e.target.value)} />
            </div>
            <div>
              <label style={LABEL}>Local</label>
              <input style={INPUT} value={form.local} onChange={e => set('local', e.target.value)} placeholder="Ex: Secretaria" />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={LABEL}>Taxa (R$) *</label>
              <input style={INPUT} value={form.taxa} onChange={e => set('taxa', e.target.value)} placeholder="Ex: 80,00" />
            </div>
            <div>
              <label style={LABEL}>Observação da taxa</label>
              <input style={INPUT} value={form.observacaoTaxa} onChange={e => set('observacaoTaxa', e.target.value)} placeholder="Ex: POR DISCIPLINA" />
            </div>
          </div>
          <div>
            <label style={LABEL}>Ordem de exibição</label>
            <input style={INPUT} type="number" value={form.ordem} onChange={e => set('ordem', e.target.value)} />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--gray-700)' }}>
            <input type="checkbox" checked={form.exigeAnexo} onChange={e => set('exigeAnexo', e.target.checked)} />
            Exige que o aluno anexe um certificado (foto/PDF) ao solicitar
          </label>
          {erro && <p style={{ color: '#dc2626', fontSize: 12, margin: 0 }}>{erro}</p>}
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 18 }}>
          <button style={BTN_G} onClick={onClose}>Cancelar</button>
          <button style={BTN_P} disabled={salvando} onClick={salvar}>{salvando ? 'Salvando...' : 'Salvar'}</button>
        </div>
      </div>
    </div>
  );
}

function ModalTabela({ onClose }: { onClose: () => void }) {
  const [itens, setItens] = useState<TipoRequerimento[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<TipoRequerimento | 'novo' | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    try { setItens(await apiFetch<TipoRequerimento[]>('/tipos-requerimento')); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  async function alternarAtivo(t: TipoRequerimento) {
    try { await apiFetch(`/tipos-requerimento/${t.id}`, { method: 'PATCH', body: JSON.stringify({ ativo: !t.ativo }) }); carregar(); }
    catch (e: any) { alert(e.message ?? 'Erro'); }
  }

  async function remover(id: string) {
    if (!confirm('Remover este requerimento da tabela de preços?')) return;
    try { await apiFetch(`/tipos-requerimento/${id}`, { method: 'DELETE' }); carregar(); }
    catch (e: any) { alert(e.message ?? 'Erro ao remover'); }
  }

  const th: React.CSSProperties = { padding: '8px 10px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--gray-500)', borderBottom: '1px solid var(--gray-200)', whiteSpace: 'nowrap' };
  const td: React.CSSProperties = { padding: '8px 10px', fontSize: 12, borderBottom: '1px solid var(--gray-100)' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={onClose}>
      <div style={{ background: 'var(--white)', borderRadius: 8, padding: 20, width: '100%', maxWidth: 900, maxHeight: '88vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h3 style={{ margin: 0, fontSize: 16 }}>Tabela de Preços — Requerimentos</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={BTN_P} onClick={() => setForm('novo')}>+ Novo</button>
            <button style={BTN_G} onClick={onClose}>Fechar</button>
          </div>
        </div>

        {loading ? <p style={{ color: 'var(--gray-500)', fontSize: 13 }}>Carregando...</p> : (
          <div style={{ border: '1px solid var(--gray-200)', borderRadius: 8, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--gray-50)' }}>
                  {['Requerimento', 'Prazo (dias)', 'Local', 'Taxa (R$)', 'Anexo', 'Status', ''].map(h => <th key={h} style={th}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {itens.length === 0 && <tr><td colSpan={7} style={{ ...td, textAlign: 'center', color: 'var(--gray-400)' }}>Nenhum requerimento cadastrado.</td></tr>}
                {itens.map(t => (
                  <tr key={t.id}>
                    <td style={td}>{t.nome}</td>
                    <td style={td}>{t.prazoDias ?? '—'}</td>
                    <td style={td}>{t.local ?? '—'}</td>
                    <td style={td}>{formatarTaxa(t)}</td>
                    <td style={td}>{t.exigeAnexo ? 'Sim' : '—'}</td>
                    <td style={td}>
                      <button onClick={() => alternarAtivo(t)} style={{ padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer', background: t.ativo ? '#d1fae5' : 'var(--gray-100)', color: t.ativo ? '#065f46' : 'var(--gray-500)' }}>
                        {t.ativo ? 'Ativo' : 'Inativo'}
                      </button>
                    </td>
                    <td style={td}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button style={BTN_G} onClick={() => setForm(t)}>Editar</button>
                        <button style={{ ...BTN_G, color: '#dc2626', borderColor: '#fecaca' }} onClick={() => remover(t.id)}>Remover</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {form !== null && <ModalForm item={form} onClose={() => setForm(null)} onSaved={carregar} />}
    </div>
  );
}

export default function RequerimentosAdminPage() {
  const [mostrarTabela, setMostrarTabela] = useState(false);

  return (
    <div style={{ padding: '24px 28px' }}>
      <h1 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700 }}>Requerimentos</h1>
      <p style={{ margin: '0 0 20px', fontSize: 13, color: 'var(--gray-500)' }}>
        Tabela de preços dos requerimentos que o aluno pode solicitar pelo autoatendimento (Menu Discente) —
        prazo, local e taxa de cada item. Requerimentos abertos pelos alunos aparecem em Secretaria &gt; Requerimentos.
      </p>
      <button style={BTN_P} onClick={() => setMostrarTabela(true)}>Tabela de Preços</button>

      {mostrarTabela && <ModalTabela onClose={() => setMostrarTabela(false)} />}
    </div>
  );
}
