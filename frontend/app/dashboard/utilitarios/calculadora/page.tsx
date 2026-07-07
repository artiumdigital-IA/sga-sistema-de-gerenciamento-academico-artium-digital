'use client';
import { useState } from 'react';

interface Avaliacao {
  id: string;
  tipo: string;
  nota: string;
  peso: string;
}

const INPUT: React.CSSProperties = { padding: '7px 10px', borderRadius: 5, border: '1px solid var(--gray-300)', fontSize: 13, boxSizing: 'border-box', width: '100%' };
const LABEL: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: 'var(--gray-700)', display: 'block', marginBottom: 4 };
const CARD: React.CSSProperties = { background: 'var(--white)', border: '1px solid var(--gray-200)', borderRadius: 8, padding: 20 };
const BTN_P: React.CSSProperties = { padding: '7px 16px', borderRadius: 5, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, background: '#1a56db', color: '#fff' };
const BTN_G: React.CSSProperties = { padding: '6px 12px', borderRadius: 5, border: '1px solid var(--gray-300)', cursor: 'pointer', fontSize: 12, background: 'transparent', color: 'var(--gray-700)' };

let seq = 0;
function novaLinha(): Avaliacao {
  seq += 1;
  return { id: `av-${seq}`, tipo: '', nota: '', peso: '1' };
}

export default function CalculadoraPage() {
  const [linhas, setLinhas] = useState<Avaliacao[]>([novaLinha(), novaLinha()]);

  function set(id: string, campo: keyof Avaliacao, valor: string) {
    setLinhas(ls => ls.map(l => l.id === id ? { ...l, [campo]: valor } : l));
  }
  function add() { setLinhas(ls => [...ls, novaLinha()]); }
  function remover(id: string) { setLinhas(ls => ls.filter(l => l.id !== id)); }

  const validas = linhas.filter(l => l.nota !== '' && !isNaN(Number(l.nota)) && !isNaN(Number(l.peso)) && Number(l.peso) > 0);
  const somaPesos = validas.reduce((s, l) => s + Number(l.peso), 0);
  const media = somaPesos > 0
    ? validas.reduce((s, l) => s + Number(l.nota) * Number(l.peso), 0) / somaPesos
    : null;

  const aprovadoDireto = media !== null && media >= 6;
  // Regra confirmada com a secretaria: exame final = (média_semestre + nota_exame) / 2, mínimo 6.0
  const notaExameNecessaria = media !== null && !aprovadoDireto ? Math.max(0, 12 - media) : null;
  const examePossivel = notaExameNecessaria !== null && notaExameNecessaria <= 10;

  return (
    <div style={{ padding: '24px 28px', maxWidth: 720 }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700 }}>Calculadora de Médias</h1>
        <p style={{ margin: 0, fontSize: 12, color: 'var(--gray-500)' }}>
          Simula a média ponderada de um aluno e, se necessário, a nota mínima no exame final para aprovação —
          útil pra secretaria e professores conferirem casos antes de lançar oficialmente em Notas.
        </p>
      </div>

      <div style={CARD}>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12 }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--gray-500)', paddingBottom: 6 }}>Avaliação (opcional)</th>
              <th style={{ textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--gray-500)', paddingBottom: 6, width: 110 }}>Nota (0–10)</th>
              <th style={{ textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--gray-500)', paddingBottom: 6, width: 90 }}>Peso</th>
              <th style={{ width: 36 }}></th>
            </tr>
          </thead>
          <tbody>
            {linhas.map(l => (
              <tr key={l.id}>
                <td style={{ padding: '4px 6px 4px 0' }}>
                  <input style={INPUT} placeholder="Ex: Prova 1" value={l.tipo} onChange={e => set(l.id, 'tipo', e.target.value)} />
                </td>
                <td style={{ padding: '4px 6px' }}>
                  <input style={INPUT} type="number" min="0" max="10" step="0.1" value={l.nota} onChange={e => set(l.id, 'nota', e.target.value)} />
                </td>
                <td style={{ padding: '4px 6px' }}>
                  <input style={INPUT} type="number" min="0.1" step="0.1" value={l.peso} onChange={e => set(l.id, 'peso', e.target.value)} />
                </td>
                <td style={{ padding: '4px 0' }}>
                  <button onClick={() => remover(l.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontSize: 16, lineHeight: 1 }} title="Remover linha">×</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <button style={BTN_G} onClick={add}>+ Adicionar avaliação</button>

        <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--gray-100)' }}>
          {media === null ? (
            <p style={{ fontSize: 13, color: 'var(--gray-500)', margin: 0 }}>Preencha ao menos uma nota e peso pra calcular.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 14 }}>
                Média ponderada: <strong style={{ fontSize: 16 }}>{media.toFixed(2)}</strong>
              </div>

              {aprovadoDireto ? (
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, padding: '10px 14px', fontSize: 13, color: '#166534' }}>
                  Aprovado diretamente — média igual ou acima de 6,0.
                </div>
              ) : (
                <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 6, padding: '10px 14px', fontSize: 13, color: '#92400e' }}>
                  Abaixo de 6,0 — precisa de exame final (considerando que a frequência mínima de 75% está ok).
                  {examePossivel ? (
                    <> Nota mínima necessária no exame: <strong>{notaExameNecessaria!.toFixed(2)}</strong> (nota final = (média + exame) / 2).</>
                  ) : (
                    <> Mesmo com nota 10 no exame, a nota final não alcançaria 6,0 — reprovado por nota.</>
                  )}
                </div>
              )}

              <p style={{ fontSize: 11, color: 'var(--gray-400)', margin: 0 }}>
                Regras usadas: aprovação direta com média ≥ 6,0; exame final só pra quem tem frequência ≥ 75%;
                nota final do exame = (média do semestre + nota do exame) / 2. Esta calculadora não lança nada
                no sistema — é só uma simulação rápida.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
