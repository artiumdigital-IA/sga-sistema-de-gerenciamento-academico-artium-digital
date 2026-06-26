'use client';
import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';

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
  CANCELADO: '#6b7280',
};

type Requerimento = {
  id: string;
  tipo: string;
  descricao?: string;
  status: string;
  resposta?: string;
  criadoEm: string;
  aluno: { id: string; nome: string; ra: string; curso?: { nome: string } };
};

type Aluno = { id: string; nome: string; ra: string };

function ModalNovoRequerimento({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [alunoId, setAlunoId] = useState('');
  const [tipo, setTipo] = useState('DECLARACAO_MATRICULA');
  const [descricao, setDescricao] = useState('');
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    apiFetch('/alunos?limit=200').then(r => r.json()).then(d => setAlunos(d.data ?? d));
  }, []);

  const filtered = search
    ? alunos.filter(a => a.nome.toLowerCase().includes(search.toLowerCase()) || a.ra.includes(search))
    : alunos.slice(0, 20);

  async function save() {
    if (!alunoId) return;
    setLoading(true);
    try {
      const r = await apiFetch('/requerimentos', { method: 'POST', body: JSON.stringify({ alunoId, tipo, descricao }) });
      if (!r.ok) throw new Error('Erro ao criar');
      onSaved();
      onClose();
    } finally { setLoading(false); }
  }

  const overlay: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' };
  const box: React.CSSProperties = { background: '#fff', borderRadius: 8, padding: 24, width: 460, maxHeight: '90vh', overflowY: 'auto' };

  return (
    <div style={overlay} onClick={onClose}>
      <div style={box} onClick={e => e.stopPropagation()}>
        <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>Novo Requerimento</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input placeholder="Buscar aluno (nome ou RA)..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 13 }} />
          <select value={alunoId} onChange={e => setAlunoId(e.target.value)}
            style={{ padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 13 }}>
            <option value="">-- Selecione o aluno --</option>
            {filtered.map(a => <option key={a.id} value={a.id}>{a.nome} ({a.ra})</option>)}
          </select>
          <select value={tipo} onChange={e => setTipo(e.target.value)}
            style={{ padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 13 }}>
            {Object.entries(TIPOS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <textarea placeholder="Descrição / justificativa (opcional)" value={descricao} onChange={e => setDescricao(e.target.value)} rows={3}
            style={{ padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 13, resize: 'vertical' }} />
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
          <button onClick={onClose} style={{ padding: '7px 16px', border: '1px solid #d1d5db', borderRadius: 4, background: '#fff', cursor: 'pointer', fontSize: 13 }}>Cancelar</button>
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
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    try {
      await apiFetch(`/requerimentos/${req.id}`, { method: 'PATCH', body: JSON.stringify({ status, resposta }) });
      onSaved();
      onClose();
    } finally { setLoading(false); }
  }

  const overlay: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' };
  const box: React.CSSProperties = { background: '#fff', borderRadius: 8, padding: 24, width: 460 };

  return (
    <div style={overlay} onClick={onClose}>
      <div style={box} onClick={e => e.stopPropagation()}>
        <h3 style={{ margin: '0 0 4px', fontSize: 16 }}>Responder Requerimento</h3>
        <p style={{ margin: '0 0 16px', fontSize: 13, color: '#6b7280' }}>{req.aluno.nome} — {TIPOS[req.tipo] ?? req.tipo}</p>
        {req.descricao && <p style={{ margin: '0 0 16px', fontSize: 13, background: '#f9fafb', padding: '8px 12px', borderRadius: 4 }}>{req.descricao}</p>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <select value={status} onChange={e => setStatus(e.target.value)}
            style={{ padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 13 }}>
            <option value="ABERTO">Aberto</option>
            <option value="EM_ANALISE">Em Análise</option>
            <option value="DEFERIDO">Deferido</option>
            <option value="INDEFERIDO">Indeferido</option>
            <option value="CANCELADO">Cancelado</option>
          </select>
          <textarea placeholder="Resposta / despacho..." value={resposta} onChange={e => setResposta(e.target.value)} rows={4}
            style={{ padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 13, resize: 'vertical' }} />
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
          <button onClick={onClose} style={{ padding: '7px 16px', border: '1px solid #d1d5db', borderRadius: 4, background: '#fff', cursor: 'pointer', fontSize: 13 }}>Cancelar</button>
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
  const [filterTipo, setFilterTipo] = useState('');
  const [showNovo, setShowNovo] = useState(false);
  const [responder, setResponder] = useState<Requerimento | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterStatus) params.set('status', filterStatus);
    if (filterTipo) params.set('tipo', filterTipo);
    const r = await apiFetch(`/requerimentos?${params}`);
    const d = await r.json();
    setItems(Array.isArray(d) ? d : d.data ?? []);
    setLoading(false);
  }, [filterStatus, filterTipo]);

  useEffect(() => { load(); }, [load]);

  const th: React.CSSProperties = { padding: '8px 12px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap' };
  const td: React.CSSProperties = { padding: '8px 12px', fontSize: 13, borderBottom: '1px solid #f3f4f6' };

  return (
    <div style={{ maxWidth: 1000 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Requerimentos</h2>
        <button onClick={() => setShowNovo(true)}
          style={{ padding: '7px 14px', background: '#1e3a5f', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}>
          + Novo Requerimento
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          style={{ padding: '5px 10px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 13 }}>
          <option value="">Todos os status</option>
          <option value="ABERTO">Aberto</option>
          <option value="EM_ANALISE">Em Análise</option>
          <option value="DEFERIDO">Deferido</option>
          <option value="INDEFERIDO">Indeferido</option>
          <option value="CANCELADO">Cancelado</option>
        </select>
        <select value={filterTipo} onChange={e => setFilterTipo(e.target.value)}
          style={{ padding: '5px 10px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 13 }}>
          <option value="">Todos os tipos</option>
          {Object.entries(TIPOS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={th}>Aluno</th>
              <th style={th}>Tipo</th>
              <th style={th}>Status</th>
              <th style={th}>Aberto em</th>
              <th style={th}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ ...td, textAlign: 'center', color: '#9ca3af' }}>Carregando...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={5} style={{ ...td, textAlign: 'center', color: '#9ca3af' }}>Nenhum requerimento</td></tr>
            ) : items.map(r => (
              <tr key={r.id}>
                <td style={td}>
                  <div style={{ fontWeight: 500 }}>{r.aluno.nome}</div>
                  <div style={{ fontSize: 11, color: '#6b7280' }}>RA {r.aluno.ra} · {r.aluno.curso?.nome ?? ''}</div>
                </td>
                <td style={td}>{TIPOS[r.tipo] ?? r.tipo}</td>
                <td style={td}>
                  <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: STATUS_COLORS[r.status] + '22', color: STATUS_COLORS[r.status] }}>
                    {r.status.replace('_', ' ')}
                  </span>
                </td>
                <td style={td}>{new Date(r.criadoEm).toLocaleDateString('pt-BR')}</td>
                <td style={td}>
                  <button onClick={() => setResponder(r)}
                    style={{ padding: '3px 10px', fontSize: 12, border: '1px solid #d1d5db', borderRadius: 4, cursor: 'pointer', background: '#fff' }}>
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
