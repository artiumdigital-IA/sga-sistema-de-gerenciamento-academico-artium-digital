'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { apiFetch, apiUpload, apiFileUrl } from '@/lib/api';

interface Oferta {
  id: string;
  disciplina: { nome: string; codigo: string };
  periodoLetivo: { ano: number; semestre: string };
  turno: string;
}
interface AlunoTurma { aluno: { id: string; ra: string; nome: string } }
interface Captura {
  id: string; nomeArquivo: string; url: string; tamanho: number; observacoes: string | null; criadoEm: string;
  aluno: { nome: string; ra: string };
}

const BTN_P: React.CSSProperties = { padding: '7px 16px', borderRadius: 5, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, background: '#1a56db', color: '#fff' };
const INPUT: React.CSSProperties = { padding: '7px 10px', borderRadius: 5, border: '1px solid var(--gray-300)', fontSize: 13, boxSizing: 'border-box' };

function fmtBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export default function CapturaProvaPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [ofertas, setOfertas] = useState<Oferta[]>([]);
  const [ofertaId, setOfertaId] = useState('');
  const [alunos, setAlunos] = useState<AlunoTurma[]>([]);
  const [alunoId, setAlunoId] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [capturas, setCapturas] = useState<Captura[]>([]);
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    apiFetch<Oferta[]>('/docente/ofertas')
      .then(setOfertas)
      .catch((e: any) => setErro(e.message ?? 'Erro ao carregar minhas turmas'))
      .finally(() => setLoading(false));
  }, []);

  const carregarCapturas = useCallback(async (filtroOfertaId: string) => {
    if (!filtroOfertaId) { setCapturas([]); return; }
    try {
      const data = await apiFetch<Captura[]>(`/docente/captura-prova?ofertaId=${filtroOfertaId}`);
      setCapturas(data);
    } catch (e: any) { setErro(e.message ?? 'Erro ao carregar capturas'); }
  }, []);

  useEffect(() => {
    setAlunoId('');
    if (!ofertaId) { setAlunos([]); setCapturas([]); return; }
    apiFetch<AlunoTurma[]>(`/docente/alunos?ofertaId=${ofertaId}`).then(setAlunos).catch(() => setAlunos([]));
    carregarCapturas(ofertaId);
  }, [ofertaId, carregarCapturas]);

  async function onEscolherArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ofertaId || !alunoId) { setErro('Selecione a turma e o aluno antes de enviar o arquivo.'); return; }
    setErro(''); setEnviando(true);
    try {
      const formData = new FormData();
      formData.append('arquivo', file);
      formData.append('ofertaId', ofertaId);
      formData.append('alunoId', alunoId);
      if (observacoes) formData.append('observacoes', observacoes);
      await apiUpload('/docente/captura-prova', formData);
      setObservacoes('');
      await carregarCapturas(ofertaId);
    } catch (err: any) { setErro(err.message ?? 'Erro ao enviar captura'); }
    finally { setEnviando(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
  }

  async function remover(id: string) {
    if (!confirm('Excluir esta captura de prova?')) return;
    try { await apiFetch(`/docente/captura-prova/${id}`, { method: 'DELETE' }); setCapturas(c => c.filter(x => x.id !== id)); }
    catch (err: any) { alert(err.message ?? 'Erro ao excluir'); }
  }

  if (loading) return <div style={{ padding: 24, color: 'var(--gray-500)', fontSize: 13 }}>Carregando...</div>;

  return (
    <div style={{ padding: '24px 28px', maxWidth: 800 }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700 }}>Captura de Prova</h1>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--gray-500)' }}>Fotografe ou envie o PDF da prova física corrigida do aluno — fica salva como registro digital.</p>
      </div>

      <div style={{ background: 'var(--white)', border: '1px solid var(--gray-200)', borderRadius: 8, padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-700)', display: 'block', marginBottom: 4 }}>Turma</label>
            <select style={{ ...INPUT, minWidth: 260 }} value={ofertaId} onChange={e => setOfertaId(e.target.value)}>
              <option value="">Selecione a turma</option>
              {ofertas.map(o => (
                <option key={o.id} value={o.id}>
                  {o.disciplina.codigo} - {o.disciplina.nome} ({o.periodoLetivo.ano}/{o.periodoLetivo.semestre}, {o.turno})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-700)', display: 'block', marginBottom: 4 }}>Aluno</label>
            <select style={{ ...INPUT, minWidth: 220 }} value={alunoId} onChange={e => setAlunoId(e.target.value)} disabled={!ofertaId}>
              <option value="">Selecione o aluno</option>
              {alunos.map(a => <option key={a.aluno.id} value={a.aluno.id}>{a.aluno.ra} - {a.aluno.nome}</option>)}
            </select>
          </div>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-700)', display: 'block', marginBottom: 4 }}>Observações (opcional)</label>
          <input style={{ ...INPUT, width: '100%' }} value={observacoes} onChange={e => setObservacoes(e.target.value)} placeholder="Ex.: 2ª chamada, prova substitutiva..." />
        </div>
        <button style={BTN_P} disabled={enviando || !ofertaId || !alunoId} onClick={() => fileInputRef.current?.click()}>
          {enviando ? 'Enviando...' : '+ Enviar foto/PDF da prova'}
        </button>
        <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={onEscolherArquivo} style={{ display: 'none' }} />
        <p style={{ fontSize: 11, color: 'var(--gray-400)', margin: '10px 0 0' }}>PDF, JPG, PNG ou WEBP — até 10MB.</p>
        {erro && <p style={{ color: '#dc2626', fontSize: 12, margin: '8px 0 0' }}>{erro}</p>}
      </div>

      {ofertaId && (
        <div style={{ background: 'var(--white)', border: '1px solid var(--gray-200)', borderRadius: 8, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
                {['Aluno', 'Arquivo', 'Tamanho', 'Enviado em', ''].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--gray-700)', fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {capturas.length === 0 && (
                <tr><td colSpan={5} style={{ padding: 24, textAlign: 'center', color: 'var(--gray-400)' }}>Nenhuma captura enviada ainda pra essa turma.</td></tr>
              )}
              {capturas.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                  <td style={{ padding: '10px 14px' }}>{c.aluno.ra} - {c.aluno.nome}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <a href={apiFileUrl(c.url) ?? '#'} target="_blank" rel="noreferrer" style={{ color: '#1a56db', textDecoration: 'none' }}>{c.nomeArquivo}</a>
                    {c.observacoes && <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{c.observacoes}</div>}
                  </td>
                  <td style={{ padding: '10px 14px', color: 'var(--gray-500)', fontSize: 12 }}>{fmtBytes(c.tamanho)}</td>
                  <td style={{ padding: '10px 14px', color: 'var(--gray-500)', fontSize: 12 }}>{new Date(c.criadoEm).toLocaleDateString('pt-BR')}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <button onClick={() => remover(c.id)} style={{ padding: '4px 10px', borderRadius: 5, border: '1px solid #dc2626', background: 'transparent', cursor: 'pointer', fontSize: 12, color: '#dc2626', fontWeight: 500 }}>
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
