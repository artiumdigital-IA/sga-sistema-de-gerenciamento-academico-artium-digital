'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';

// ── tipos ──────────────────────────────────────────────────────────────
type Sexo = 'MASCULINO' | 'FEMININO' | 'NAO_DECLARADO';
type CorRaca = 'BRANCA' | 'PRETA' | 'PARDA' | 'AMARELA' | 'INDIGENA' | 'NAO_DECLARADO';
type FormaIngresso = 'VESTIBULAR' | 'ENEM' | 'TRANSFERENCIA_EXTERNA' | 'TRANSFERENCIA_INTERNA' | 'PORTADOR_DIPLOMA' | 'CONVENIO' | 'OUTRO';
type SituacaoVinculo = 'CURSANDO' | 'TRANCADO' | 'FORMADO' | 'EVADIDO' | 'TRANSFERIDO_OUT' | 'FALECIDO';

interface Curso { id: string; nome: string; }
interface MatrizCurricular { id: string; versao: string; cursoId: string; }

interface Aluno {
  id: string;
  ra: string;
  nome: string;
  cpf: string;
  dataNascimento: string;
  sexo: Sexo;
  corRaca: CorRaca;
  nacionalidade: string;
  formaIngresso: FormaIngresso;
  dataIngresso: string;
  situacaoVinculo: SituacaoVinculo;
  email: string;
  telefone?: string;
  cursoId: string;
  matrizCurricularId: string;
  curso?: { nome: string };
}

type FormData = Omit<Aluno, 'id' | 'curso'>;

const SEXO_LABEL: Record<Sexo, string> = { MASCULINO: 'Masculino', FEMININO: 'Feminino', NAO_DECLARADO: 'Não declarado' };
const COR_LABEL: Record<CorRaca, string> = { BRANCA: 'Branca', PRETA: 'Preta', PARDA: 'Parda', AMARELA: 'Amarela', INDIGENA: 'Indígena', NAO_DECLARADO: 'Não declarado' };
const INGRESSO_LABEL: Record<FormaIngresso, string> = {
  VESTIBULAR: 'Vestibular', ENEM: 'ENEM', TRANSFERENCIA_EXTERNA: 'Transferência externa',
  TRANSFERENCIA_INTERNA: 'Transferência interna', PORTADOR_DIPLOMA: 'Portador de diploma',
  CONVENIO: 'Convênio', OUTRO: 'Outro',
};
const VINCULO_LABEL: Record<SituacaoVinculo, string> = {
  CURSANDO: 'Cursando', TRANCADO: 'Trancado', FORMADO: 'Formado',
  EVADIDO: 'Evadido', TRANSFERIDO_OUT: 'Transferido', FALECIDO: 'Falecido',
};
const VINCULO_COLOR: Record<SituacaoVinculo, { bg: string; color: string }> = {
  CURSANDO: { bg: '#d1fae5', color: '#065f46' },
  TRANCADO: { bg: '#fef3c7', color: '#92400e' },
  FORMADO: { bg: '#dbeafe', color: '#1e40af' },
  EVADIDO: { bg: '#fee2e2', color: '#991b1b' },
  TRANSFERIDO_OUT: { bg: '#f3e8ff', color: '#6b21a8' },
  FALECIDO: { bg: '#f3f4f6', color: '#374151' },
};

const EMPTY: FormData = {
  ra: '', nome: '', cpf: '', dataNascimento: '', sexo: 'NAO_DECLARADO',
  corRaca: 'NAO_DECLARADO', nacionalidade: 'Brasileira',
  formaIngresso: 'VESTIBULAR', dataIngresso: '', situacaoVinculo: 'CURSANDO',
  email: '', telefone: '', cursoId: '', matrizCurricularId: '',
};

const BTN = (variant: 'primary' | 'danger' | 'ghost') => ({
  padding: '6px 14px', borderRadius: 5, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
  background: variant === 'primary' ? '#1a56db' : variant === 'danger' ? '#e02424' : 'transparent',
  color: variant === 'ghost' ? '#374151' : '#fff',
  ...(variant === 'ghost' ? { border: '1px solid #d1d5db' } : {}),
});
const INPUT = { width: '100%', padding: '7px 10px', borderRadius: 5, border: '1px solid #d1d5db', fontSize: 13, boxSizing: 'border-box' as const };
const LABEL = { display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 };

// ── modal ──────────────────────────────────────────────────────────────
function AlunoModal({ aluno, cursos, matrizes, onClose, onSave }: {
  aluno: Aluno | null;
  cursos: Curso[];
  matrizes: MatrizCurricular[];
  onClose: () => void;
  onSave: () => void;
}) {
  const [form, setForm] = useState<FormData>(
    aluno
      ? { ra: aluno.ra, nome: aluno.nome, cpf: aluno.cpf,
          dataNascimento: aluno.dataNascimento?.slice(0, 10) ?? '',
          sexo: aluno.sexo, corRaca: aluno.corRaca, nacionalidade: aluno.nacionalidade,
          formaIngresso: aluno.formaIngresso, dataIngresso: aluno.dataIngresso?.slice(0, 10) ?? '',
          situacaoVinculo: aluno.situacaoVinculo, email: aluno.email,
          telefone: aluno.telefone ?? '', cursoId: aluno.cursoId, matrizCurricularId: aluno.matrizCurricularId }
      : EMPTY
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k: keyof FormData, v: string) => setForm(f => ({ ...f, [k]: v }));

  const matrizesDoC = matrizes.filter(m => m.cursoId === form.cursoId);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const body = { ...form, telefone: form.telefone || undefined };
      if (aluno) {
        await apiFetch(`/alunos/${aluno.id}`, { method: 'PATCH', body: JSON.stringify(body) });
      } else {
        await apiFetch('/alunos', { method: 'POST', body: JSON.stringify(body) });
      }
      onSave();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }

  const G = ({ cols, children }: { cols: string; children: React.ReactNode }) => (
    <div style={{ display: 'grid', gridTemplateColumns: cols, gap: 12 }}>{children}</div>
  );
  const F = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div><label style={LABEL}>{label}</label>{children}</div>
  );
  const SEL = ({ k, opts }: { k: keyof FormData; opts: Record<string, string> }) => (
    <select style={INPUT} value={String(form[k])} onChange={e => set(k, e.target.value)}>
      {Object.entries(opts).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: '#fff', borderRadius: 10, padding: 28, width: 600, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 10px 40px rgba(0,0,0,.18)' }}>
        <h2 style={{ margin: '0 0 20px', fontSize: 17, fontWeight: 700 }}>{aluno ? 'Editar Aluno' : 'Novo Aluno'}</h2>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <G cols="1fr 1fr">
            <F label="RA *"><input style={INPUT} value={form.ra} required onChange={e => set('ra', e.target.value)} placeholder="Ex: 20260001" /></F>
            <F label="Nome completo *"><input style={INPUT} value={form.nome} required onChange={e => set('nome', e.target.value)} /></F>
          </G>
          <G cols="1fr 1fr">
            <F label="CPF *"><input style={INPUT} value={form.cpf} required onChange={e => set('cpf', e.target.value)} placeholder="000.000.000-00" /></F>
            <F label="Data de nascimento *"><input style={INPUT} type="date" value={form.dataNascimento} required onChange={e => set('dataNascimento', e.target.value)} /></F>
          </G>
          <G cols="1fr 1fr">
            <F label="Sexo (Censo)"><SEL k="sexo" opts={SEXO_LABEL} /></F>
            <F label="Cor/raça (Censo)"><SEL k="corRaca" opts={COR_LABEL} /></F>
          </G>
          <F label="Nacionalidade *"><input style={INPUT} value={form.nacionalidade} required onChange={e => set('nacionalidade', e.target.value)} /></F>
          <G cols="1fr 1fr">
            <F label="Forma de ingresso (Censo)"><SEL k="formaIngresso" opts={INGRESSO_LABEL} /></F>
            <F label="Data de ingresso *"><input style={INPUT} type="date" value={form.dataIngresso} required onChange={e => set('dataIngresso', e.target.value)} /></F>
          </G>
          <F label="Situação de vínculo (Censo)"><SEL k="situacaoVinculo" opts={VINCULO_LABEL} /></F>
          <G cols="1fr 1fr">
            <F label="E-mail *"><input style={INPUT} type="email" value={form.email} required onChange={e => set('email', e.target.value)} /></F>
            <F label="Telefone"><input style={INPUT} value={form.telefone} onChange={e => set('telefone', e.target.value)} placeholder="(21) 99999-9999" /></F>
          </G>
          <F label="Curso *">
            <select style={INPUT} value={form.cursoId} required
              onChange={e => set('cursoId', e.target.value)}>
              <option value="">Selecione...</option>
              {cursos.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </F>
          <F label="Matriz curricular *">
            <select style={INPUT} value={form.matrizCurricularId} required
              onChange={e => set('matrizCurricularId', e.target.value)}
              disabled={!form.cursoId}>
              <option value="">Selecione o curso primeiro...</option>
              {matrizesDoC.map(m => <option key={m.id} value={m.id}>Versão {m.versao}</option>)}
            </select>
          </F>

          {error && <p style={{ color: '#e02424', fontSize: 13, margin: 0 }}>{error}</p>}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
            <button type="button" style={BTN('ghost')} onClick={onClose}>Cancelar</button>
            <button type="submit" style={BTN('primary')} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── página principal ───────────────────────────────────────────────────
export default function AlunosPage() {
  const router = useRouter();
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [matrizes, setMatrizes] = useState<MatrizCurricular[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState<'new' | Aluno | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [a, c, m] = await Promise.all([
        apiFetch<Aluno[]>('/alunos'),
        apiFetch<Curso[]>('/cursos'),
        apiFetch<MatrizCurricular[]>('/matrizes-curriculares'),
      ]);
      setAlunos(a);
      setCursos(c);
      setMatrizes(m);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function deleteAluno(id: string) {
    if (!confirm('Excluir este aluno?')) return;
    setDeleting(id);
    try {
      await apiFetch(`/alunos/${id}`, { method: 'DELETE' });
      setAlunos(a => a.filter(x => x.id !== id));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erro ao excluir');
    } finally {
      setDeleting(null);
    }
  }

  const filtered = alunos.filter(a =>
    a.nome.toLowerCase().includes(search.toLowerCase()) ||
    a.ra.includes(search) ||
    a.cpf.includes(search) ||
    a.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Alunos</h1>
          <p style={{ margin: '2px 0 0', fontSize: 13, color: '#6b7280' }}>
            {alunos.length} aluno{alunos.length !== 1 ? 's' : ''} cadastrado{alunos.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button style={BTN('primary')} onClick={() => setModal('new')}>+ Novo Aluno</button>
      </div>

      <input style={{ ...INPUT, marginBottom: 16, width: 300 }}
        placeholder="Buscar por nome, RA, CPF ou e-mail..."
        value={search} onChange={e => setSearch(e.target.value)} />

      {loading && <p style={{ color: '#6b7280', fontSize: 14 }}>Carregando...</p>}
      {error && <p style={{ color: '#e02424', fontSize: 14 }}>{error}</p>}

      {!loading && (
        <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                {['RA', 'Nome', 'CPF', 'Curso', 'Ingresso', 'Situação', '', ''].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={7} style={{ padding: 24, textAlign: 'center', color: '#9ca3af' }}>
                  {search ? 'Nenhum resultado.' : 'Nenhum aluno cadastrado ainda.'}
                </td></tr>
              )}
              {filtered.map((a, i) => {
                const vc = VINCULO_COLOR[a.situacaoVinculo];
                const cursoNome = cursos.find(c => c.id === a.cursoId)?.nome ?? '-';
                return (
                  <tr key={a.id} style={{ borderBottom: '1px solid #f3f4f6', background: i % 2 ? '#fafafa' : '#fff' }}>
                    <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontWeight: 500 }}>{a.ra}</td>
                    <td style={{ padding: '10px 14px' }}>{a.nome}</td>
                    <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontSize: 12 }}>{a.cpf}</td>
                    <td style={{ padding: '10px 14px', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cursoNome}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12 }}>{INGRESSO_LABEL[a.formaIngresso]}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: vc.bg, color: vc.color }}>
                        {VINCULO_LABEL[a.situacaoVinculo]}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button style={{ ...BTN('ghost'), padding: '4px 10px', fontSize: 12 }} onClick={() => setModal(a)}>Editar</button>
                        <button style={{ ...BTN('danger'), padding: '4px 10px', fontSize: 12 }}
                          disabled={deleting === a.id} onClick={() => deleteAluno(a.id)}>
                          {deleting === a.id ? '...' : 'Excluir'}
                        </button>
                      </div>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <button
                        style={{ padding: '4px 10px', borderRadius: 5, border: '1px solid #1a56db', background: 'transparent', cursor: 'pointer', fontSize: 12, color: '#1a56db', fontWeight: 500 }}
                        onClick={() => router.push(`/dashboard/academico/alunos/${a.id}/historico`)}>
                        Histórico →
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {modal !== null && (
        <AlunoModal
          aluno={modal === 'new' ? null : modal}
          cursos={cursos}
          matrizes={matrizes}
          onClose={() => setModal(null)}
          onSave={load}
        />
      )}
    </div>
  );
}
