'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch, apiUpload, apiFileUrl } from '@/lib/api';

interface Documento {
  id: string; tipo: string; nomeArquivo: string; url: string; tamanho: number; criadoEm: string;
}
interface Resposta {
  aluno: { id: string; nome: string; ra: string };
  documentos: Documento[];
}

const TIPOS_SUGERIDOS = ['RG', 'CPF', 'Comprovante de Residência', 'Histórico Escolar', 'Diploma', 'Certidão de Nascimento/Casamento', 'Foto 3x4', 'Outro'];

const BTN_P: React.CSSProperties = { padding: '7px 16px', borderRadius: 5, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, background: '#1a56db', color: '#fff' };
const BTN_G: React.CSSProperties = { padding: '7px 16px', borderRadius: 5, border: '1px solid #d1d5db', cursor: 'pointer', fontSize: 13, background: '#fff', color: '#374151' };
const INPUT: React.CSSProperties = { padding: '7px 10px', borderRadius: 5, border: '1px solid #d1d5db', fontSize: 13, boxSizing: 'border-box' };

function fmtBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentosAlunoPage() {
  const params = useParams();
  const alunoId = params?.id as string;
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [aluno, setAluno] = useState<{ nome: string; ra: string } | null>(null);
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [tipo, setTipo] = useState(TIPOS_SUGERIDOS[0]);
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setErro('');
    try {
      const data = await apiFetch<Resposta>(`/documentos-aluno/${alunoId}`);
      setAluno(data.aluno); setDocumentos(data.documentos);
    } catch (e: any) { setErro(e.message ?? 'Erro ao carregar'); }
    finally { setLoading(false); }
  }, [alunoId]);

  useEffect(() => { load(); }, [load]);

  async function onEscolherArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setErro(''); setEnviando(true);
    try {
      const formData = new FormData();
      formData.append('arquivo', file);
      formData.append('tipo', tipo);
      await apiUpload(`/documentos-aluno/${alunoId}`, formData);
      await load();
    } catch (err: any) { setErro(err.message ?? 'Erro ao enviar documento'); }
    finally { setEnviando(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
  }

  async function remover(id: string) {
    if (!confirm('Excluir este documento?')) return;
    try { await apiFetch(`/documentos-aluno/arquivo/${id}`, { method: 'DELETE' }); setDocumentos(d => d.filter(x => x.id !== id)); }
    catch (err: any) { alert(err.message ?? 'Erro ao excluir'); }
  }

  if (loading) return <div style={{ padding: 24, color: '#6b7280', fontSize: 13 }}>Carregando...</div>;
  if (erro && !aluno) return <div style={{ padding: 24, color: '#dc2626', fontSize: 13 }}>{erro}</div>;

  return (
    <div style={{ padding: '24px 28px', maxWidth: 720 }}>
      <button onClick={() => router.back()} style={{ ...BTN_G, padding: '5px 12px', fontSize: 12, marginBottom: 12 }}>← Voltar</button>

      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700 }}>Digitalização de Documentos</h1>
        <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>{aluno?.nome} — RA {aluno?.ra}</p>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Tipo de documento</label>
            <select style={{ ...INPUT, minWidth: 220 }} value={tipo} onChange={e => setTipo(e.target.value)}>
              {TIPOS_SUGERIDOS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <button style={BTN_P} disabled={enviando} onClick={() => fileInputRef.current?.click()}>
            {enviando ? 'Enviando...' : '+ Enviar arquivo'}
          </button>
          <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp" onChange={onEscolherArquivo} style={{ display: 'none' }} />
        </div>
        <p style={{ fontSize: 11, color: '#9ca3af', margin: '10px 0 0' }}>PDF, DOC/DOCX, JPG, PNG ou WEBP — até 10MB.</p>
        {erro && <p style={{ color: '#dc2626', fontSize: 12, margin: '8px 0 0' }}>{erro}</p>}
      </div>

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              {['Tipo', 'Arquivo', 'Tamanho', 'Enviado em', ''].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: 12 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {documentos.length === 0 && (
              <tr><td colSpan={5} style={{ padding: 24, textAlign: 'center', color: '#9ca3af' }}>Nenhum documento enviado ainda.</td></tr>
            )}
            {documentos.map(d => (
              <tr key={d.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '10px 14px' }}>{d.tipo}</td>
                <td style={{ padding: '10px 14px' }}>
                  <a href={apiFileUrl(d.url) ?? '#'} target="_blank" rel="noreferrer" style={{ color: '#1a56db', textDecoration: 'none' }}>{d.nomeArquivo}</a>
                </td>
                <td style={{ padding: '10px 14px', color: '#6b7280', fontSize: 12 }}>{fmtBytes(d.tamanho)}</td>
                <td style={{ padding: '10px 14px', color: '#6b7280', fontSize: 12 }}>{new Date(d.criadoEm).toLocaleDateString('pt-BR')}</td>
                <td style={{ padding: '10px 14px' }}>
                  <button onClick={() => remover(d.id)} style={{ padding: '4px 10px', borderRadius: 5, border: '1px solid #dc2626', background: 'transparent', cursor: 'pointer', fontSize: 12, color: '#dc2626', fontWeight: 500 }}>
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
