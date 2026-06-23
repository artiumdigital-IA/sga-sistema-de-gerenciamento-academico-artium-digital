'use client';
import { useState } from 'react';

interface Msg { from: string; text: string; time: string; }
interface Conv {
  id: string; name: string; sub: string;
  initials: string; color: string; time: string;
  unread: number; messages: Msg[];
}

const CONVERSATIONS: Conv[] = [
  { id: 'maria', name: 'Maria Clara Souza', sub: 'Mae de Joao Pedro (9 Ano B)',
    initials: 'MC', color: '#e17076', time: '09:42', unread: 2, messages: [
    { from: 'them', text: 'Bom dia! Gostaria de confirmar a reuniao de pais.', time: '09:15' },
    { from: 'me',   text: 'Bom dia! A reuniao e as 18h na sala 12.', time: '09:20' },
    { from: 'them', text: 'O Joao Pedro precisa levar algum material?', time: '09:42' },
  ]},
  { id: 'secretaria', name: 'Secretaria Academica', sub: 'Atendimento geral',
    initials: 'SA', color: '#5e9bd6', time: '08:30', unread: 0, messages: [
    { from: 'them', text: 'O historico escolar esta disponivel para retirada.', time: '08:12' },
    { from: 'me',   text: 'Obrigado, vou buscar ainda hoje.', time: '08:30' },
  ]},
  { id: 'ricardo', name: 'Prof. Ricardo Alves', sub: 'Matematica - 9 Ano B',
    initials: 'RA', color: '#6fcf97', time: 'Ontem', unread: 0, messages: [
    { from: 'them', text: 'Poderia revisar as notas do ultimo teste?', time: '17:05' },
    { from: 'me',   text: 'Claro, vou verificar e retorno hoje.', time: '17:30' },
  ]},
  { id: 'coordenacao', name: 'Coordenacao Pedagogica', sub: 'Ana Beatriz - Coordenadora',
    initials: 'CP', color: '#9b59b6', time: 'Ontem', unread: 1, messages: [
    { from: 'them', text: 'Precisamos remarcar o Conselho de Classe.', time: '14:50' },
  ]},
];

export function MessagesPanel() {
  const [convs, setConvs] = useState<Conv[]>(CONVERSATIONS);
  const [active, setActive] = useState<Conv | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState('');

  function openConv(c: Conv) {
    setMsgs(c.messages);
    setActive(c);
    setConvs(cs => cs.map(x => x.id === c.id ? { ...x, unread: 0 } : x));
  }

  function send() {
    if (!input.trim()) return;
    const now = new Date();
    const t = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    setMsgs(ms => [...ms, { from: 'me', text: input.trim(), time: t }]);
    setInput('');
  }

  if (active) return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 10px', borderBottom: '1px solid var(--gray-200)' }}>
        <button onClick={() => setActive(null)}
          style={{ border: 'none', background: 'none', color: 'var(--gray-400)', cursor: 'pointer' }}>
          &lsaquo;
        </button>
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: active.color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 10, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
          {active.initials}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-700)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {active.name}
          </div>
          <div style={{ fontSize: 10, color: 'var(--gray-400)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {active.sub}
          </div>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 8px',
        display: 'flex', flexDirection: 'column', gap: 6, background: 'var(--gray-50)' }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.from === 'me' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '78%', padding: '6px 10px', fontSize: 11.5, color: 'var(--gray-700)',
              background: m.from === 'me' ? '#dcf8c6' : 'var(--white)',
              borderRadius: m.from === 'me' ? '10px 10px 0 10px' : '10px 10px 10px 0',
              boxShadow: '0 1px 2px rgba(0,0,0,.08)',
            }}>
              {m.text}
              <span style={{ display: 'block', fontSize: 9, color: 'var(--gray-400)', textAlign: 'right', marginTop: 2 }}>
                {m.time}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6, padding: '8px',
        borderTop: '1px solid var(--gray-200)', background: 'var(--white)' }}>
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="Digite uma mensagem"
          style={{ flex: 1, height: 32, padding: '0 10px', border: '1px solid var(--gray-300)',
            borderRadius: 16, fontSize: 12, background: 'var(--white)', color: 'var(--gray-700)', outline: 'none' }} />
        <button onClick={send} style={{ width: 32, height: 32, border: 'none', borderRadius: '50%',
          background: 'var(--blue-dark)', color: '#fff', cursor: 'pointer', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          &rsaquo;
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '8px 10px 0', borderBottom: '1px solid var(--gray-200)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-700)' }}>Mensagens</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6,
          background: 'var(--gray-100)', borderRadius: 4, padding: '5px 8px', marginBottom: 8 }}>
          <input placeholder="Pesquisar conversa"
            style={{ border: 'none', background: 'none', fontSize: 11.5,
              color: 'var(--gray-700)', outline: 'none', width: '100%' }} />
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {convs.map(c => (
          <div key={c.id} onClick={() => openConv(c)}
            style={{ display: 'flex', gap: 8, padding: '10px', cursor: 'pointer',
              borderBottom: '1px solid var(--gray-100)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'var(--gray-50)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
          >
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: c.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
              {c.initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-700)' }}>{c.name}</span>
                <span style={{ fontSize: 10, color: 'var(--gray-400)', flexShrink: 0 }}>{c.time}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                <span style={{ fontSize: 11, color: 'var(--gray-400)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>
                  {c.messages[c.messages.length - 1]?.text}
                </span>
                {c.unread > 0 && (
                  <span style={{ background: '#25d366', color: '#fff', fontSize: 10, fontWeight: 700,
                    borderRadius: '50%', width: 16, height: 16, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {c.unread}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
