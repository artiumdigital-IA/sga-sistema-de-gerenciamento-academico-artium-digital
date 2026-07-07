'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';

interface Ficha {
  tipoSanguineo: string | null;
  alergias: string | null;
  medicamentosUso: string | null;
  deficiencia: string | null;
  planoSaude: string | null;
  contatoEmergenciaNome: string | null;
  contatoEmergenciaTelefone: string | null;
  observacoes: string | null;
}

interface Resposta {
  aluno: { id: string; nome: string; ra: string };
  ficha: Ficha | null;
}

type Form = {
  tipoSanguineo: string; alergias: string; medicamentosUso: string; deficiencia: string;
  planoSaude: string; contatoEmergenciaNome: string; contatoEmergenciaTelefone: string; observacoes: string;
};

const EMPTY: Form = {
  tipoSanguineo: '', alergias: '', medicamentosUso: '', deficiencia: '',
  planoSaude: '', contatoEmergenciaNome: '', contatoEmergenciaTelefone: '', observacoes: '',
};

const TIPOS_SANGUINEOS = ['', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Não informado'];

const INPUT: React.CSSProperties = { padding: '7px 10px', borderRadius: 5, border: '1px solid var(--gray-300)', fontSize: 13, boxSizing: 'border-box', width: '100%' };
const LABEL: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--gray-700)', marginBottom: 4 };
const BTN_P: React.CSSProperties = { padding: '7px 16px', borderRadius: 5, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, background: '#1a56db', color: '#fff' };
const BTN_G: React.CSSProperties = { padding: '7px 16px', borderRadius: 5, border: '1px solid var(--gray-300)', cursor: 'pointer', fontSize: 13, background: 'var(--white)', color: 'var(--gray-700)' };

function G({ cols, children }: { cols: string; children: React.ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: cols, gap: 12 }}>{children}</div>;
}
function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label style={LABEL}>{label}</label>{children}</div>;
}

export default function FichaSaudePage() {
  const params = useParams();
  const alunoId = params?.id as string;
  const router = useRouter();

  const [aluno, setAluno] = useState<{ nome: string; ra: string } | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState('');
  const [salvo, setSalvo] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setErro('');
    try {
      const data = await apiFetch<Resposta>(`/fichas-saude/${alunoId}`);
      setAluno(data.aluno);
      if (data.ficha) {
        setForm({
          tipoSanguineo: data.ficha.tipoSanguineo ?? '',
          alergias: data.ficha.alergias ?? '',
          medicamentosUso: data.ficha.medicamentosUso ?? '',
          deficiencia: data.ficha.deficiencia ?? '',
          planoSaude: data.ficha.planoSaude ?? '',
          contatoEmergenciaNome: data.ficha.contatoEmergenciaNome ?? '',
          contatoEmergenciaTelefone: data.ficha.contatoEmergenciaTelefone ?? '',
          observacoes: data.ficha.observacoes ?? '',
        });
      }
    } catch (e: any) { setErro(e.message ?? 'Erro ao carregar'); }
    finally { setLoading(false); }
  }, [alunoId]);

  useEffect(() => { load(); }, [load]);

  const set = (k: keyof Form, v: string) => { setForm(f => ({ ...f, [k]: v })); setSalvo(false); };

  async function salvar(e: React.FormEvent) {
    e.preventDefault(); setErro(''); setSaving(true); setSalvo(false);
    try {
      const body = Object.fromEntries(
        Object.entries(form).map(([k, v]) => [k, v.trim() === '' ? undefined : v.trim()])
      );
      await apiFetch(`/fichas-saude/${alunoId}`, { method: 'PUT', body: JSON.stringify(body) });
      setSalvo(true);
    } catch (e: any) { setErro(e.message ?? 'Erro ao salvar'); }
    finally { setSaving(false); }
  }

  if (loading) return <div style={{ padding: 24, color: 'var(--gray-500)', fontSize: 13 }}>Carregando...</div>;
  if (erro && !aluno) return <div style={{ padding: 24, color: '#dc2626', fontSize: 13 }}>{erro}</div>;

  return (
    <div style={{ padding: '24px 28px', maxWidth: 680 }}>
      <button onClick={() => router.back()} style={{ ...BTN_G, padding: '5px 12px', fontSize: 12, marginBottom: 12 }}>← Voltar</button>

      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700 }}>Ficha de Saúde</h1>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--gray-500)' }}>{aluno?.nome} — RA {aluno?.ra}</p>
        <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--gray-400)' }}>
          Dado sensível (LGPD). Visível apenas para Admin e Secretaria.
        </p>
      </div>

      <form onSubmit={salvar} style={{ background: 'var(--white)', border: '1px solid var(--gray-200)', borderRadius: 8, padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <G cols="1fr 2fr">
          <F label="Tipo sanguíneo">
            <select style={INPUT} value={form.tipoSanguineo} onChange={e => set('tipoSanguineo', e.target.value)}>
              {TIPOS_SANGUINEOS.map(t => <option key={t} value={t}>{t || 'Não informado'}</option>)}
            </select>
          </F>
          <F label="Deficiência (se houver)">
            <input style={INPUT} value={form.deficiencia} placeholder="Ex: Auditiva, Visual" onChange={e => set('deficiencia', e.target.value)} />
          </F>
        </G>

        <F label="Alergias">
          <textarea style={{ ...INPUT, minHeight: 60, resize: 'vertical', fontFamily: 'inherit' }} value={form.alergias} onChange={e => set('alergias', e.target.value)} />
        </F>

        <F label="Medicamentos em uso">
          <textarea style={{ ...INPUT, minHeight: 60, resize: 'vertical', fontFamily: 'inherit' }} value={form.medicamentosUso} onChange={e => set('medicamentosUso', e.target.value)} />
        </F>

        <F label="Plano de saúde">
          <input style={INPUT} value={form.planoSaude} onChange={e => set('planoSaude', e.target.value)} />
        </F>

        <G cols="1fr 1fr">
          <F label="Contato de emergência — nome">
            <input style={INPUT} value={form.contatoEmergenciaNome} onChange={e => set('contatoEmergenciaNome', e.target.value)} />
          </F>
          <F label="Contato de emergência — telefone">
            <input style={INPUT} value={form.contatoEmergenciaTelefone} placeholder="(21) 99999-9999" onChange={e => set('contatoEmergenciaTelefone', e.target.value)} />
          </F>
        </G>

        <F label="Observações">
          <textarea style={{ ...INPUT, minHeight: 70, resize: 'vertical', fontFamily: 'inherit' }} value={form.observacoes} onChange={e => set('observacoes', e.target.value)} />
        </F>

        {erro && <p style={{ color: '#dc2626', fontSize: 13, margin: 0 }}>{erro}</p>}
        {salvo && <p style={{ color: '#16a34a', fontSize: 13, margin: 0 }}>Ficha salva com sucesso.</p>}

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" style={BTN_P} disabled={saving}>{saving ? 'Salvando...' : 'Salvar ficha'}</button>
        </div>
      </form>
    </div>
  );
}
