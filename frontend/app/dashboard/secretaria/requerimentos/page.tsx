'use client';
import { useState, useEffect, useCallback } from 'react';
import { apiFetch, apiFileUrl } from '@/lib/api';

const TIPOS: Record<string, string> = {
  DECLARACAO_MATRICULA: 'Declaração de Matrícula',
  HISTORICO_OFICIAL: 'Histórico Oficial',
  TRANCAMENTO: 'Trancamento',
  CANCELAMENTO: 'Cancelamento',
  REVISAO_NOTA: 'Revisão de Nota',
  APROVEITAMENTO_DISCIPLINA: 'Aproveitamento de Disciplina',
  COLACAO_GRAU: 'Colação de Grau',
  OUTRO: 'Outro',
};

const STATUS_COLORS: Record<string, string> = {
  ABERTO: '#3b82f6',
  EM_ANALISE: '#f59e0b',
  DEFERIDO: '#10b981',
  INDEFERIDO: '#ef4444',
  CANCELADO: 'var(--gray-500)',
};

type TipoCatalogo = { id: string; nome: string; taxa: number | string; observacaoTaxa: string | null };

type Requerimento = {
  id: string;
  tipo: string;
  descricao?: string;
  status: string;
  resposta?: string;
  criadoEm: string;
  aluno: { id: string; nome: string; ra: string; curso?: { nome: string } };
  tipoCatalogo?: TipoCatalogo | null;
  arquivoNome?: string | null;
  arquivoUrl?: string | null;
  horaComplementar?: { id: string; horas: number; criadoEm: string } | null;
};

function formatarTaxa(t: TipoCatalogo): string {
  if (Number(t.taxa) === 0) return t.observacaoTaxa ? `Gratuito (${t.observacaoTaxa})` : 'Gratuito';
  const valor = `R$ ${Number(t.taxa).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return t.observacaoTaxa ? `${valor} (${t.observacaoTaxa})` : valor;
}

type Aluno = { id: string; nome: string; ra: string };

function ModalNovoRequerimento({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [alunoId, setAlunoId] = useState('');
  const [tipo, setTipo] = useState('DECLARACAO_MATRICULA');
  const [descricao, setDescricao] = useState('');
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    apiFetch<any>('/alunos?limit=200').then((d: any) => setAlunos(d.data ?? d));
  }, []);

  const filtered = search
    ? alunos.filter(a => a.nome.toLowerCase().includes(search.toLowerCase()) || a.ra.includes(search))
    : alunos.slice(0, 20);

  async function save() {
    if (!alunoId) return;
    setLoading(true);
    try {
      await apiFetch<any>('/requerimentos', { method: 'POST', body: JSON.stringify({ alunoId, tipo, descricao }) });
      onSaved();
      onClose();
    } finally { setLoading(false); }
  }

  const overlay: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' };
  const box: React.CSSProperties = { background: 'var(--white)', borderRadius: 8, padding: 24, width: 460, maxHeight: '90vh', overflowY: 'auto' };

  return (
    <div style={overlay} onClick={onClose}>
      <div style={box} onClick={e => e.stopPropagation()}>
        <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>Novo Requerimento</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input placeholder="Buscar aluno (nome ou RA)..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ padding: '6px 10px', border: '1px solid var(--gray-300)', borderRadius: 4, fontSize: 13 }} />
          <select value={alunoId} onChange={e => setAlunoId(e.target.value)}
            style={{ padding: '6px 10px', border: '1px solid var(--gray-300)', borderRadius: 4, fontSize: 13 }}>
            <option value="">-- Selecione o aluno --</option>
            {filtered.map(a => <option key={a.id} value={a.id}>{a.nome} ({a.ra})</option>)}
          </select>
          <select value={tipo} onChange={e => setTipo(e.target.value)}
            style={{ padding: '6px 10px', border: '1px solid var(--gray-300)', borderRadius: 4, fontSize: 13 }}>
            {Object.entries(TIPOS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <textarea placeholder="Descrição / justificativa (opcional)" value={descricao} onChange={e => setDescricao(e.target.value)} rows={3}
            style={{ padding: '6px 10px', border: '1px solid var(--gray-300)', borderRadius: 4, fontSize: 13, resize: 'vertical' }} />
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
          <button onClick={onClose} style={{ padding: '7px 16px', border: '1px solid var(--gray-300)', borderRadius: 4, background: 'var(--white)', cursor: 'pointer', fontSize: 13 }}>Cancelar</button>
          <button onClick={save} disabled={!alunoId || loading}
            style={{ padding: '7px 16px', border: 'none', borderRadius: 4, background: '#1e3a5f', color: '#fff', cursor: alunoId ? 'pointer' : 'not-allowed', fontSize: 13 }}>
            {loading ? 'Salvando...' : 'Abrir'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ModalResponder({ req, onClose, onSaved }: { req: Requerimento; onClose: () => void; onSaved: () => void }) {
  const [status, setStatus] = useState(req.status);
  const [resposta, setResposta] = useState(req.resposta ?? '');
  const [horas, setHoras] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const ehHoraComplementar = req.tipoCatalogo?.nome === 'Hora Complementar';
  const jaGerouLancamento = !!req.horaComplementar;
  const precisaInformarHoras = ehHoraComplementar && status === 'DEFERIDO' && !jaGerouLancamento;

  async function save() {
    setErro('');
    if (precisaInformarHoras && (!horas || Number(horas) < 1)) {
      setErro('Informe quantas horas conceder pra deferir este requerimento.');
      return;
    }
    setLoading(true);
    try {
      const body: any = { status, resposta };
      if (precisaInformarHoras) body.horas = Number(horas);
      await apiFetch(`/requerimentos/${req.id}`, { method: 'PATCH', body: JSON.stringify(body) });
      onSaved();
      onClose();
    } catch (e: any) {
      setErro(e?.message ?? 'Erro ao salvar.');
    } finally { setLoading(false); }
  }

  const overlay: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' };
  const box: React.CSSProperties = { background: 'var(--white)', borderRadius: 8, padding: 24, width: 460 };

  return (
    <div style={overlay} onClick={onClose}>
      <div style={box} onClick={e => e.stopPropagation()}>
        <h3 style={{ margin: '0 0 4px', fontSize: 16 }}>Responder Requerimento</h3>
        <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--gray-500)' }}>{req.aluno.nome} — {req.tipoCatalogo?.nome ?? TIPOS[req.tipo] ?? req.tipo}</p>
        {req.descricao && <p style={{ margin: '0 0 16px', fontSize: 13, background: 'var(--gray-50)', padding: '8px 12px', borderRadius: 4 }}>{req.descricao}</p>}
        {req.arquivoUrl && (
          <p style={{ margin: '0 0 16px', fontSize: 13 }}>
            <a href={apiFileUrl(req.arquivoUrl) ?? '#'} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--blue-dark)' }}>
              📎 Ver certificado anexado{req.arquivoNome ? ` (${req.arquivoNome})` : ''}
            </a>
          </p>
        )}
        {jaGerouLancamento && (
          <p style={{ margin: '0 0 16px', fontSize: 13, background: '#ecfdf5', color: '#047857', padding: '8px 12px', borderRadius: 4 }}>
            ✓ {req.horaComplementar!.horas}h já lançadas como crédito em {new Date(req.horaComplementar!.criadoEm).toLocaleDateString('pt-BR')}.
          </p>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <select value={status} onChange={e => setStatus(e.target.value)}
            style={{ padding: '6px 10px', border: '1px solid var(--gray-300)', borderRadius: 4, fontSize: 13 }}>
            <option value="ABERTO">Aberto</option>
            <option value="EM_ANALISE">Em Análise</option>
            <option value="DEFERIDO">Deferido</option>
            <option value="INDEFERIDO">Indeferido</option>
            <option value="CANCELADO">Cancelado</option>
          </select>
          {precisaInformarHoras && (
            <input type="number" min={1} placeholder="Quantas horas conceder?" value={horas} onChange={e => setHoras(e.target.value)}
              style={{ padding: '6px 10px', border: '1px solid var(--gray-300)', borderRadius: 4, fontSize: 13 }} />
          )}
          <textarea placeholder="Resposta / despacho..." value={resposta} onChange={e => setResposta(e.target.value)} rows={4}
            style={{ padding: '6px 10px', border: '1px solid var(--gray-300)', borderRadius: 4, fontSize: 13, resize: 'vertical' }} />
          {erro && <p style={{ margin: 0, fontSize: 12, color: 'var(--accent-red-text)' }}>{erro}</p>}
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
          <button onClick={onClose} style={{ padding: '7px 16px', border: '1px solid var(--gray-300)', borderRadius: 4, background: 'var(--white)', cursor: 'pointer', fontSize: 13 }}>Cancelar</button>
          <button onClick={save} disabled={loading}
            style={{ padding: '7px 16px', border: 'none', borderRadius: 4, background: '#1e3a5f', color: '#fff', cursor: 'pointer', fontSize: 13 }}>
            {loading ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function RequerimentosPage() {
  const [items, setItems] = useState<Requerimento[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterTipoCatalogoId, setFilterTipoCatalogoId] = useState('');
  const [catalogo, setCatalogo] = useState<TipoCatalogo[]>([]);
  const [showNovo, setShowNovo] = useState(false);
  const [responder, setResponder] = useState<Requerimento | null>(null);

  useEffect(() => {
    apiFetch<any>('/tipos-requerimento').then((d: any) => setCatalogo(Array.isArray(d) ? d : d.data ?? [])).catch(() => {});
  }, []);

  // Deep-link de outro lugar da plataforma (ex: subitem "Horas Complementares"
  // do Menu Coordenador na Barra Rápida) pra já abrir filtrado num tipo do
  // catálogo, sem precisar saber o id (que varia por ambiente) — só o nome.
  useEffect(() => {
    if (catalogo.length === 0) return;
    const nome = new URLSearchParams(window.location.search).get('tipoCatalogoNome');
    if (!nome) return;
    const achado = catalogo.find(t => t.nome === nome);
    if (achado) setFilterTipoCatalogoId(achado.id);
  }, [catalogo]);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterStatus) params.set('status', filterStatus);
    if (filterTipoCatalogoId) params.set('tipoCatalogoId', filterTipoCatalogoId);
    const d = await apiFetch<any>(`/requerimentos?${params}`);
    setItems(Array.isArray(d) ? d : (d as any).data ?? []);
    setLoading(false);
  }, [filterStatus, filterTipoCatalogoId]);

  useEffect(() => { load(); }, [load]);

  const th: React.CSSProperties = { padding: '8px 12px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--gray-500)', borderBottom: '1px solid var(--gray-200)', whiteSpace: 'nowrap' };
  const td: React.CSSProperties = { padding: '8px 12px', fontSize: 13, borderBottom: '1px solid var(--gray-100)' };

  return (
    <div style={{ padding: '24px 28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Requerimentos</h2>
        <button onClick={() => setShowNovo(true)}
          style={{ padding: '7px 14px', background: '#1e3a5f', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}>
          + Novo Requerimento
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          style={{ padding: '5px 10px', border: '1px solid var(--gray-300)', borderRadius: 4, fontSize: 13 }}>
          <option value="">Todos os status</option>
          <option value="ABERTO">Aberto</option>
          <option value="EM_ANALISE">Em Análise</option>
          <option value="DEFERIDO">Deferido</option>
          <option value="INDEFERIDO">Indeferido</option>
          <option value="CANCELADO">Cancelado</option>
        </select>
        <select value={filterTipoCatalogoId} onChange={e => setFilterTipoCatalogoId(e.target.value)}
          style={{ padding: '5px 10px', border: '1px solid var(--gray-300)', borderRadius: 4, fontSize: 13 }}>
          <option value="">Todos os tipos de requerimento</option>
          {catalogo.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
        </select>
      </div>

      <div style={{ background: 'var(--white)', borderRadius: 8, border: '1px solid var(--gray-200)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={th}>Aluno</th>
              <th style={th}>Tipo</th>
              <th style={th}>Taxa</th>
              <th style={th}>Status</th>
              <th style={th}>Aberto em</th>
              <th style={th}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ ...td, textAlign: 'center', color: 'var(--gray-400)' }}>Carregando...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={6} style={{ ...td, textAlign: 'center', color: 'var(--gray-400)' }}>Nenhum requerimento</td></tr>
            ) : items.map(r => (
              <tr key={r.id}>
                <td style={td}>
                  <div style={{ fontWeight: 500 }}>{r.aluno.nome}</div>
                  <div style={{ fontSize: 11, color: 'var(--gray-500)' }}>RA {r.aluno.ra} · {r.aluno.curso?.nome ?? ''}</div>
                </td>
                <td style={td}>{r.tipoCatalogo?.nome ?? TIPOS[r.tipo] ?? r.tipo}</td>
                <td style={td}>{r.tipoCatalogo ? formatarTaxa(r.tipoCatalogo) : '—'}</td>
                <td style={td}>
                  <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: STATUS_COLORS[r.status] + '22', color: STATUS_COLORS[r.status] }}>
                    {r.status.replace('_', ' ')}
                  </span>
                </td>
                <td style={td}>{new Date(r.criadoEm).toLocaleDateString('pt-BR')}</td>
                <td style={td}>
                  <button onClick={() => setResponder(r)}
                    style={{ padding: '3px 10px', fontSize: 12, border: '1px solid var(--gray-300)', borderRadius: 4, cursor: 'pointer', background: 'var(--white)' }}>
                    Responder
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showNovo && <ModalNovoRequerimento onClose={() => setShowNovo(false)} onSaved={load} />}
      {responder && <ModalResponder req={responder} onClose={() => setResponder(null)} onSaved={load} />}
    </div>
  );
}
