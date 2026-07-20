'use client';
import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';

type TipoItem = 'LIVRO' | 'EQUIPAMENTO';
type StatusEmprestimo = 'EM_ANDAMENTO' | 'DEVOLVIDO' | 'PERDIDO';

interface UsuarioBasico {
  id: string; nome: string | null; email: string; perfil: string;
  aluno?: { nome: string } | null; professor?: { nome: string } | null;
}
interface LivroComExemplares {
  id: string; titulo: string;
  exemplares?: { id: string; codigoTombamento: string; status: string }[];
}
interface EquipamentoDisp { id: string; patrimonio: string; modelo: string; status: string; }
interface Emprestimo {
  id: string; tipoItem: TipoItem; status: StatusEmprestimo; emAtraso: boolean;
  dataEmprestimo: string; dataPrevistaDevolucao: string; dataDevolucao: string | null; observacoes: string | null;
  usoInstitucional: boolean; usoPorAluno: boolean;
  usuario: { id: string; nome: string | null; email: string; perfil: string };
  exemplarLivro: { id: string; codigoTombamento: string; livro: { id: string; titulo: string; autor: string } } | null;
  equipamento: { id: string; patrimonio: string; modelo: string; tipo: string } | null;
}
interface Resumo {
  totalLivros: number; totalExemplares: number; exemplaresDisponiveis: number;
  totalEquipamentos: number; equipamentosDisponiveis: number;
  emprestimosAtivos: number; emprestimosAtrasados: number;
  topLivrosMaisEmprestados: { livroId: string; titulo: string; total: number }[];
}

const INPUT: React.CSSProperties = { width: '100%', padding: '7px 10px', borderRadius: 5, border: '1px solid var(--gray-300)', fontSize: 13, boxSizing: 'border-box' };
const LABEL: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--gray-700)', marginBottom: 4 };
const BTN = (v: 'primary' | 'danger' | 'ghost') => ({
  padding: '6px 14px', borderRadius: 5, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
  background: v === 'primary' ? '#1a56db' : v === 'danger' ? '#e02424' : 'transparent',
  color: v === 'ghost' ? 'var(--gray-700)' : '#fff',
  ...(v === 'ghost' ? { border: '1px solid var(--gray-300)' } : {}),
});
const OVERLAY: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 };
const STATUS_LABEL: Record<StatusEmprestimo, string> = { EM_ANDAMENTO: 'Em andamento', DEVOLVIDO: 'Devolvido', PERDIDO: 'Perdido' };
const STATUS_COLOR: Record<StatusEmprestimo, { bg: string; text: string }> = {
  EM_ANDAMENTO: { bg: '#dbeafe', text: '#1e40af' },
  DEVOLVIDO: { bg: '#d1fae5', text: '#065f46' },
  PERDIDO: { bg: '#fee2e2', text: '#991b1b' },
};

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label style={LABEL}>{label}</label>{children}</div>;
}

function nomeUsuario(u: { nome: string | null; email: string; aluno?: { nome: string } | null; professor?: { nome: string } | null }): string {
  return u.nome || u.aluno?.nome || u.professor?.nome || u.email;
}

function descricaoItem(e: Emprestimo): string {
  if (e.tipoItem === 'LIVRO' && e.exemplarLivro) return `${e.exemplarLivro.livro.titulo} — ${e.exemplarLivro.codigoTombamento}`;
  if (e.tipoItem === 'EQUIPAMENTO' && e.equipamento) return `${e.equipamento.patrimonio} — ${e.equipamento.modelo}`;
  return '—';
}

function fmt(d: string | null): string {
  return d ? new Date(d).toLocaleDateString('pt-BR') : '—';
}

function StatCard({ label, value, danger }: { label: string; value: number | string; danger?: boolean }) {
  return (
    <div style={{ background: 'var(--white)', border: '1px solid var(--gray-200)', borderRadius: 8, padding: '12px 16px', flex: 1, minWidth: 140 }}>
      <p style={{ margin: 0, fontSize: 11.5, color: 'var(--gray-500)', fontWeight: 600 }}>{label}</p>
      <p style={{ margin: '4px 0 0', fontSize: 22, fontWeight: 700, color: danger ? '#dc2626' : 'var(--gray-700)' }}>{value}</p>
    </div>
  );
}

function RegistrarModal({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  const [tipoItem, setTipoItem] = useState<TipoItem>('LIVRO');
  const [livros, setLivros] = useState<LivroComExemplares[]>([]);
  const [equipamentos, setEquipamentos] = useState<EquipamentoDisp[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioBasico[]>([]);
  const [itemId, setItemId] = useState('');
  const [usuarioId, setUsuarioId] = useState('');
  const [dataPrevista, setDataPrevista] = useState('');
  const [observacoes, setObservacoes] = useState('');
  // Uso institucional e uso por aluno são mutuamente exclusivos (nunca fez
  // sentido os dois ao mesmo tempo) — um único estado de 3 opções em vez de
  // 2 checkboxes independentes garante isso na UI; "NORMAL" é o empréstimo
  // padrão (nenhuma das duas flags), mesmo default de antes.
  const [tipoUso, setTipoUso] = useState<'NORMAL' | 'INSTITUCIONAL' | 'ALUNO'>('NORMAL');
  const usoInstitucional = tipoUso === 'INSTITUCIONAL';
  const usoPorAluno = tipoUso === 'ALUNO';
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch<LivroComExemplares[]>('/biblioteca/livros').then(setLivros).catch(() => {});
    apiFetch<EquipamentoDisp[]>('/biblioteca/equipamentos').then(setEquipamentos).catch(() => {});
    // /usuarios é @Roles(ADMIN, SECRETARIA) — perfil SUPORTE (que também
    // registra empréstimo) recebia 403 nessa chamada e o dropdown ficava
    // sempre vazio. /mensagens/contatos é a lista mínima já usada pelo chat
    // (id/nome/email/perfil, sem @Roles — qualquer autenticado acessa) e
    // serve igualmente bem aqui.
    apiFetch<UsuarioBasico[]>('/mensagens/contatos').then(setUsuarios).catch(() => {});
  }, []);

  useEffect(() => { setItemId(''); }, [tipoItem]);

  const opcoesItem = tipoItem === 'LIVRO'
    ? livros.flatMap(l => (l.exemplares ?? [])
        .filter(e => e.status === 'DISPONIVEL')
        .map(e => ({ id: e.id, label: `${l.titulo} — ${e.codigoTombamento}` })))
    : equipamentos.filter(e => e.status === 'DISPONIVEL').map(e => ({ id: e.id, label: `${e.patrimonio} — ${e.modelo}` }));

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError('');
    if (usoInstitucional && !observacoes.trim()) {
      setError('Observações são obrigatórias para empréstimo de uso institucional.');
      return;
    }
    setSaving(true);
    try {
      await apiFetch('/biblioteca/emprestimos', {
        method: 'POST',
        body: JSON.stringify({
          tipoItem, itemId, usuarioId,
          dataPrevistaDevolucao: !usoPorAluno && dataPrevista ? new Date(dataPrevista).toISOString() : undefined,
          observacoes: observacoes || undefined,
          usoInstitucional, usoPorAluno,
        }),
      });
      onSave(); onClose();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Erro ao registrar empréstimo'); }
    finally { setSaving(false); }
  }

  return (
    <div style={OVERLAY} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: 'var(--white)', borderRadius: 10, width: 460, boxShadow: '0 10px 40px rgba(0,0,0,.18)', padding: 24 }}>
        <h2 style={{ margin: '0 0 16px', fontSize: 17, fontWeight: 700 }}>Registrar Empréstimo</h2>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <F label="Tipo *">
            <select style={INPUT} value={tipoItem} onChange={e => setTipoItem(e.target.value as TipoItem)}>
              <option value="LIVRO">Livro</option>
              <option value="EQUIPAMENTO">Equipamento</option>
            </select>
          </F>
          <F label="Item disponível *">
            <select style={INPUT} value={itemId} required onChange={e => setItemId(e.target.value)}>
              <option value="">Selecione...</option>
              {opcoesItem.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
            {opcoesItem.length === 0 && <p style={{ fontSize: 12, color: 'var(--gray-400)', margin: '4px 0 0' }}>Nenhum item disponível deste tipo no momento.</p>}
          </F>
          <F label="Usuário (aluno ou professor) *">
            <select style={INPUT} value={usuarioId} required onChange={e => setUsuarioId(e.target.value)}>
              <option value="">Selecione...</option>
              {usuarios.map(u => <option key={u.id} value={u.id}>{nomeUsuario(u)} ({u.email})</option>)}
            </select>
          </F>
          <F label="Data prevista de devolução">
            <input style={INPUT} type="date" value={dataPrevista} disabled={usoPorAluno} onChange={e => setDataPrevista(e.target.value)} />
            <p style={{ fontSize: 11.5, color: 'var(--gray-400)', margin: '4px 0 0' }}>
              {usoPorAluno
                ? 'Uso por aluno: devolução obrigatória no mesmo dia, até o fechamento da instituição (22:20).'
                : 'Se em branco: 7 dias (livro) ou 15 dias (equipamento) a partir de hoje.'}
            </p>
          </F>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--gray-700)' }}>
              <input type="radio" name="tipoUso" checked={tipoUso === 'NORMAL'} onChange={() => setTipoUso('NORMAL')} />
              Empréstimo normal
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--gray-700)' }}>
              <input type="radio" name="tipoUso" checked={tipoUso === 'INSTITUCIONAL'} onChange={() => setTipoUso('INSTITUCIONAL')} />
              Uso da instituição
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--gray-700)' }}>
              <input type="radio" name="tipoUso" checked={tipoUso === 'ALUNO'} onChange={() => setTipoUso('ALUNO')} />
              Uso por aluno (devolução no mesmo dia, até 22:20)
            </label>
          </div>
          <F label={usoInstitucional ? 'Observações *' : 'Observações'}>
            <textarea
              style={{ ...INPUT, minHeight: 50, resize: 'vertical', fontFamily: 'inherit' }}
              value={observacoes}
              required={usoInstitucional}
              placeholder={usoInstitucional ? 'Obrigatório para uso institucional: finalidade do empréstimo' : undefined}
              onChange={e => setObservacoes(e.target.value)}
            />
          </F>
          {error && <p style={{ color: '#e02424', fontSize: 13, margin: 0 }}>{error}</p>}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
            <button type="button" style={BTN('ghost')} onClick={onClose}>Cancelar</button>
            <button type="submit" style={BTN('primary')} disabled={saving || !itemId || !usuarioId}>{saving ? 'Registrando...' : 'Registrar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DevolverModal({ emprestimo, onClose, onSave }: { emprestimo: Emprestimo; onClose: () => void; onSave: () => void }) {
  const [perdido, setPerdido] = useState(false);
  const [observacoes, setObservacoes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      await apiFetch(`/biblioteca/emprestimos/${emprestimo.id}/devolver`, {
        method: 'PATCH',
        body: JSON.stringify({ perdido, observacoes: observacoes || undefined }),
      });
      onSave(); onClose();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Erro ao registrar devolução'); }
    finally { setSaving(false); }
  }

  return (
    <div style={OVERLAY} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: 'var(--white)', borderRadius: 10, width: 420, boxShadow: '0 10px 40px rgba(0,0,0,.18)', padding: 24 }}>
        <h2 style={{ margin: '0 0 4px', fontSize: 17, fontWeight: 700 }}>Registrar Devolução</h2>
        <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--gray-500)' }}>
          {descricaoItem(emprestimo)} — {nomeUsuario(emprestimo.usuario)}
        </p>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--gray-700)' }}>
            <input type="checkbox" checked={perdido} onChange={e => setPerdido(e.target.checked)} />
            Item extraviado (não devolvido fisicamente)
          </label>
          <F label="Observações">
            <textarea style={{ ...INPUT, minHeight: 50, resize: 'vertical', fontFamily: 'inherit' }} value={observacoes} onChange={e => setObservacoes(e.target.value)} />
          </F>
          {error && <p style={{ color: '#e02424', fontSize: 13, margin: 0 }}>{error}</p>}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
            <button type="button" style={BTN('ghost')} onClick={onClose}>Cancelar</button>
            <button type="submit" style={BTN('primary')} disabled={saving}>{saving ? 'Salvando...' : 'Confirmar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function EmprestimosPage() {
  const [emprestimos, setEmprestimos] = useState<Emprestimo[]>([]);
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [tipoItem, setTipoItem] = useState('');
  const [somenteAtrasados, setSomenteAtrasados] = useState(false);
  const [buscaUsuario, setBuscaUsuario] = useState('');
  const [registrando, setRegistrando] = useState(false);
  const [devolvendo, setDevolvendo] = useState<Emprestimo | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      if (tipoItem) params.set('tipoItem', tipoItem);
      if (somenteAtrasados) params.set('atrasados', 'true');
      const qs = params.toString() ? `?${params.toString()}` : '';
      const [emp, res] = await Promise.all([
        apiFetch<Emprestimo[]>(`/biblioteca/emprestimos${qs}`),
        apiFetch<Resumo>('/biblioteca/emprestimos/relatorio/resumo'),
      ]);
      setEmprestimos(emp); setResumo(res);
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Erro ao carregar'); }
    finally { setLoading(false); }
  }, [status, tipoItem, somenteAtrasados]);

  useEffect(() => { load(); }, [load]);

  const filtrados = buscaUsuario.trim()
    ? emprestimos.filter(e => nomeUsuario(e.usuario).toLowerCase().includes(buscaUsuario.trim().toLowerCase()))
    : emprestimos;

  return (
    <div style={{ padding: '24px 28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Empréstimos — Biblioteca</h1>
          <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--gray-500)' }}>Empréstimo e devolução de livros e equipamentos.</p>
        </div>
        <button style={BTN('primary')} onClick={() => setRegistrando(true)}>+ Registrar Empréstimo</button>
      </div>

      {resumo && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
          <StatCard label="Exemplares disponíveis" value={`${resumo.exemplaresDisponiveis}/${resumo.totalExemplares}`} />
          <StatCard label="Equipamentos disponíveis" value={`${resumo.equipamentosDisponiveis}/${resumo.totalEquipamentos}`} />
          <StatCard label="Empréstimos ativos" value={resumo.emprestimosAtivos} />
          <StatCard label="Atrasados" value={resumo.emprestimosAtrasados} danger={resumo.emprestimosAtrasados > 0} />
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <select style={{ ...INPUT, width: 160 }} value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">Todos os status</option>
          <option value="EM_ANDAMENTO">Em andamento</option>
          <option value="DEVOLVIDO">Devolvido</option>
          <option value="PERDIDO">Perdido</option>
        </select>
        <select style={{ ...INPUT, width: 150 }} value={tipoItem} onChange={e => setTipoItem(e.target.value)}>
          <option value="">Todos os tipos</option>
          <option value="LIVRO">Livro</option>
          <option value="EQUIPAMENTO">Equipamento</option>
        </select>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--gray-700)' }}>
          <input type="checkbox" checked={somenteAtrasados} onChange={e => setSomenteAtrasados(e.target.checked)} />
          Somente atrasados
        </label>
        <input style={{ ...INPUT, width: 200 }} placeholder="Filtrar por usuário..." value={buscaUsuario} onChange={e => setBuscaUsuario(e.target.value)} />
      </div>

      {loading && <p style={{ color: 'var(--gray-500)', fontSize: 14 }}>Carregando...</p>}
      {error && <p style={{ color: '#e02424', fontSize: 14 }}>{error}</p>}

      {!loading && (
        <div style={{ background: 'var(--white)', borderRadius: 8, border: '1px solid var(--gray-200)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
                {['Item', 'Usuário', 'Empréstimo', 'Prev. Devolução', 'Status', ''].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--gray-700)', fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 && (
                <tr><td colSpan={6} style={{ padding: 24, textAlign: 'center', color: 'var(--gray-400)' }}>Nenhum empréstimo encontrado.</td></tr>
              )}
              {filtrados.map((e, i) => {
                const c = STATUS_COLOR[e.status];
                return (
                  <tr key={e.id} style={{ borderBottom: '1px solid var(--gray-100)', background: i % 2 ? 'var(--gray-50)' : 'var(--white)' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 500 }}>
                      {descricaoItem(e)}
                      {e.observacoes && (
                        <span title={e.observacoes} style={{ marginLeft: 6, color: 'var(--gray-400)', cursor: 'help' }}>ℹ️</span>
                      )}
                    </td>
                    <td style={{ padding: '10px 14px', color: 'var(--gray-500)' }}>{nomeUsuario(e.usuario)}</td>
                    <td style={{ padding: '10px 14px', color: 'var(--gray-500)' }}>{fmt(e.dataEmprestimo)}</td>
                    <td style={{ padding: '10px 14px', color: 'var(--gray-500)' }}>{fmt(e.dataPrevistaDevolucao)}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                        <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: c.bg, color: c.text }}>{STATUS_LABEL[e.status]}</span>
                        {e.emAtraso && <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: '#fee2e2', color: '#991b1b' }}>Atrasado</span>}
                      </div>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      {e.status === 'EM_ANDAMENTO' && (
                        <button style={{ ...BTN('primary'), padding: '4px 10px', fontSize: 12 }} onClick={() => setDevolvendo(e)}>Devolver</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {registrando && <RegistrarModal onClose={() => setRegistrando(false)} onSave={load} />}
      {devolvendo && <DevolverModal emprestimo={devolvendo} onClose={() => setDevolvendo(null)} onSave={load} />}
    </div>
  );
}
