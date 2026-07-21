'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { INPUT, LBL, BTN_G, CARD, StatusBadge, fmtMoeda, fmtDataUtc } from './ui';

interface ContaBancaria { id: string; banco: string; agencia: string; numeroConta: string; cnabHabilitado: boolean; codigoBancoFebraban: string | null; }
interface Parcela {
  id: string; numero: number; valor: number; dataVencimento: string; status: string;
  boleto: { id: string; status: string } | null;
}
interface Contrato { id: string; parcelas: Parcela[]; aluno: { id: string; nome: string; ra: string } }
interface Boleto {
  id: string; nossoNumero: string; status: string; linhaDigitavel: string; criadoEm: string;
  parcela: { valor: number; dataVencimento: string; contrato: { aluno: { nome: string; ra: string } } };
  contaBancaria: { banco: string };
}

const PARCELA_STATUS_LABEL: Record<string, string> = { PENDENTE: 'Pendente', PAGO: 'Pago', VENCIDO: 'Vencido', CANCELADO: 'Cancelado' };

export default function BoletosPage() {
  const [busca, setBusca] = useState('');
  const [alunos, setAlunos] = useState<{ id: string; nome: string; ra: string }[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [alunoSelecionado, setAlunoSelecionado] = useState<{ id: string; nome: string; ra: string } | null>(null);
  const [contratos, setContratos] = useState<Contrato[]>([]);

  const [contas, setContas] = useState<ContaBancaria[]>([]);
  const [contaEscolhida, setContaEscolhida] = useState('');
  const [emitindo, setEmitindo] = useState<string | null>(null);
  const [erro, setErro] = useState('');

  const [boletos, setBoletos] = useState<Boleto[]>([]);
  const [filtroStatus, setFiltroStatus] = useState('');
  const [carregandoBoletos, setCarregandoBoletos] = useState(true);

  useEffect(() => {
    apiFetch<ContaBancaria[]>('/financeiro/contas-bancarias?somenteAtivas=true')
      .then(cs => {
        const habilitadas = cs.filter(c => c.cnabHabilitado);
        setContas(habilitadas);
        if (habilitadas.length === 1) setContaEscolhida(habilitadas[0].id);
      })
      .catch(() => {});
  }, []);

  const carregarBoletos = useCallback(() => {
    setCarregandoBoletos(true);
    apiFetch<Boleto[]>(`/financeiro/cnab/boletos${filtroStatus ? `?status=${filtroStatus}` : ''}`)
      .then(setBoletos)
      .catch(() => {})
      .finally(() => setCarregandoBoletos(false));
  }, [filtroStatus]);

  useEffect(() => { carregarBoletos(); }, [carregarBoletos]);

  async function buscarAlunos(e: React.FormEvent) {
    e.preventDefault();
    if (!busca.trim()) return;
    setBuscando(true);
    try {
      const r = await apiFetch<any>(`/alunos?search=${encodeURIComponent(busca)}`);
      setAlunos(Array.isArray(r) ? r : r.data ?? []);
    } catch { setAlunos([]); }
    finally { setBuscando(false); }
  }

  async function selecionarAluno(a: { id: string; nome: string; ra: string }) {
    setAlunoSelecionado(a);
    setAlunos([]);
    setErro('');
    try {
      const cs = await apiFetch<Contrato[]>(`/financeiro/contratos?alunoId=${a.id}`);
      setContratos(cs);
    } catch (e: unknown) { setErro(e instanceof Error ? e.message : 'Erro ao carregar contratos'); }
  }

  async function emitir(parcelaId: string) {
    if (!contaEscolhida) { setErro('Escolha a conta bancária CNAB antes de emitir.'); return; }
    setErro(''); setEmitindo(parcelaId);
    try {
      await apiFetch('/financeiro/cnab/boletos', { method: 'POST', body: JSON.stringify({ parcelaId, contaBancariaId: contaEscolhida }) });
      if (alunoSelecionado) await selecionarAluno(alunoSelecionado);
      carregarBoletos();
    } catch (e: unknown) { setErro(e instanceof Error ? e.message : 'Erro ao emitir boleto'); }
    finally { setEmitindo(null); }
  }

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1400 }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700 }}>Boletos (CNAB)</h1>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--gray-500)' }}>
          Emissão de boleto a partir de uma parcela e acompanhamento dos boletos já emitidos.
          Envio ao banco (remessa) e baixa automática (retorno) ficam nas telas ao lado, no menu Financeiro.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'flex-start', marginBottom: 24 }}>
        <div style={CARD}>
          <h2 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700 }}>1. Buscar aluno e emitir</h2>

          <div style={{ marginBottom: 12 }}>
            <label style={LBL}>Conta bancária (CNAB)</label>
            <select style={INPUT} value={contaEscolhida} onChange={e => setContaEscolhida(e.target.value)}>
              <option value="">Selecione...</option>
              {contas.map(c => <option key={c.id} value={c.id}>{c.banco} — ag. {c.agencia} / cc {c.numeroConta}</option>)}
            </select>
            {contas.length === 0 && (
              <p style={{ margin: '4px 0 0', fontSize: 11.5, color: '#dc2626' }}>
                Nenhuma conta habilitada pra CNAB — configure em Financeiro → Contas Bancárias.
              </p>
            )}
          </div>

          <form onSubmit={buscarAlunos} style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <input style={INPUT} placeholder="Nome, RA ou CPF do aluno" value={busca} onChange={e => setBusca(e.target.value)} />
            <button type="submit" style={BTN_G} disabled={buscando}>{buscando ? '...' : 'Buscar'}</button>
          </form>

          {alunos.length > 0 && (
            <div style={{ border: '1px solid var(--gray-200)', borderRadius: 6, marginBottom: 12, maxHeight: 160, overflowY: 'auto' }}>
              {alunos.map(a => (
                <div key={a.id} onClick={() => selecionarAluno(a)}
                  style={{ padding: '8px 10px', cursor: 'pointer', fontSize: 13, borderBottom: '1px solid var(--gray-100)' }}>
                  {a.nome} <span style={{ color: 'var(--gray-400)' }}>— RA {a.ra}</span>
                </div>
              ))}
            </div>
          )}

          {alunoSelecionado && (
            <div>
              <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600 }}>{alunoSelecionado.nome} — RA {alunoSelecionado.ra}</p>
              {contratos.length === 0 && <p style={{ fontSize: 12.5, color: 'var(--gray-500)' }}>Sem contrato cadastrado.</p>}
              {contratos.map(c => (
                <div key={c.id} style={{ marginBottom: 10 }}>
                  {c.parcelas.map(p => (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--gray-100)', fontSize: 12.5 }}>
                      <span>
                        Parcela {p.numero} — {fmtMoeda(Number(p.valor))} — venc. {fmtDataUtc(p.dataVencimento)}
                        {' '}<span style={{ color: 'var(--gray-400)' }}>({PARCELA_STATUS_LABEL[p.status] ?? p.status})</span>
                      </span>
                      {p.boleto ? (
                        <StatusBadge status={p.boleto.status} />
                      ) : (p.status === 'PENDENTE' || p.status === 'VENCIDO') ? (
                        <button style={{ ...BTN_G, padding: '3px 10px', fontSize: 11.5 }} disabled={emitindo === p.id} onClick={() => emitir(p.id)}>
                          {emitindo === p.id ? 'Emitindo...' : 'Emitir boleto'}
                        </button>
                      ) : (
                        <span style={{ color: 'var(--gray-400)', fontSize: 11.5 }}>—</span>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {erro && <p style={{ color: '#dc2626', fontSize: 12.5, margin: '8px 0 0' }}>{erro}</p>}
        </div>

        <div style={CARD}>
          <h2 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700 }}>2. Boletos emitidos</h2>
          <div style={{ marginBottom: 12 }}>
            <select style={INPUT} value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}>
              <option value="">Todos os status</option>
              {['EMITIDO', 'ENVIADO_REMESSA', 'REGISTRADO', 'LIQUIDADO', 'REJEITADO', 'CANCELADO', 'PROTESTADO'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {carregandoBoletos && <p style={{ fontSize: 12.5, color: 'var(--gray-500)' }}>Carregando...</p>}
          {!carregandoBoletos && boletos.length === 0 && <p style={{ fontSize: 12.5, color: 'var(--gray-500)' }}>Nenhum boleto emitido ainda.</p>}

          <div style={{ maxHeight: 420, overflowY: 'auto' }}>
            {boletos.map(b => (
              <Link key={b.id} href={`/dashboard/financeiro/cnab/boletos/${b.id}`}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--gray-100)', textDecoration: 'none', color: 'inherit' }}>
                <span style={{ fontSize: 12.5 }}>
                  <strong>{b.parcela.contrato.aluno.nome}</strong> — {fmtMoeda(Number(b.parcela.valor))}
                  <br />
                  <span style={{ color: 'var(--gray-400)', fontFamily: 'monospace', fontSize: 11 }}>Nosso Nº {b.nossoNumero} · {b.contaBancaria.banco}</span>
                </span>
                <StatusBadge status={b.status} />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
