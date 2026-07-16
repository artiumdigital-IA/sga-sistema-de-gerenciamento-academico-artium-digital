'use client';
import { useState } from 'react';
import { apiDownload } from '@/lib/api';

const BTN_P: React.CSSProperties = { padding: '10px 18px', borderRadius: 6, border: 'none', background: '#1a56db', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 };
const BTN_G: React.CSSProperties = { padding: '10px 18px', borderRadius: 6, border: '1px solid var(--gray-300)', cursor: 'pointer', fontSize: 13, fontWeight: 500, background: 'var(--white)', color: 'var(--gray-700)' };

type Formato = 'sql' | 'sql-schema' | 'xlsx' | 'xml' | 'json' | 'uploads';

const BOTOES_BANCO: { formato: Formato; label: string; rota: string; filename: string; estilo: React.CSSProperties }[] = [
  { formato: 'sql', label: '⭳ SQL completo', rota: '/relatorios-master/dump-sql', filename: 'banco-completo.sql', estilo: BTN_P },
  { formato: 'sql-schema', label: '⭳ SQL (só schema)', rota: '/relatorios-master/dump-sql?apenasSchema=true', filename: 'schema.sql', estilo: BTN_G },
  { formato: 'xlsx', label: '⭳ XLSX', rota: '/relatorios-master/dump-xlsx', filename: 'banco-completo.xlsx', estilo: BTN_G },
  { formato: 'xml', label: '⭳ XML', rota: '/relatorios-master/dump-xml', filename: 'banco-completo.xml', estilo: BTN_G },
  { formato: 'json', label: '⭳ JSON', rota: '/relatorios-master/dump-json', filename: 'banco-completo.json', estilo: BTN_G },
];

export default function RelatoriosMasterPage() {
  const [baixando, setBaixando] = useState<Formato | null>(null);
  const [erro, setErro] = useState('');

  async function baixar(formato: Formato, rota: string, filename: string) {
    setErro('');
    setBaixando(formato);
    try {
      await apiDownload(rota, filename);
    } catch (e: any) {
      setErro(e.message ?? 'Erro ao gerar o arquivo.');
    } finally {
      setBaixando(null);
    }
  }

  return (
    <div style={{ padding: '24px 28px', maxWidth: 720 }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700 }}>Relatórios Master</h1>
        <p style={{ margin: 0, fontSize: 12, color: 'var(--gray-500)' }}>
          Exportação completa do sistema — só o perfil Master enxerga esta tela.
        </p>
      </div>

      {erro && (
        <div style={{ padding: '10px 14px', borderRadius: 6, marginBottom: 16, fontSize: 13, background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5' }}>
          {erro}
        </div>
      )}

      <div style={{ background: 'var(--gray-50)', border: '1px solid var(--gray-200)', borderRadius: 8, padding: 18, marginBottom: 20 }}>
        <h2 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 700 }}>Banco de Dados</h2>
        <p style={{ margin: '0 0 16px', fontSize: 12, color: 'var(--gray-500)' }}>
          Contém dados pessoais (LGPD) e financeiros de toda a instituição. O SQL completo traz o banco
          restaurável de verdade (schema + dados); XLSX, XML e JSON são pra leitura/análise e nunca trazem
          senha nem segredo de MFA. Cada download fica registrado no Log de Auditoria.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {BOTOES_BANCO.map(b => (
            <button
              key={b.formato}
              style={{ ...b.estilo, opacity: baixando && baixando !== b.formato ? 0.5 : 1 }}
              disabled={baixando !== null}
              onClick={() => baixar(b.formato, b.rota, b.filename)}
            >
              {baixando === b.formato ? 'Gerando...' : b.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ background: 'var(--gray-50)', border: '1px solid var(--gray-200)', borderRadius: 8, padding: 18 }}>
        <h2 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 700 }}>Arquivos Enviados</h2>
        <p style={{ margin: '0 0 16px', fontSize: 12, color: 'var(--gray-500)' }}>
          Fotos de perfil, documentos de aluno, capturas de prova e imagens de identidade visual — arquivos
          físicos que ficam em disco, fora do banco de dados.
        </p>
        <button
          style={{ ...BTN_G, opacity: baixando && baixando !== 'uploads' ? 0.5 : 1 }}
          disabled={baixando !== null}
          onClick={() => baixar('uploads', '/relatorios-master/uploads-zip', 'uploads.zip')}
        >
          {baixando === 'uploads' ? 'Compactando...' : '⭳ ZIP de uploads'}
        </button>
      </div>
    </div>
  );
}
