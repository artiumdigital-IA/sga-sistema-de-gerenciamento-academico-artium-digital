'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { formatarData } from '@/lib/format';

type ProvaGerada = {
  id: string;
  tipoProva: string;
  curso: string;
  disciplina: string;
  turma: string;
  data: string;
  criadoEm: string;
  professor: { nome: string };
};

const TIPO_PROVA_LABEL: Record<string, string> = {
  AV1: 'AV1', AV2: 'AV2', AV3: 'AV3', AV4: 'AV4', AV5: 'AV5',
  RECUPERACAO: 'Recuperação', SEGUNDA_CHAMADA: '2ª Chamada',
};

const BTN_P: React.CSSProperties = { padding: '6px 14px', borderRadius: 5, border: 'none', cursor: 'pointer', fontSize: 12.5, fontWeight: 600, background: '#1a56db', color: '#fff' };
const INPUT: React.CSSProperties = { padding: '7px 10px', borderRadius: 5, border: '1px solid var(--gray-300)', fontSize: 13, boxSizing: 'border-box' };

/**
 * "Provas Geradas" (Secretaria) — só leitura/impressão do que os
 * professores montaram no Gerador de Prova; sem edição aqui.
 */
export default function ProvasGeradasPage() {
  const router = useRouter();
  const [provas, setProvas] = useState<ProvaGerada[]>([]);
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    apiFetch<ProvaGerada[]>('/provas-geradas')
      .then(setProvas)
      .catch((e: any) => setErro(e.message ?? 'Erro ao carregar provas geradas'))
      .finally(() => setLoading(false));
  }, []);

  const filtradas = provas.filter(p => {
    const alvo = busca.trim().toLowerCase();
    if (!alvo) return true;
    return [p.professor.nome, p.curso, p.disciplina, p.turma].some(v => v.toLowerCase().includes(alvo));
  });

  return (
    <div style={{ padding: '24px 28px' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700 }}>Provas Geradas</h1>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--gray-500)' }}>Provas montadas pelos professores no Gerador de Prova — só pra visualizar/imprimir.</p>
      </div>

      <div style={{ marginBottom: 14 }}>
        <input
          style={{ ...INPUT, width: 320 }}
          placeholder="Buscar por professor, curso, disciplina ou turma..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
        />
      </div>

      {erro && <p style={{ color: '#dc2626', fontSize: 12.5, marginBottom: 12 }}>{erro}</p>}

      <div style={{ background: 'var(--white)', border: '1px solid var(--gray-200)', borderRadius: 8, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
              {['Professor', 'Curso', 'Disciplina', 'Turma', 'Prova', 'Data', ''].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--gray-700)', fontSize: 12 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={7} style={{ padding: 24, textAlign: 'center', color: 'var(--gray-400)' }}>Carregando...</td></tr>
            )}
            {!loading && filtradas.length === 0 && (
              <tr><td colSpan={7} style={{ padding: 24, textAlign: 'center', color: 'var(--gray-400)' }}>Nenhuma prova gerada encontrada.</td></tr>
            )}
            {filtradas.map(p => (
              <tr key={p.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                <td style={{ padding: '10px 14px' }}>{p.professor.nome}</td>
                <td style={{ padding: '10px 14px' }}>{p.curso}</td>
                <td style={{ padding: '10px 14px' }}>{p.disciplina}</td>
                <td style={{ padding: '10px 14px' }}>{p.turma}</td>
                <td style={{ padding: '10px 14px' }}>{TIPO_PROVA_LABEL[p.tipoProva] ?? p.tipoProva}</td>
                <td style={{ padding: '10px 14px' }}>{formatarData(p.data)}</td>
                <td style={{ padding: '10px 14px' }}>
                  <button style={BTN_P} onClick={() => router.push(`/dashboard/provas-geradas/${p.id}`)}>Imprimir</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
