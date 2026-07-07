'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';

type Sexo = 'MASCULINO' | 'FEMININO' | 'NAO_DECLARADO';
type CorRaca = 'BRANCA' | 'PRETA' | 'PARDA' | 'AMARELA' | 'INDIGENA' | 'NAO_DECLARADO';
type FormaIngresso = 'VESTIBULAR' | 'ENEM' | 'TRANSFERENCIA_EXTERNA' | 'TRANSFERENCIA_INTERNA' | 'PORTADOR_DIPLOMA' | 'CONVENIO' | 'OUTRO';
type SituacaoVinculo = 'CURSANDO' | 'TRANCADO' | 'FORMADO' | 'EVADIDO' | 'TRANSFERIDO_OUT' | 'FALECIDO';

interface Curso { id: string; nome: string; }
interface MatrizCurricular { id: string; versao: string; cursoId: string; anoVigencia: number; }

interface Aluno {
  id: string; ra: string; nome: string; cpf: string; dataNascimento: string;
  sexo: Sexo; corRaca: CorRaca; nacionalidade: string;
  formaIngresso: FormaIngresso; dataIngresso: string;
  situacaoVinculo: SituacaoVinculo; email: string; telefone?: string;
  cep?: string; logradouro?: string; numero?: string; complemento?: string;
  bairro?: string; uf?: string; municipio?: string;
  cursoId: string; matrizCurricularId: string; curso?: { nome: string };
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
  CURSANDO: { bg: '#d1fae5', color: '#065f46' }, TRANCADO: { bg: '#fef3c7', color: '#92400e' },
  FORMADO: { bg: '#dbeafe', color: '#1e40af' }, EVADIDO: { bg: '#fee2e2', color: '#991b1b' },
  TRANSFERIDO_OUT: { bg: '#f3e8ff', color: '#6b21a8' }, FALECIDO: { bg: 'var(--gray-100)', color: 'var(--gray-700)' },
};
const UF_LIST = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

const EMPTY: FormData = {
  ra: '', nome: '', cpf: '', dataNascimento: '', sexo: 'NAO_DECLARADO',
  corRaca: 'NAO_DECLARADO', nacionalidade: 'Brasileira',
  formaIngresso: 'VESTIBULAR', dataIngresso: '', situacaoVinculo: 'CURSANDO',
  email: '', telefone: '', cursoId: '', matrizCurricularId: '',
  cep: '', logradouro: '', numero: '', complemento: '', bairro: '', uf: '', municipio: '',
};

const BTN = (v: 'primary' | 'danger' | 'ghost') => ({
  padding: '6px 14px', borderRadius: 5, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
  background: v === 'primary' ? '#1a56db' : v === 'danger' ? '#e02424' : 'transparent',
  color: v === 'ghost' ? 'var(--gray-700)' : '#fff',
  ...(v === 'ghost' ? { border: '1px solid var(--gray-300)' } : {}),
});
const INPUT: React.CSSProperties = { width: '100%', padding: '7px 10px', borderRadius: 5, border: '1px solid var(--gray-300)', fontSize: 13, boxSizing: 'border-box' };
const LABEL: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--gray-700)', marginBottom: 4 };

function G({ cols, children }: { cols: string; children: React.ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: cols, gap: 12 }}>{children}</div>;
}
function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label style={LABEL}>{label}</label>{children}</div>;
}
function SEL({ value, onChange, opts }: { value: string; onChange: (v: string) => void; opts: Record<string, string> }) {
  return <select style={INPUT} value={value} onChange={e => onChange(e.target.value)}>{Object.entries(opts).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>;
}

// ── Modal ──────────────────────────────────────────────────────────────────
function AlunoModal({ aluno, cursos, matrizes, onClose, onSave }: {
  aluno: Aluno | null; cursos: Curso[]; matrizes: MatrizCurricular[];
  onClose: () => void; onSave: () => void;
}) {
  const [tab, setTab] = useState<'dados' | 'endereco'>('dados');
  const [form, setForm] = useState<FormData>(
    aluno ? {
      ra: aluno.ra, nome: aluno.nome, cpf: aluno.cpf,
      dataNascimento: aluno.dataNascimento?.slice(0, 10) ?? '',
      sexo: aluno.sexo, corRaca: aluno.corRaca, nacionalidade: aluno.nacionalidade,
      formaIngresso: aluno.formaIngresso, dataIngresso: aluno.dataIngresso?.slice(0, 10) ?? '',
      situacaoVinculo: aluno.situacaoVinculo, email: aluno.email,
      telefone: aluno.telefone ?? '', cursoId: aluno.cursoId, matrizCurricularId: aluno.matrizCurricularId,
      cep: aluno.cep ?? '', logradouro: aluno.logradouro ?? '', numero: aluno.numero ?? '',
      complemento: aluno.complemento ?? '', bairro: aluno.bairro ?? '',
      uf: aluno.uf ?? '', municipio: aluno.municipio ?? '',
    } : EMPTY
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [cepLoading, setCepLoading] = useState(false);

  const set = (k: keyof FormData, v: string) => setForm(f => ({ ...f, [k]: v }));
  const matrizesDoC = matrizes.filter(m => m.cursoId === form.cursoId);

  async function buscarCep() {
    const cep = form.cep?.replace(/\D/g, '');
    if (!cep || cep.length !== 8) return;
    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setForm(f => ({
          ...f,
          logradouro: data.logradouro ?? f.logradouro,
          bairro: data.bairro ?? f.bairro,
          municipio: data.localidade ?? f.municipio,
          uf: data.uf ?? f.uf,
          complemento: data.complemento ?? f.complemento,
        }));
      }
    } catch { /* silently fail */ } finally { setCepLoading(false); }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      const body: Partial<FormData> = { ...form, telefone: form.telefone || undefined };
      if (!aluno) delete body.ra; // RA é gerado automaticamente pelo backend em novos alunos
      if (aluno) await apiFetch(`/alunos/${aluno.id}`, { method: 'PATCH', body: JSON.stringify(body) });
      else await apiFetch('/alunos', { method: 'POST', body: JSON.stringify(body) });
      onSave(); onClose();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally { setSaving(false); }
  }

  const tabStyle = (t: string): React.CSSProperties => ({
    padding: '8px 18px', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
    borderBottom: tab === t ? '2px solid #1a56db' : '2px solid transparent',
    color: tab === t ? '#1a56db' : 'var(--gray-500)', background: 'transparent',
  });

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: 'var(--white)', borderRadius: 10, width: 620, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 10px 40px rgba(0,0,0,.18)' }}>
        <div style={{ padding: '20px 28px 0' }}>
          <h2 style={{ margin: '0 0 16px', fontSize: 17, fontWeight: 700 }}>{aluno ? 'Editar Aluno' : 'Novo Aluno'}</h2>
          <div style={{ display: 'flex', borderBottom: '1px solid var(--gray-200)', marginBottom: 20 }}>
            <button style={tabStyle('dados')} onClick={() => setTab('dados')}>Dados Pessoais</button>
            <button style={tabStyle('endereco')} onClick={() => setTab('endereco')}>Endereço</button>
          </div>
        </div>

        <form onSubmit={submit} style={{ padding: '0 28px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>

          {tab === 'dados' && <>
            <G cols="1fr 1fr">
              <F label={aluno ? 'RA' : 'RA (gerado automaticamente)'}>
                <input style={{ ...INPUT, background: 'var(--gray-100)', color: 'var(--gray-500)' }} value={aluno ? form.ra : 'Será gerado ao salvar'} disabled />
              </F>
              <F label="Nome completo *"><input style={INPUT} value={form.nome} required onChange={e => set('nome', e.target.value)} /></F>
            </G>
            <G cols="1fr 1fr">
              <F label="CPF *"><input style={INPUT} value={form.cpf} required onChange={e => set('cpf', e.target.value)} placeholder="000.000.000-00" /></F>
              <F label="Data de nascimento *"><input style={INPUT} type="date" value={form.dataNascimento} required onChange={e => set('dataNascimento', e.target.value)} /></F>
            </G>
            <G cols="1fr 1fr">
              <F label="Sexo (Censo)"><SEL value={form.sexo} onChange={v => set('sexo', v)} opts={SEXO_LABEL} /></F>
              <F label="Cor/raça (Censo)"><SEL value={form.corRaca} onChange={v => set('corRaca', v)} opts={COR_LABEL} /></F>
            </G>
            <F label="Nacionalidade *"><input style={INPUT} value={form.nacionalidade} required onChange={e => set('nacionalidade', e.target.value)} /></F>
            <G cols="1fr 1fr">
              <F label="Forma de ingresso (Censo)"><SEL value={form.formaIngresso} onChange={v => set('formaIngresso', v)} opts={INGRESSO_LABEL} /></F>
              <F label="Data de ingresso *"><input style={INPUT} type="date" value={form.dataIngresso} required onChange={e => set('dataIngresso', e.target.value)} /></F>
            </G>
            <F label="Situação de vínculo (Censo)"><SEL value={form.situacaoVinculo} onChange={v => set('situacaoVinculo', v)} opts={VINCULO_LABEL} /></F>
            <G cols="1fr 1fr">
              <F label="E-mail *"><input style={INPUT} type="email" value={form.email} required onChange={e => set('email', e.target.value)} /></F>
              <F label="Telefone"><input style={INPUT} value={form.telefone} onChange={e => set('telefone', e.target.value)} placeholder="(21) 99999-9999" /></F>
            </G>
            <F label="Curso *">
              <select style={INPUT} value={form.cursoId} required onChange={e => set('cursoId', e.target.value)}>
                <option value="">Selecione...</option>
                {cursos.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </F>
            <F label="Matriz curricular *">
              <select style={INPUT} value={form.matrizCurricularId} required onChange={e => set('matrizCurricularId', e.target.value)} disabled={!form.cursoId}>
                <option value="">{form.cursoId ? (matrizesDoC.length === 0 ? 'Nenhuma matriz cadastrada para este curso' : 'Selecione a matriz...') : 'Selecione o curso primeiro...'}</option>
                {matrizesDoC.map(m => <option key={m.id} value={m.id}>Versão {m.versao} ({m.anoVigencia})</option>)}
              </select>
              {form.cursoId && matrizesDoC.length === 0 && (
                <span style={{ fontSize: 11, color: '#e02424', marginTop: 3, display: 'block' }}>
                  Cadastre uma matriz em Acadêmico → Matrizes antes de criar o aluno.
                </span>
              )}
            </F>
          </>}

          {tab === 'endereco' && <>
            <F label="CEP">
              <div style={{ display: 'flex', gap: 8 }}>
                <input style={{ ...INPUT, flex: 1 }} value={form.cep} placeholder="00000-000"
                  onChange={e => set('cep', e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); buscarCep(); } }} />
                <button type="button"
                  style={{ padding: '7px 14px', border: '1px solid #1a56db', borderRadius: 5, background: 'var(--white)', color: '#1a56db', cursor: 'pointer', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}
                  onClick={buscarCep} disabled={cepLoading}>
                  {cepLoading ? '...' : 'Pesquisar CEP'}
                </button>
              </div>
            </F>
            <F label="Logradouro">
              <input style={INPUT} value={form.logradouro} placeholder="Pesquise o CEP acima ou preencha manualmente"
                onChange={e => set('logradouro', e.target.value)} />
            </F>
            <G cols="1fr 2fr">
              <F label="Número"><input style={INPUT} value={form.numero} onChange={e => set('numero', e.target.value)} /></F>
              <F label="Complemento"><input style={INPUT} value={form.complemento} placeholder="Apto, Bloco, Sala..." onChange={e => set('complemento', e.target.value)} /></F>
            </G>
            <F label="Bairro"><input style={INPUT} value={form.bairro} onChange={e => set('bairro', e.target.value)} /></F>
            <G cols="1fr 2fr">
              <F label="UF">
                <select style={INPUT} value={form.uf} onChange={e => set('uf', e.target.value)}>
                  <option value="">--</option>
                  {UF_LIST.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                </select>
              </F>
              <F label="Município"><input style={INPUT} value={form.municipio} onChange={e => set('municipio', e.target.value)} /></F>
            </G>
          </>}

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

// ── Página principal ───────────────────────────────────────────────────────
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
    setLoading(true); setError('');
    try {
      const [a, c, m] = await Promise.all([
        apiFetch<Aluno[]>('/alunos'),
        apiFetch<Curso[]>('/cursos'),
        apiFetch<MatrizCurricular[]>('/matrizes'),
      ]);
      setAlunos(a); setCursos(c); setMatrizes(m);
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Erro ao carregar');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function deleteAluno(id: string) {
    if (!confirm('Excluir este aluno?')) return;
    setDeleting(id);
    try {
      await apiFetch(`/alunos/${id}`, { method: 'DELETE' });
      setAlunos(a => a.filter(x => x.id !== id));
    } catch (err: unknown) { alert(err instanceof Error ? err.message : 'Erro ao excluir');
    } finally { setDeleting(null); }
  }

  const filtered = alunos.filter(a =>
    a.nome.toLowerCase().includes(search.toLowerCase()) ||
    a.ra.includes(search) || a.cpf.includes(search) ||
    a.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: '24px 28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Alunos</h1>
          <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--gray-500)' }}>
            {alunos.length} aluno{alunos.length !== 1 ? 's' : ''} cadastrado{alunos.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button style={BTN('primary')} onClick={() => setModal('new')}>+ Novo Aluno</button>
      </div>

      <input style={{ ...INPUT, marginBottom: 16, width: 300 }}
        placeholder="Buscar por nome, RA, CPF ou e-mail..."
        value={search} onChange={e => setSearch(e.target.value)} />

      {loading && <p style={{ color: 'var(--gray-500)', fontSize: 14 }}>Carregando...</p>}
      {error && <p style={{ color: '#e02424', fontSize: 14 }}>{error}</p>}

      {!loading && (
        <div style={{ background: 'var(--white)', borderRadius: 8, border: '1px solid var(--gray-200)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
                {['RA', 'Nome', 'CPF', 'Curso', 'Ingresso', 'Situação', '', ''].map((h, i) => (
                  <th key={i} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--gray-700)', fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={8} style={{ padding: 24, textAlign: 'center', color: 'var(--gray-400)' }}>
                  {search ? 'Nenhum resultado.' : 'Nenhum aluno cadastrado ainda.'}
                </td></tr>
              )}
              {filtered.map((a, i) => {
                const vc = VINCULO_COLOR[a.situacaoVinculo];
                const cursoNome = cursos.find(c => c.id === a.cursoId)?.nome ?? '-';
                return (
                  <tr key={a.id} style={{ borderBottom: '1px solid var(--gray-100)', background: i % 2 ? 'var(--gray-50)' : 'var(--white)' }}>
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
                        <button style={{ ...BTN('danger'), padding: '4px 10px', fontSize: 12 }} disabled={deleting === a.id} onClick={() => deleteAluno(a.id)}>
                          {deleting === a.id ? '...' : 'Excluir'}
                        </button>
                      </div>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button style={{ padding: '4px 10px', borderRadius: 5, border: '1px solid #1a56db', background: 'transparent', cursor: 'pointer', fontSize: 12, color: '#1a56db', fontWeight: 500 }}
                          onClick={() => router.push(`/dashboard/academico/historico/${a.id}`)}>
                          Histórico →
                        </button>
                        <button style={{ padding: '4px 10px', borderRadius: 5, border: '1px solid #dc2626', background: 'transparent', cursor: 'pointer', fontSize: 12, color: '#dc2626', fontWeight: 500 }}
                          onClick={() => router.push(`/dashboard/academico/saude/${a.id}`)}>
                          Saúde
                        </button>
                        <button style={{ padding: '4px 10px', borderRadius: 5, border: '1px solid #7c3aed', background: 'transparent', cursor: 'pointer', fontSize: 12, color: '#7c3aed', fontWeight: 500 }}
                          onClick={() => router.push(`/dashboard/academico/documentos/${a.id}`)}>
                          Documentos
                        </button>
                        <button style={{ padding: '4px 10px', borderRadius: 5, border: '1px solid #0891b2', background: 'transparent', cursor: 'pointer', fontSize: 12, color: '#0891b2', fontWeight: 500 }}
                          onClick={() => router.push(`/dashboard/academico/equiparacoes/${a.id}`)}>
                          Equiparações
                        </button>
                        <button style={{ padding: '4px 10px', borderRadius: 5, border: '1px solid #b45309', background: 'transparent', cursor: 'pointer', fontSize: 12, color: '#b45309', fontWeight: 500 }}
                          onClick={() => router.push(`/dashboard/academico/situacao/${a.id}`)}>
                          Situação
                        </button>
                        <button style={{ padding: '4px 10px', borderRadius: 5, border: '1px solid #be123c', background: 'transparent', cursor: 'pointer', fontSize: 12, color: '#be123c', fontWeight: 500 }}
                          onClick={() => router.push(`/dashboard/academico/ocorrencias/${a.id}`)}>
                          Ocorrências
                        </button>
                        <button style={{ padding: '4px 10px', borderRadius: 5, border: '1px solid #059669', background: 'transparent', cursor: 'pointer', fontSize: 12, color: '#059669', fontWeight: 500 }}
                          onClick={() => router.push(`/dashboard/financeiro/observacoes/${a.id}`)}>
                          Obs. Financeira
                        </button>
                        <button style={{ padding: '4px 10px', borderRadius: 5, border: '1px solid #ca8a04', background: 'transparent', cursor: 'pointer', fontSize: 12, color: '#ca8a04', fontWeight: 500 }}
                          onClick={() => router.push(`/dashboard/financeiro/bolsistas/${a.id}`)}>
                          Bolsista
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {modal !== null && (
        <AlunoModal aluno={modal === 'new' ? null : modal} cursos={cursos} matrizes={matrizes}
          onClose={() => setModal(null)} onSave={load} />
      )}
    </div>
  );
}
