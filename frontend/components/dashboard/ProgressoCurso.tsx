'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

interface PainelDiscente {
  progresso: { periodosCursados: number; totalPeriodos: number; percentual: number };
  cr: number;
  integralizacao: { percentual: number };
}

/**
 * Progresso do aluno no curso — substitui a barra "XX% concluído" fixa
 * (62% hardcoded, igual pra todo mundo) que antes ficava no rodapé de TODAS
 * as telas. Agora aparece só aqui, no /dashboard do próprio aluno, com o
 * dado real (períodos letivos cursados / prazo de integralização do curso).
 */
export function ProgressoCurso() {
  const [dados, setDados] = useState<PainelDiscente | null>(null);

  useEffect(() => {
    apiFetch<PainelDiscente>('/discente/painel').then(setDados).catch(() => setDados(null));
  }, []);

  if (!dados) return null;
  const { percentual, periodosCursados, totalPeriodos } = dados.progresso;

  return (
    <div style={{
      margin: '14px 14px 0', background: 'var(--white)', border: '1px solid var(--gray-200)',
      borderRadius: 8, padding: '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,.06)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-700)' }}>Meu progresso no curso</span>
        <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>{periodosCursados} de {totalPeriodos} períodos</span>
      </div>
      <div style={{ height: 8, width: '100%', background: 'var(--gray-200)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${percentual}%`, background: 'var(--blue-dark)', borderRadius: 4, transition: 'width .3s ease' }} />
      </div>
      <div style={{ marginTop: 6, fontSize: 11.5, color: 'var(--gray-400)' }}>
        {percentual}% concluído · CR {dados.cr.toFixed(2)} · {dados.integralizacao.percentual}% da carga horária integralizada
      </div>
    </div>
  );
}
