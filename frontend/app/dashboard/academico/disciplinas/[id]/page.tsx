'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';

// ── tipos ──────────────────────────────────────────────────────────────
interface DisciplinaRef { id: string; codigo: string; nome: string; }
interface PrerequisitoVinculo { id: string; prerequisito: DisciplinaRef; }
interface DependenteVinculo { id: string; disciplina: DisciplinaRef; }
interface Disciplina {
  id: string;
  matrizCurricularId: string;
  codigo: string;
  nome: string;
  cargaHoraria: number;
  creditos: number;
  ementa?: string | null;
  periodoSugerido: number;
  matrizCurricular?: { id: string; versao: string; curso: { id: string; nome: string } };
  prerequisitos: PrerequisitoVinculo[];
  dependentes: DependenteVinculo[];
}

const BTN = (v: 'primary' | 'danger' | 'ghost') => ({
  padding: '6px 14px', borderRadius: 5, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
  background: v === 'primary' ? '#1a56db' : v === 'danger' ? '#e02424' : 'transparent',
  color: v === 'ghost' ? '#374151' : '#fff',
  ...(v === 'ghost' ? { border: '1px solid #d1d5db' } : {}),
});
const INPUT = { width: '100%', padding: '7px 10px', borderRadius: 5, border: '1px solid #d1d5db', fontSize: 13, boxSizing: 'border-box' as const };
const CARD = { background: '#fff', borderRadius: 8, border: '1px solid #e5e7eb', padding: 20 };

export default function DisciplinaDetalhePage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [disciplina, setDisciplina] = useState<Disciplina | null>(null);
  const [candidatas, setCandidatas] = useState<DisciplinaRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selecionada, setSelecionada] = useState('');
  const [adicionando, setAdicionando] = useState(false);
  const [addError, setAddError] = useState('');
  const [removendo, setRemovendo] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const d = await apiFetch<Disciplina>(`/disciplinas/${id}`);
      setDisciplina(d);
      const todas = await apiFetch<DisciplinaRef[]>(
        `/disciplinas?matrizCurricularId=${d.matrizCurricularId}`,
      );
      const jaVinculadas = new Set(d.prerequisitos.map(p => p.prerequisito.id));
      setCandidatas(todas.filter(x => x.id !== d.id && !jaVinculadas.has(x.id)));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function adicionarPrerequisito(e: React.FormEvent) {
    e.preventDefault();
    if (!selecionada) return;
    setAddError('');
    setAdicionando(true);
    try {
      await apiFetch(`/disciplinas/${id}/prerequisitos`, {
        method: 'POST',
        body: JSON.stringify({ prerequisitoId: selecionada }),
      });
      setSelecionada('');
      await load();
    } catch (err: unknown) {
      setAddError(err instanceof Error ? err.message : 'Erro ao adicionar pré-requisito');
    } finally {
      setAdicionando(false);
    }
  }

  async function removerPrerequisito(prerequisitoId: string) {
    if (!confirm('Remover este pré-requisito?')) return;
    setRemovendo(prerequisitoId);
    try {
      await apiFetch(`/disciplinas/${id}/prerequisitos/${prerequisitoId}`, { method: 'DELETE' });
      await load();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erro ao remover');
    } finally {
      setRemovendo(null);
    }
  }

  if (loading) return <div style={{ padding: '24px 28px', color: '#6b7280', fontSize: 14 }}>Carregando...</div>;
  if (error || !disciplina) return (
    <div style={{ padding: '24px 28px' }}>
      <p style={{ color: '#e02424', fontSize: 14 }}>{error || 'Disciplina não encontrada.'}</p>
      <button style={BTN('ghost')} onClick={() => router.push('/dashboard/academico/disciplinas')}>
        &larr; Voltar
      </button>
    </div>
  );

  return (
    <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 800 }}>
      <div>
        <button style={{ ...BTN('ghost'), padding: '4px 10px', fontSize: 12, marginBottom: 10 }}
          onClick={() => router.push('/dashboard/academico/disciplinas')}>
          &larr; Voltar para Disciplinas
        </button>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>
          <span style={{ fontFamily: 'monospace', color: '#6b7280', marginRight: 8 }}>{disciplina.codigo}</span>
          {disciplina.nome}
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>
          {disciplina.matrizCurricular?.curso.nome} • versão {disciplina.matrizCurricular?.versao} •
          {' '}{disciplina.periodoSugerido}º período sugerido • {disciplina.cargaHoraria}h • {disciplina.creditos} créditos
        </p>
      </div>

      {disciplina.ementa && (
        <div style={CARD}>
          <h2 style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 600, color: '#374151' }}>Ementa</h2>
          <p style={{ margin: 0, fontSize: 13, color: '#4b5563', whiteSpace: 'pre-wrap' }}>{disciplina.ementa}</p>
        </div>
      )}

      <div style={CARD}>
        <h2 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700 }}>Pré-requisitos</h2>
        <p style={{ margin: '0 0 14px', fontSize: 12, color: '#6b7280' }}>
          Disciplinas que o aluno precisa ter cursado (e aprovado) antes de se matricular em {disciplina.codigo}.
        </p>

        {disciplina.prerequisitos.length === 0 ? (
          <p style={{ fontSize: 13, color: '#9ca3af', margin: '0 0 14px' }}>Nenhum pré-requisito cadastrado.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
            {disciplina.prerequisitos.map(p => (
              <div key={p.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 12px', background: '#f9fafb', borderRadius: 6, border: '1px solid #f3f4f6',
              }}>
                <span style={{ fontSize: 13 }}>
                  <span style={{ fontFamily: 'monospace', fontWeight: 600, marginRight: 8 }}>{p.prerequisito.codigo}</span>
                  {p.prerequisito.nome}
                </span>
                <button style={{ ...BTN('danger'), padding: '3px 9px', fontSize: 11.5 }}
                  disabled={removendo === p.prerequisito.id}
                  onClick={() => removerPrerequisito(p.prerequisito.id)}>
                  {removendo === p.prerequisito.id ? '...' : 'Remover'}
                </button>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={adicionarPrerequisito} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <select style={{ ...INPUT, flex: 1 }} value={selecionada}
            onChange={e => setSelecionada(e.target.value)}
            disabled={candidatas.length === 0}>
            <option value="">
              {candidatas.length === 0 ? 'Nenhuma disciplina disponível nesta matriz' : 'Selecione uma disciplina...'}
            </option>
            {candidatas.map(c => (
              <option key={c.id} value={c.id}>{c.codigo} — {c.nome}</option>
            ))}
          </select>
          <button type="submit" style={BTN('primary')} disabled={!selecionada || adicionando}>
            {adicionando ? 'Adicionando...' : '+ Adicionar'}
          </button>
        </form>
        {addError && <p style={{ color: '#e02424', fontSize: 12.5, margin: '8px 0 0' }}>{addError}</p>}
      </div>

      <div style={CARD}>
        <h2 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700 }}>É pré-requisito de</h2>
        <p style={{ margin: '0 0 14px', fontSize: 12, color: '#6b7280' }}>
          Disciplinas que exigem {disciplina.codigo} como pré-requisito. Somente leitura.
        </p>
        {disciplina.dependentes.length === 0 ? (
          <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>Nenhuma disciplina depende desta.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {disciplina.dependentes.map(dep => (
              <div key={dep.id} style={{
                padding: '8px 12px', background: '#f9fafb', borderRadius: 6, border: '1px solid #f3f4f6', fontSize: 13,
              }}>
                <span style={{ fontFamily: 'monospace', fontWeight: 600, marginRight: 8 }}>{dep.disciplina.codigo}</span>
                {dep.disciplina.nome}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
