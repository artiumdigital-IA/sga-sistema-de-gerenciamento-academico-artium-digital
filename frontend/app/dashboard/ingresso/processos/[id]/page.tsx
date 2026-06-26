'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';

type StatusInscricao = 'INSCRITO' | 'EM_ANALISE' | 'APROVADO' | 'REPROVADO' | 'MATRICULADO' | 'DESISTENTE';

interface Candidato { id: string; nome: string; cpf: string; email: string; }
interface Processo {
  id: string; nome: string; tipo: string; status: string;
  vagas: number; curso: { id: string; nome: string; };
  periodoLetivo: { ano: number; semestre: number; };
  inscricoes: Inscricao[];
}
interface Inscricao {
  id: string; status: StatusInscricao; notaEnem?: number;
  documentosOk: boolean; observacoes?: string; alunoId?: string;
  candidato: Candidato;
}
interface Matriz { id: string; versao: string; }

const ST_STYLE: Record<StatusInscricao, { bg: string; color: string }> = {
  INSCRITO: { bg: '#dbeafe', color: '#1e40af' }, EM_ANALISE: { bg: '#fef3c7', color: '#92400e' },
  APROVADO: { bg: '#d1fae5', color: '#065f46' }, REPROVADO: { bg: '#fee2e2', color: '#991b1b' },
  MATRICULADO: { bg: '#f3e8ff', color: '#6b21a8' }, DESISTENTE: { bg: '#f3f4f6', color: '#6b7280' },
};
const INPUT: React.CSSProperties = { padding: '7px 10px', borderRadius: 5, border: '1px solid #d1d5db', fontSize: 13, width: '100%', boxSizing: 'border-box' };
const BTN_P: React.CSSProperties = { padding: '7px 14px', borderRadius: 5, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, background: '#1a56db', color: '#fff' };
const BTN_G: React.CSSProperties = { ...BTN_P, background: 'transparent', color: '#374151', border: '1px solid #d1d5db' };

function ModalConverter({ inscricao, processoId, onClose, onDone }: {
  inscricao: Inscricao; processoId: string; onClose: () => void; onDone: () => void;
}) {
  const [matrizes, setMatrizes] = useState<Matriz[]>([]);
  const [matrizId, setMatrizId] = useState('');
  const [saving, setSaving] = useState(false);
  const [resultado, setResultado] = useState<{ ra: string; senhaTemporaria: string } | null>(null);
  const [erro, setErro] = useState('');

  useEffect(() => {
    // buscar matrizes do curso do processo — precisamos do cursoId
    // vamos buscar via processo
    apiFetch<Matriz[]>('/matrizes-curriculares').then(ms => {
      setMatrizes(ms);
      if (ms.length > 0) setMatrizId(ms[0].id);
    }).catch(() => {});
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErro(''); setSaving(true);
    try {
      const res = await apiFetch<any>(`/inscricoes/${inscricao.id}/converter-aluno`, {
        method: 'POST', body: JSON.stringify({ matrizCurricularId: matrizId }),
      });
      setResultado({ ra: res.aluno.ra, senhaTemporaria: res.senhaTemporaria });
      onDone();
    } catch (e: any) { setErro(e.message ?? 'Erro'); }
    finally { setSaving(false); }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: '#fff', borderRadius: 10, padding: 28, width: 460, boxShadow: '0 10px 40px rgba(0,0,0,.18)' }}>
        <h2 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700 }}>Converter em Aluno</h2>
        <p style={{ margin: '0 0 18px', fontSize: 12, color: '#6b7280' }}>{inscricao.candidato.nome}</p>

        {resultado ? (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: 16 }}>
            <p style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 700, color: '#065f46' }}>Aluno criado com sucesso!</p>
            <p style={{ margin: '4px 0', fontSize: 13 }}>RA: <strong>{resultado.ra}</strong></p>
            <p style={{ margin: '4px 0', fontSize: 13 }}>Senha temporária: <strong style={{ fontFamily: 'monospace', background: '#e8f5e9', padding: '1px 6px', borderRadius: 3 }}>{resultado.senhaTemporaria}</strong></p>
            <p style={{ margin: '8px 0 0', fontSize: 11, color: '#6b7280' }}>Anote a senha temporária — ela não será exibida novamente.</p>
            <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end' }}>
              <button style={BTN_G} onClick={onClose}>Fechar</button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 3 }}>Matriz Curricular *</label>
              <select style={INPUT} value={matrizId} onChange={e => setMatrizId(e.target.value)} required>
                <option value="">Selecione...</option>
                {matrizes.map(m => <option key={m.id} value={m.id}>{m.versao}</option>)}
              </select>
            </div>
            {erro && <p style={{ color: '#dc2626', fontSize: 12, margin: 0 }}>{erro}</p>}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button type="button" style={BTN_G} onClick={onClose}>Cancelar</button>
              <button type="submit" style={{ ...BTN_P, background: '#16a34a' }} disabled={saving || !matrizId}>{saving ? 'Criando...' : 'Criar Aluno'}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function InscricoesPage() {
  const params = useParams();
  const router = useRouter();
  const processoId = params?.id as string;
  const [processo, setProcesso] = useState<Processo | null>(null);
  const [loading, setLoading] = useState(true);
  const [atualizando, setAtualizando] = useState('');
  const [modalConverter, setModalConverter] = useState<Inscricao | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setProcesso(await apiFetch<Processo>(`/processos-seletivos/${processoId}`)); }
    finally { setLoading(false); }
  }, [processoId]);

  useEffect(() => { load(); }, [load]);

  async function mudarStatus(inscricaoId: string, status: StatusInscricao) {
    setAtualizando(inscricaoId);
    try { await apiFetch(`/inscricoes/${inscricaoId}`, { method: 'PATCH', body: JSON.stringify({ status }) }); await load(); }
    finally { setAtualizando(''); }
  }

  if (loading) return <div style={{ padding: 32, color: '#6b7280' }}>Carregando...</div>;
  if (!processo) return null;

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={() => router.push('/dashboard/ingresso/processos')}
          style={{ background: '#fff', border: '1px solid #d1d5db', borderRadius: 6, padding: '6px 12px', fontSize: 13, cursor: 'pointer' }}>← Voltar</button>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{processo.nome}</h1>
          <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>{processo.curso.nome} · {processo.periodoLetivo.ano}/{processo.periodoLetivo.semestre} · {processo.vagas} vagas</p>
        </div>
      </div>

      {processo.inscricoes.length === 0 ? (
        <p style={{ color: '#6b7280', fontSize: 13 }}>Nenhuma inscrição registrada.</p>
      ) : (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ background: '#f9fafb' }}>
              {['Candidato', 'CPF', 'Email', 'Nota ENEM', 'Docs', 'Status', 'Ações'].map(h => (
                <th key={h} style={{ padding: '10px 12px', fontSize: 11, fontWeight: 600, color: '#6b7280', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>{processo.inscricoes.map(ins => {
              const ss = ST_STYLE[ins.status];
              return (
                <tr key={ins.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 500 }}>{ins.candidato.nome}</td>
                  <td style={{ padding: '10px 12px', fontSize: 12, color: '#6b7280' }}>{ins.candidato.cpf}</td>
                  <td style={{ padding: '10px 12px', fontSize: 12 }}>{ins.candidato.email}</td>
                  <td style={{ padding: '10px 12px', fontSize: 13 }}>{ins.notaEnem ? Number(ins.notaEnem).toFixed(1) : '—'}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ fontSize: 14 }}>{ins.documentosOk ? '✓' : '—'}</span>
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600, ...ss }}>{ins.status}</span>
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {ins.status === 'INSCRITO' && (
                        <>
                          <button onClick={() => mudarStatus(ins.id, 'EM_ANALISE')} disabled={atualizando === ins.id} style={{ padding: '3px 8px', fontSize: 11, borderRadius: 4, border: '1px solid #d97706', background: '#fffbeb', color: '#92400e', cursor: 'pointer' }}>Em Análise</button>
                          <button onClick={() => mudarStatus(ins.id, 'REPROVADO')} disabled={atualizando === ins.id} style={{ padding: '3px 8px', fontSize: 11, borderRadius: 4, border: '1px solid #fca5a5', background: '#fef2f2', color: '#dc2626', cursor: 'pointer' }}>Reprovar</button>
                        </>
                      )}
                      {ins.status === 'EM_ANALISE' && (
                        <>
                          <button onClick={() => mudarStatus(ins.id, 'APROVADO')} disabled={atualizando === ins.id} style={{ padding: '3px 8px', fontSize: 11, borderRadius: 4, border: '1px solid #16a34a', background: '#f0fdf4', color: '#16a34a', cursor: 'pointer', fontWeight: 600 }}>Aprovar</button>
                          <button onClick={() => mudarStatus(ins.id, 'REPROVADO')} disabled={atualizando === ins.id} style={{ padding: '3px 8px', fontSize: 11, borderRadius: 4, border: '1px solid #fca5a5', background: '#fef2f2', color: '#dc2626', cursor: 'pointer' }}>Reprovar</button>
                          <button onClick={() => mudarStatus(ins.id, 'DESISTENTE')} disabled={atualizando === ins.id} style={{ padding: '3px 8px', fontSize: 11, borderRadius: 4, border: '1px solid #d1d5db', background: '#f9fafb', color: '#6b7280', cursor: 'pointer' }}>Desistente</button>
                        </>
                      )}
                      {ins.status === 'APROVADO' && !ins.alunoId && (
                        <button onClick={() => setModalConverter(ins)} style={{ padding: '3px 10px', fontSize: 11, borderRadius: 4, border: '1px solid #7c3aed', background: '#f5f3ff', color: '#7c3aed', cursor: 'pointer', fontWeight: 600 }}>→ Criar Aluno</button>
                      )}
                      {ins.status === 'MATRICULADO' && (
                        <span style={{ fontSize: 11, color: '#6b7280' }}>✓ Aluno criado</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}</tbody>
          </table>
        </div>
      )}

      {modalConverter && (
        <ModalConverter
          inscricao={modalConverter}
          processoId={processoId}
          onClose={() => setModalConverter(null)}
          onDone={load}
        />
      )}
    </div>
  );
}
