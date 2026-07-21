'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';

interface Folha { id: string; competenciaMes: number; competenciaAno: number; status: 'ABERTA' | 'FECHADA' | 'PAGA'; }
interface Professor { id: string; nome: string; cpf: string; }
interface Colaborador { id: string; nome: string; cpf: string; tipoVinculo: string; ativo: boolean; }
interface Lancamento { id: string; tipo: 'PROVENTO' | 'DESCONTO'; descricao: string; valor: number; }
interface ItemFolha {
  id: string; salarioBase: number; totalProventos: number; totalDescontosOutros: number;
  inss: number; irrf: number; fgts: number; salarioLiquido: number; status: string;
  professor: { professor: { id: string; nome: string; cpf: string } } | null;
  colaborador: { id: string; nome: string; cpf: string; cargo: string | null; tipoVinculo: string } | null;
  lancamentos: Lancamento[];
}
interface FolhaDetalhe extends Folha { itens: ItemFolha[]; }

const MES_LABEL = ['', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const STATUS_LABEL: Record<string, string> = { ABERTA: 'Aberta', FECHADA: 'Fechada', PAGA: 'Paga' };

const INPUT: React.CSSProperties = { padding: '7px 10px', borderRadius: 5, border: '1px solid var(--gray-300)', fontSize: 13, boxSizing: 'border-box' };
const BTN_P: React.CSSProperties = { padding: '7px 16px', borderRadius: 5, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: '#1a56db', color: '#fff' };
const BTN_G: React.CSSProperties = { padding: '6px 14px', borderRadius: 5, border: '1px solid var(--gray-300)', cursor: 'pointer', fontSize: 12.5, fontWeight: 500, background: 'var(--white)', color: 'var(--gray-700)' };
const CARD: React.CSSProperties = { background: 'var(--white)', border: '1px solid var(--gray-200)', borderRadius: 8, padding: 18 };
function fmt(v: number) { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v); }

function LancamentoModal({ folhaId, itemId, onClose, onSaved }: { folhaId: string; itemId: string; onClose: () => void; onSaved: () => void }) {
  const [tipo, setTipo] = useState<'PROVENTO' | 'DESCONTO'>('PROVENTO');
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      await apiFetch(`/cpagar/folhas/${folhaId}/itens/${itemId}/lancamentos`, { method: 'POST', body: JSON.stringify({ tipo, descricao, valor: Number(valor) }) });
      onSaved(); onClose();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Erro ao lançar');
    } finally { setSaving(false); }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: 'var(--white)', borderRadius: 10, padding: 24, width: 380, boxShadow: '0 10px 40px rgba(0,0,0,.18)' }}>
        <h2 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700 }}>Lançamento avulso</h2>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <select style={INPUT} value={tipo} onChange={e => setTipo(e.target.value as any)}>
            <option value="PROVENTO">Provento (soma)</option>
            <option value="DESCONTO">Desconto (subtrai)</option>
          </select>
          <input style={INPUT} placeholder="Descrição (ex.: Hora extra)" value={descricao} required onChange={e => setDescricao(e.target.value)} />
          <input style={INPUT} type="number" step="0.01" placeholder="Valor" value={valor} required onChange={e => setValor(e.target.value)} />
          <p style={{ margin: 0, fontSize: 11, color: 'var(--gray-500)' }}>Não recalcula INSS/IRRF automaticamente.</p>
          {error && <p style={{ color: '#dc2626', fontSize: 12.5, margin: 0 }}>{error}</p>}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" style={BTN_G} onClick={onClose}>Cancelar</button>
            <button type="submit" style={BTN_P} disabled={saving}>{saving ? 'Salvando...' : 'Lançar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function FolhaPage() {
  const [folhas, setFolhas] = useState<Folha[]>([]);
  const [folhaSelecionada, setFolhaSelecionada] = useState<FolhaDetalhe | null>(null);
  const [carregandoDetalhe, setCarregandoDetalhe] = useState(false);
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [ano, setAno] = useState(new Date().getFullYear());
  const [criando, setCriando] = useState(false);
  const [erro, setErro] = useState('');

  const [buscaPessoa, setBuscaPessoa] = useState('');
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [lancamentoModal, setLancamentoModal] = useState<string | null>(null);

  const carregarFolhas = useCallback(() => {
    apiFetch<Folha[]>('/cpagar/folhas').then(setFolhas).catch(() => {});
  }, []);
  useEffect(() => { carregarFolhas(); }, [carregarFolhas]);

  const abrirFolha = useCallback((id: string) => {
    setCarregandoDetalhe(true);
    apiFetch<FolhaDetalhe>(`/cpagar/folhas/${id}`).then(setFolhaSelecionada).catch(() => {}).finally(() => setCarregandoDetalhe(false));
  }, []);

  useEffect(() => {
    apiFetch<Professor[]>('/professores').then(setProfessores).catch(() => {});
    apiFetch<Colaborador[]>('/cpagar/colaboradores?tipoVinculo=COLABORADOR&ativo=true').then(setColaboradores).catch(() => {});
  }, []);

  async function criarFolha() {
    setErro(''); setCriando(true);
    try {
      const nova = await apiFetch<Folha>('/cpagar/folhas', { method: 'POST', body: JSON.stringify({ competenciaMes: mes, competenciaAno: ano }) });
      carregarFolhas();
      abrirFolha(nova.id);
    } catch (e: unknown) { setErro(e instanceof Error ? e.message : 'Erro ao criar folha'); }
    finally { setCriando(false); }
  }

  async function lancarPessoa(tipo: 'professor' | 'colaborador', id: string) {
    if (!folhaSelecionada) return;
    setErro('');
    try {
      const body = tipo === 'professor' ? { professorId: id } : { colaboradorId: id };
      await apiFetch(`/cpagar/folhas/${folhaSelecionada.id}/itens`, { method: 'POST', body: JSON.stringify(body) });
      abrirFolha(folhaSelecionada.id);
    } catch (e: unknown) { setErro(e instanceof Error ? e.message : 'Erro ao lançar'); }
  }

  async function fecharFolha() {
    if (!folhaSelecionada) return;
    if (!confirm('Fechar essa folha? Não será mais possível lançar novos itens.')) return;
    try {
      await apiFetch(`/cpagar/folhas/${folhaSelecionada.id}/fechar`, { method: 'PATCH' });
      carregarFolhas();
      abrirFolha(folhaSelecionada.id);
    } catch (e: unknown) { alert(e instanceof Error ? e.message : 'Erro ao fechar'); }
  }

  async function marcarPago(itemId: string) {
    if (!folhaSelecionada) return;
    try {
      await apiFetch(`/cpagar/folhas/${folhaSelecionada.id}/itens/${itemId}/pagar`, { method: 'PATCH' });
      abrirFolha(folhaSelecionada.id);
    } catch (e: unknown) { alert(e instanceof Error ? e.message : 'Erro ao marcar pago'); }
  }

  const jaLancadosProfessor = new Set(folhaSelecionada?.itens.map(i => i.professor?.professor.id).filter(Boolean));
  const jaLancadosColaborador = new Set(folhaSelecionada?.itens.map(i => i.colaborador?.id).filter(Boolean));
  const pessoasFiltradas = [
    ...professores.filter(p => p.nome.toLowerCase().includes(buscaPessoa.toLowerCase())).map(p => ({ tipo: 'professor' as const, id: p.id, nome: p.nome, jaLancado: jaLancadosProfessor.has(p.id) })),
    ...colaboradores.filter(c => c.nome.toLowerCase().includes(buscaPessoa.toLowerCase())).map(c => ({ tipo: 'colaborador' as const, id: c.id, nome: c.nome, jaLancado: jaLancadosColaborador.has(c.id) })),
  ];

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1400 }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700 }}>Folha de Pagamento</h1>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--gray-500)' }}>
          Lance professores e colaboradores por competência — INSS/IRRF/FGTS calculados automaticamente
          a partir das <Link href="/dashboard/cpagar/tabelas-imposto" style={{ color: 'var(--accent-blue-text)' }}>tabelas de imposto</Link>.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20, alignItems: 'flex-start' }}>
        <div style={CARD}>
          <h2 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700 }}>Competências</h2>
          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            <select style={{ ...INPUT, flex: 1 }} value={mes} onChange={e => setMes(Number(e.target.value))}>
              {MES_LABEL.slice(1).map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </select>
            <input style={{ ...INPUT, width: 80 }} type="number" value={ano} onChange={e => setAno(Number(e.target.value))} />
          </div>
          <button style={{ ...BTN_P, width: '100%' }} disabled={criando} onClick={criarFolha}>{criando ? 'Criando...' : '+ Nova folha'}</button>
          {erro && <p style={{ color: '#dc2626', fontSize: 12, margin: '8px 0 0' }}>{erro}</p>}

          <div style={{ marginTop: 16 }}>
            {folhas.map(f => (
              <div key={f.id} onClick={() => abrirFolha(f.id)}
                style={{ padding: '8px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 13, marginBottom: 4, background: folhaSelecionada?.id === f.id ? 'var(--gray-100)' : 'transparent' }}>
                {MES_LABEL[f.competenciaMes]}/{f.competenciaAno} <span style={{ color: 'var(--gray-400)', fontSize: 11 }}>({STATUS_LABEL[f.status]})</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          {!folhaSelecionada && <div style={CARD}><p style={{ fontSize: 13, color: 'var(--gray-500)', margin: 0 }}>Selecione ou crie uma competência.</p></div>}
          {carregandoDetalhe && <p style={{ fontSize: 13, color: 'var(--gray-500)' }}>Carregando...</p>}

          {folhaSelecionada && !carregandoDetalhe && (
            <>
              <div style={{ ...CARD, marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>
                    {MES_LABEL[folhaSelecionada.competenciaMes]}/{folhaSelecionada.competenciaAno} — {STATUS_LABEL[folhaSelecionada.status]}
                  </h2>
                  {folhaSelecionada.status === 'ABERTA' && <button style={BTN_G} onClick={fecharFolha}>Fechar folha</button>}
                </div>

                {folhaSelecionada.status === 'ABERTA' && (
                  <div style={{ marginBottom: 12 }}>
                    <input style={{ ...INPUT, width: '100%' }} placeholder="Buscar professor ou colaborador pra lançar..." value={buscaPessoa} onChange={e => setBuscaPessoa(e.target.value)} />
                    {buscaPessoa && (
                      <div style={{ border: '1px solid var(--gray-200)', borderRadius: 6, marginTop: 6, maxHeight: 160, overflowY: 'auto' }}>
                        {pessoasFiltradas.length === 0 && <div style={{ padding: 8, fontSize: 12.5, color: 'var(--gray-400)' }}>Nenhum resultado.</div>}
                        {pessoasFiltradas.map(p => (
                          <div key={`${p.tipo}-${p.id}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', borderBottom: '1px solid var(--gray-100)', fontSize: 12.5 }}>
                            <span>{p.nome} <span style={{ color: 'var(--gray-400)', fontSize: 11 }}>({p.tipo === 'professor' ? 'Professor' : 'Colaborador'})</span></span>
                            {p.jaLancado ? <span style={{ color: 'var(--gray-400)', fontSize: 11 }}>já lançado</span> :
                              <button style={{ ...BTN_G, padding: '3px 10px', fontSize: 11 }} onClick={() => lancarPessoa(p.tipo, p.id)}>Lançar</button>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--gray-200)' }}>
                      {['Nome', 'Salário base', 'INSS', 'IRRF', 'Líquido', 'Status', ''].map(h => (
                        <th key={h} style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 600, color: 'var(--gray-700)', fontSize: 11.5 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {folhaSelecionada.itens.length === 0 && (
                      <tr><td colSpan={7} style={{ padding: 16, textAlign: 'center', color: 'var(--gray-400)' }}>Nenhum item lançado ainda.</td></tr>
                    )}
                    {folhaSelecionada.itens.map(item => (
                      <tr key={item.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                        <td style={{ padding: '6px 8px' }}>{item.professor?.professor.nome ?? item.colaborador?.nome}</td>
                        <td style={{ padding: '6px 8px' }}>{fmt(Number(item.salarioBase))}</td>
                        <td style={{ padding: '6px 8px' }}>{fmt(Number(item.inss))}</td>
                        <td style={{ padding: '6px 8px' }}>{fmt(Number(item.irrf))}</td>
                        <td style={{ padding: '6px 8px', fontWeight: 600 }}>{fmt(Number(item.salarioLiquido))}</td>
                        <td style={{ padding: '6px 8px' }}>{item.status}</td>
                        <td style={{ padding: '6px 8px' }}>
                          <div style={{ display: 'flex', gap: 4 }}>
                            {folhaSelecionada.status === 'ABERTA' && (
                              <button style={{ ...BTN_G, padding: '3px 8px', fontSize: 11 }} onClick={() => setLancamentoModal(item.id)}>+ Lanç.</button>
                            )}
                            {item.status === 'PENDENTE' && (
                              <button style={{ ...BTN_G, padding: '3px 8px', fontSize: 11 }} onClick={() => marcarPago(item.id)}>Pagar</button>
                            )}
                            <Link href={`/dashboard/cpagar/folha/${item.id}/contracheque`} style={{ ...BTN_G, padding: '3px 8px', fontSize: 11, textDecoration: 'none', display: 'inline-block' }}>Holerite</Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {lancamentoModal && folhaSelecionada && (
        <LancamentoModal folhaId={folhaSelecionada.id} itemId={lancamentoModal} onClose={() => setLancamentoModal(null)} onSaved={() => abrirFolha(folhaSelecionada.id)} />
      )}
    </div>
  );
}
