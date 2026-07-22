'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { apiFetch, apiUpload } from '@/lib/api';

interface Lote {
  id: string;
  arquivoNome: string;
  status: 'PROCESSANDO' | 'CONCLUIDA' | 'ERRO';
  totalLinhasArquivo: number;
  totalLinhasDetalhe: number;
  linhasIgnoradasResumo: number;
  iniciadoEm: string;
  concluidoEm: string | null;
  erro: string | null;
  usuario: { nome: string | null; email: string };
}

const CARD: React.CSSProperties = { background: 'var(--white)', border: '1px solid var(--gray-200)', borderRadius: 8, padding: 16 };
const BTN_P: React.CSSProperties = { padding: '7px 16px', borderRadius: 5, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: 'var(--blue-dark)', color: '#fff' };

const STATUS_LABEL: Record<string, string> = { PROCESSANDO: 'Processando…', CONCLUIDA: 'Concluída', ERRO: 'Erro' };
const STATUS_COR: Record<string, string> = { PROCESSANDO: '#d97706', CONCLUIDA: '#16a34a', ERRO: '#dc2626' };

export default function ImportacaoLegadoPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');

  const [lotes, setLotes] = useState<Lote[]>([]);
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(() => {
    apiFetch<Lote[]>('/migration/importacao-legado')
      .then(setLotes)
      .catch(() => {})
      .finally(() => setCarregando(false));
  }, []);

  useEffect(() => { carregar(); }, [carregar]);
  // Atualiza a lista sozinha enquanto algum lote ainda está processando —
  // mesmo padrão de polling já usado no Painel do Sistema.
  useEffect(() => {
    if (!lotes.some((l) => l.status === 'PROCESSANDO')) return;
    const id = setInterval(carregar, 4000);
    return () => clearInterval(id);
  }, [lotes, carregar]);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    const arquivo = fileRef.current?.files?.[0];
    if (!arquivo) { setErro('Selecione um arquivo .xlsx.'); return; }

    setEnviando(true);
    try {
      const fd = new FormData();
      fd.append('arquivo', arquivo);
      const criado = await apiUpload<{ id: string }>('/migration/importacao-legado', fd);
      if (fileRef.current) fileRef.current.value = '';
      window.location.assign(`/dashboard/admin/importacao-legado/${criado.id}`);
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : 'Erro ao enviar arquivo.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1100 }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700, color: 'var(--gray-700)' }}>Importação de Dados Legados</h1>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--gray-500)' }}>
          Envia uma planilha do sistema antigo (ex: parcelas financeiras) e gera um relatório de
          análise — quais linhas batem com alunos já cadastrados, quais precisam de revisão manual
          e quais ainda não têm correspondência. <strong>Não grava nenhum dado financeiro real</strong>{' '}
          — é só um dry-run pra planejar a importação de verdade.
        </p>
      </div>

      <form onSubmit={enviar} style={{ ...CARD, marginBottom: 20, display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-700)', display: 'block', marginBottom: 4 }}>Planilha (.xlsx)</label>
          <input ref={fileRef} type="file" accept=".xlsx,.xls" style={{ fontSize: 12 }} />
        </div>
        <button type="submit" style={BTN_P} disabled={enviando}>{enviando ? 'Enviando…' : 'Enviar e analisar'}</button>
      </form>
      {erro && <p style={{ color: 'var(--accent-red-text)', fontSize: 12.5, margin: '0 0 16px' }}>{erro}</p>}

      <div style={CARD}>
        <h2 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: 'var(--gray-700)' }}>Lotes analisados</h2>
        {carregando && <p style={{ fontSize: 12.5, color: 'var(--gray-500)' }}>Carregando…</p>}
        {!carregando && lotes.length === 0 && <p style={{ fontSize: 12.5, color: 'var(--gray-500)' }}>Nenhum lote enviado ainda.</p>}
        {lotes.length > 0 && (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--gray-200)' }}>
                {['Arquivo', 'Status', 'Linhas', 'Enviado por', 'Data', ''].map((h) => (
                  <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, color: 'var(--gray-700)', fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lotes.map((l) => (
                <tr key={l.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                  <td style={{ padding: '8px 10px' }}>{l.arquivoNome}</td>
                  <td style={{ padding: '8px 10px' }}>
                    <span style={{ color: STATUS_COR[l.status], fontWeight: 600 }}>{STATUS_LABEL[l.status]}</span>
                  </td>
                  <td style={{ padding: '8px 10px' }}>{l.totalLinhasDetalhe > 0 ? l.totalLinhasDetalhe.toLocaleString('pt-BR') : '—'}</td>
                  <td style={{ padding: '8px 10px' }}>{l.usuario.nome || l.usuario.email}</td>
                  <td style={{ padding: '8px 10px' }}>{new Date(l.iniciadoEm).toLocaleString('pt-BR')}</td>
                  <td style={{ padding: '8px 10px' }}>
                    <Link href={`/dashboard/admin/importacao-legado/${l.id}`} style={{ color: 'var(--accent-blue-text)', textDecoration: 'none', fontWeight: 600 }}>
                      Ver relatório →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
