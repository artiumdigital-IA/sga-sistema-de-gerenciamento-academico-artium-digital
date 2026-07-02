'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { apiFetch, apiFileUrl } from '@/lib/api';
import { getToken, parseJwt } from '@/lib/auth';

interface Contato { id: string; nome: string | null; email: string; perfil: string; fotoUrl: string | null; }
interface MensagemDTO { id: string; remetenteId: string; destinatarioId: string; corpo: string; lida: boolean; criadoEm: string; }
interface ConversaResumo { usuario: Contato; ultimaMensagem: MensagemDTO; naoLidas: number; }
interface ConversaThread { usuario: Contato; mensagens: MensagemDTO[]; }

const PALETTE = ['#e17076', '#5e9bd6', '#6fcf97', '#9b59b6', '#f2994a', '#56ccf2', '#eb5757', '#27ae60', '#f2c94c', '#bb6bd9'];
const PERFIL_LABEL: Record<string, string> = {
  ADMIN: 'Administração', SECRETARIA: 'Secretaria Acadêmica', FINANCEIRO: 'Financeiro',
  PROFESSOR: 'Professor(a)', ALUNO: 'Aluno(a)',
};

function colorFor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}
function initialsFor(c: Contato): string {
  const base = (c.nome ?? '').trim() || c.email;
  const parts = base.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return base.slice(0, 2).toUpperCase();
}
function nomeFor(c: Contato): string { return c.nome?.trim() || c.email; }
function matches(c: Contato, q: string): boolean {
  if (!q.trim()) return true;
  const s = q.toLowerCase();
  return nomeFor(c).toLowerCase().includes(s) || c.email.toLowerCase().includes(s);
}
function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }
  const ontem = new Date(now); ontem.setDate(now.getDate() - 1);
  if (d.toDateString() === ontem.toDateString()) return 'Ontem';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function Avatar({ c, size = 34 }: { c: Contato; size?: number }) {
  const foto = apiFileUrl(c.fotoUrl);
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: colorFor(c.id), display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.32, fontWeight: 700, color: '#fff', overflow: 'hidden',
    }}>
      {foto ? <img src={foto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initialsFor(c)}
    </div>
  );
}

export function MessagesPanel() {
  const meId = useRef<string | null>(null);
  if (meId.current === null) {
    const token = getToken();
    meId.current = token ? (parseJwt(token)?.sub ?? '') : '';
  }

  const [conversas, setConversas] = useState<ConversaResumo[]>([]);
  const [loadingConversas, setLoadingConversas] = useState(true);
  const [search, setSearch] = useState('');
  const [contatos, setContatos] = useState<Contato[] | null>(null);

  const [activeUsuario, setActiveUsuario] = useState<Contato | null>(null);
  const [thread, setThread] = useState<MensagemDTO[]>([]);
  const [loadingThread, setLoadingThread] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  const carregarConversas = useCallback(async () => {
    try { setConversas(await apiFetch<ConversaResumo[]>('/mensagens/conversas')); }
    catch { /* silencioso — nao interromper o painel por falha de rede pontual */ }
    finally { setLoadingConversas(false); }
  }, []);

  useEffect(() => {
    carregarConversas();
    const id = setInterval(carregarConversas, 15000);
    return () => clearInterval(id);
  }, [carregarConversas]);

  useEffect(() => {
    if (search.trim() && contatos === null) {
      apiFetch<Contato[]>('/mensagens/contatos').then(setContatos).catch(() => setContatos([]));
    }
  }, [search, contatos]);

  async function openConv(usuario: Contato) {
    setActiveUsuario(usuario);
    setLoadingThread(true);
    setConversas(cs => cs.map(c => c.usuario.id === usuario.id ? { ...c, naoLidas: 0 } : c));
    try {
      const t = await apiFetch<ConversaThread>(`/mensagens/conversas/${usuario.id}`);
      setThread(t.mensagens);
    } catch { setThread([]); }
    finally { setLoadingThread(false); }
  }

  function fechar() {
    setActiveUsuario(null);
    setThread([]);
    carregarConversas();
  }

  async function send() {
    const corpo = input.trim();
    if (!corpo || !activeUsuario || sending) return;
    setSending(true);
    try {
      const msg = await apiFetch<MensagemDTO>(`/mensagens/conversas/${activeUsuario.id}`, {
        method: 'POST', body: JSON.stringify({ corpo }),
      });
      setThread(t => [...t, msg]);
      setInput('');
      carregarConversas();
    } catch (e: any) { alert(e.message ?? 'Erro ao enviar mensagem'); }
    finally { setSending(false); }
  }

  const conversaIds = new Set(conversas.map(c => c.usuario.id));
  const filteredConversas = conversas.filter(c => matches(c.usuario, search));
  const novosContatos = (search.trim() && contatos)
    ? contatos.filter(c => c.id !== meId.current && !conversaIds.has(c.id) && matches(c, search))
    : [];

  // ── Thread aberta ──────────────────────────────────────────────────────
  if (activeUsuario) return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 10px', borderBottom: '1px solid var(--gray-200)' }}>
        <button onClick={fechar}
          style={{ border: 'none', background: 'none', color: 'var(--gray-400)', cursor: 'pointer', fontSize: 16 }}>
          &lsaquo;
        </button>
        <Avatar c={activeUsuario} size={28} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-700)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {nomeFor(activeUsuario)}
          </div>
          <div style={{ fontSize: 10, color: 'var(--gray-400)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {PERFIL_LABEL[activeUsuario.perfil] ?? activeUsuario.perfil}
          </div>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 8px',
        display: 'flex', flexDirection: 'column', gap: 6, background: 'var(--gray-50)' }}>
        {loadingThread && <p style={{ fontSize: 11, color: 'var(--gray-400)', textAlign: 'center' }}>Carregando...</p>}
        {!loadingThread && thread.length === 0 && (
          <p style={{ fontSize: 11, color: 'var(--gray-400)', textAlign: 'center', marginTop: 20 }}>
            Nenhuma mensagem ainda. Diga oi!
          </p>
        )}
        {thread.map(m => {
          const mine = m.remetenteId === meId.current;
          return (
            <div key={m.id} style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '78%', padding: '6px 10px', fontSize: 11.5, color: 'var(--gray-700)',
                background: mine ? '#dcf8c6' : 'var(--white)',
                borderRadius: mine ? '10px 10px 0 10px' : '10px 10px 10px 0',
                boxShadow: '0 1px 2px rgba(0,0,0,.08)', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              }}>
                {m.corpo}
                <span style={{ display: 'block', fontSize: 9, color: 'var(--gray-400)', textAlign: 'right', marginTop: 2 }}>
                  {formatTime(m.criadoEm)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 6, padding: '8px',
        borderTop: '1px solid var(--gray-200)', background: 'var(--white)' }}>
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Digite uma mensagem" disabled={sending}
          style={{ flex: 1, height: 32, padding: '0 10px', border: '1px solid var(--gray-300)',
            borderRadius: 16, fontSize: 12, background: 'var(--white)', color: 'var(--gray-700)', outline: 'none' }} />
        <button onClick={send} disabled={sending || !input.trim()} style={{ width: 32, height: 32, border: 'none', borderRadius: '50%',
          background: 'var(--blue-dark)', color: '#fff', cursor: sending ? 'default' : 'pointer', flexShrink: 0,
          opacity: sending || !input.trim() ? 0.5 : 1,
          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          &rsaquo;
        </button>
      </div>
    </div>
  );

  // ── Lista de conversas ─────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '8px 10px 0', borderBottom: '1px solid var(--gray-200)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-700)' }}>Mensagens</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6,
          background: 'var(--gray-100)', borderRadius: 4, padding: '5px 8px', marginBottom: 8 }}>
          <input placeholder="Pesquisar conversa" value={search} onChange={e => setSearch(e.target.value)}
            style={{ border: 'none', background: 'none', fontSize: 11.5,
              color: 'var(--gray-700)', outline: 'none', width: '100%' }} />
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loadingConversas && <p style={{ fontSize: 11, color: 'var(--gray-400)', textAlign: 'center', marginTop: 16 }}>Carregando...</p>}

        {!loadingConversas && filteredConversas.length === 0 && novosContatos.length === 0 && (
          <p style={{ fontSize: 11, color: 'var(--gray-400)', textAlign: 'center', marginTop: 16, padding: '0 12px' }}>
            {search.trim() ? 'Nenhum resultado.' : 'Nenhuma conversa ainda. Pesquise um nome pra começar.'}
          </p>
        )}

        {filteredConversas.map(c => (
          <div key={c.usuario.id} onClick={() => openConv(c.usuario)}
            style={{ display: 'flex', gap: 8, padding: '10px', cursor: 'pointer',
              borderBottom: '1px solid var(--gray-100)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'var(--gray-50)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
          >
            <Avatar c={c.usuario} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-700)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nomeFor(c.usuario)}</span>
                <span style={{ fontSize: 10, color: 'var(--gray-400)', flexShrink: 0 }}>{formatTime(c.ultimaMensagem.criadoEm)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                <span style={{ fontSize: 11, color: 'var(--gray-400)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>
                  {c.ultimaMensagem.remetenteId === meId.current ? 'Você: ' : ''}{c.ultimaMensagem.corpo}
                </span>
                {c.naoLidas > 0 && (
                  <span style={{ background: '#25d366', color: '#fff', fontSize: 10, fontWeight: 700,
                    borderRadius: '50%', width: 16, height: 16, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {c.naoLidas}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}

        {novosContatos.length > 0 && (
          <>
            <div style={{ padding: '8px 10px 4px', fontSize: 10, fontWeight: 600, color: 'var(--gray-400)', textTransform: 'uppercase' }}>
              Iniciar conversa
            </div>
            {novosContatos.map(c => (
              <div key={c.id} onClick={() => openConv(c)}
                style={{ display: 'flex', gap: 8, padding: '10px', cursor: 'pointer',
                  borderBottom: '1px solid var(--gray-100)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'var(--gray-50)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
              >
                <Avatar c={c} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-700)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nomeFor(c)}</div>
                  <div style={{ fontSize: 10, color: 'var(--gray-400)' }}>{PERFIL_LABEL[c.perfil] ?? c.perfil}</div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
