'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { getToken, parseJwt } from '@/lib/auth';
import { TELAS_SISTEMA } from '@/lib/telas-sistema';

const EMAIL_ADMIN_MASTER = 'admin@fiurj.edu.br';

type Perfil = 'ADMIN' | 'SECRETARIA' | 'FINANCEIRO' | 'PROFESSOR' | 'ALUNO';
const PERFIS: Perfil[] = ['ADMIN', 'SECRETARIA', 'FINANCEIRO', 'PROFESSOR', 'ALUNO'];
const PERFIL_LABEL: Record<Perfil, string> = {
  ADMIN: 'Admin', SECRETARIA: 'Secretaria', FINANCEIRO: 'Financeiro',
  PROFESSOR: 'Professor', ALUNO: 'Aluno',
};
const PERFIL_COLOR: Record<Perfil, string> = {
  ADMIN: '#dc2626', SECRETARIA: '#2563eb', FINANCEIRO: '#16a34a',
  PROFESSOR: '#7c3aed', ALUNO: '#d97706',
};

type LinhaMatriz = {
  chave: string;
  label: string;
  grupo: string;
  perfis: Record<Perfil, boolean>;
};

// Ordem das seções na tela = a ordem em que os grupos aparecem em
// telas-sistema.ts (única fonte de verdade da divisão em seções).
const GRUPOS_ORDENADOS = Array.from(new Set(TELAS_SISTEMA.map(t => t.grupo)));

export default function PermissoesTelaPage() {
  const token = getToken();
  const meUser = token ? parseJwt(token) : null;
  const souAdminMaster = meUser?.email === EMAIL_ADMIN_MASTER;

  const [linhas, setLinhas] = useState<LinhaMatriz[] | null>(null);
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState<string | null>(null); // `${chave}:${perfil}` em voo
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!souAdminMaster) return;
    apiFetch<LinhaMatriz[]>('/permissoes-tela')
      .then(setLinhas)
      .catch(e => setErro(e.message ?? 'Erro ao carregar a matriz.'));
  }, [souAdminMaster]);

  const porGrupo = useMemo(() => {
    if (!linhas) return [];
    return GRUPOS_ORDENADOS.map(grupo => ({
      grupo,
      itens: linhas.filter(l => l.grupo === grupo),
    })).filter(g => g.itens.length > 0);
  }, [linhas]);

  async function alternar(chave: string, perfil: Perfil, valorAtual: boolean) {
    if (!linhas) return;
    const chaveOperacao = `${chave}:${perfil}`;
    const novoValor = !valorAtual;

    // Otimista — reverte se a chamada falhar.
    setLinhas(prev => prev!.map(l => l.chave === chave ? { ...l, perfis: { ...l.perfis, [perfil]: novoValor } } : l));
    setSalvando(chaveOperacao);
    try {
      await apiFetch('/permissoes-tela', {
        method: 'PATCH',
        body: JSON.stringify({ perfil, chaveTela: chave, habilitada: novoValor }),
      });
    } catch (e: any) {
      setLinhas(prev => prev!.map(l => l.chave === chave ? { ...l, perfis: { ...l.perfis, [perfil]: valorAtual } } : l));
      setMsg('Erro: ' + (e.message ?? 'falha ao salvar'));
      setTimeout(() => setMsg(''), 4000);
    } finally {
      setSalvando(null);
    }
  }

  if (!souAdminMaster) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <p style={{ fontSize: 14, color: 'var(--gray-500)' }}>
          Acesso restrito ao administrador principal.
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 28px' }}>
      <div style={{ marginBottom: 18 }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Permissões de Tela</h1>
        <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--gray-500)', maxWidth: 720 }}>
          Controla o que cada perfil enxerga no sistema. Desmarcar uma célula esconde o ícone/link
          dessa tela no menu (sidebar, Barra Rápida e atalhos) só pra aquele perfil — e bloqueia
          acesso direto pela URL. Isso NÃO revoga permissões que a API já concede por perfil (ver
          nota de segurança no fim da página).
        </p>
      </div>

      {msg && (
        <div style={{
          padding: '10px 14px', borderRadius: 6, marginBottom: 12, fontSize: 13,
          background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5',
        }}>{msg}</div>
      )}

      {erro ? (
        <p style={{ color: '#dc2626', fontSize: 13 }}>{erro}</p>
      ) : !linhas ? (
        <p style={{ color: 'var(--gray-500)', fontSize: 13 }}>Carregando...</p>
      ) : (
        <div style={{ background: 'var(--white)', borderRadius: 8, border: '1px solid var(--gray-200)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--gray-700)', fontSize: 12 }}>
                  Tela
                </th>
                {PERFIS.map(p => (
                  <th key={p} style={{ padding: '10px 14px', textAlign: 'center', fontSize: 12 }}>
                    <span style={{
                      display: 'inline-block', padding: '2px 10px', borderRadius: 999,
                      fontSize: 11, fontWeight: 700, color: '#fff', background: PERFIL_COLOR[p],
                    }}>{PERFIL_LABEL[p]}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {porGrupo.map(({ grupo, itens }) => (
                <Fragment key={grupo}>
                  <tr>
                    <td colSpan={PERFIS.length + 1} style={{
                      padding: '8px 14px', background: 'var(--gray-50)',
                      fontSize: 11, fontWeight: 700, color: 'var(--gray-500)',
                      textTransform: 'uppercase', letterSpacing: 0.4,
                      borderTop: '1px solid var(--gray-200)', borderBottom: '1px solid var(--gray-200)',
                    }}>
                      {grupo}
                    </td>
                  </tr>
                  {itens.map((linha, i) => (
                    <tr key={linha.chave} style={{ borderBottom: i < itens.length - 1 ? '1px solid var(--gray-100)' : 'none' }}>
                      <td style={{ padding: '9px 14px', fontWeight: 500 }}>{linha.label}</td>
                      {PERFIS.map(p => {
                        const chaveOperacao = `${linha.chave}:${p}`;
                        return (
                          <td key={p} style={{ padding: '9px 14px', textAlign: 'center' }}>
                            <input
                              type="checkbox"
                              checked={linha.perfis[p]}
                              disabled={salvando === chaveOperacao}
                              onChange={() => alternar(linha.chave, p, linha.perfis[p])}
                              style={{ width: 16, height: 16, cursor: 'pointer', accentColor: PERFIL_COLOR[p] }}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ marginTop: 18, padding: 14, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, maxWidth: 720 }}>
        <p style={{ margin: 0, fontSize: 12, color: '#92400e', lineHeight: 1.5 }}>
          <strong>Nota de segurança:</strong> esta matriz controla o que aparece no menu e bloqueia
          navegação direta por URL dentro do app. Ela ainda NÃO bloqueia a chamada à API por trás de
          cada tela — um perfil que hoje tem acesso de API a um endpoint (via <code>@Roles</code> no
          backend) continua tecnicamente conseguindo chamá-lo direto, mesmo com a tela desativada
          aqui. Pra fechar essa lacuna seria necessário um guard adicional no backend, tela por tela
          — ainda não construído. Trate isto como controle de visibilidade de menu, não como o
          único controle de acesso a dado sensível.
        </p>
      </div>
    </div>
  );
}
