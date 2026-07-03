'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { getToken, parseJwt, logout, type JwtUser } from '@/lib/auth';
import { apiFetch, apiFileUrl } from '@/lib/api';
import { RightPanel } from '@/components/dashboard/RightPanel';
import { RamaisModal } from '@/components/dashboard/RamaisModal';

const SIDEBAR_ITEMS = [
  { label: 'Painel',      d: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',                                                                                                                       href: '/dashboard' },
  { label: 'Cursos',      d: 'M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z',                                                                                         href: '/dashboard/academico/cursos' },
  { label: 'Matrizes',    d: 'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2',                    href: '/dashboard/academico/matrizes' },
  { label: 'Disciplinas', d: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253', href: '/dashboard/academico/disciplinas' },
  { label: 'Períodos',    d: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z',                                                                       href: '/dashboard/academico/periodos' },
  { label: 'Alunos',      d: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 8 0 4 4 0 0 0-8 0M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',                                                                                                  href: '/dashboard/academico/alunos' },
  { label: 'Professores', d: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',                                                                                        href: '/dashboard/academico/professores' },
  { label: 'Ofertas',     d: 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z',                          href: '/dashboard/academico/ofertas' },
  { label: 'Matrículas',  d: 'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m-6 9l2 2 4-4',            href: '/dashboard/academico/matriculas' },
  { label: 'Notas',       d: 'M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5m-1.414-9.414a2 2 0 1 1 2.828 2.828L11.828 15H9v-2.828l8.586-8.586z',                                   href: '/dashboard/academico/notas' },
  { label: 'Processos',   d: 'M17 20h5v-2a3 3 0 0 0-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 0 1 5.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 0 1 9.288 0M15 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0zm6 3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM7 10a2 2 0 1 1-4 0 2 2 0 0 1 4 0z',  href: '/dashboard/ingresso/processos' },
  { label: 'Candidatos',  d: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM3 20a6 6 0 0 1 12 0v1H3v-1z', href: '/dashboard/ingresso/candidatos' },
  { label: 'Requerimt.',  d: 'M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z', href: '/dashboard/secretaria/requerimentos' },
  { label: 'Documentos',  d: 'M7 21h10a2 2 0 0 0 2-2V9.414a1 1 0 0 0-.293-.707l-5.414-5.414A1 1 0 0 0 13.586 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2z', href: '/dashboard/secretaria/documentos' },
  { label: 'Contratos', d: 'M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z', href: '/dashboard/financeiro/contratos' },
  { label: 'Censo',      d: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z', href: '/dashboard/relatorios/censo' },
  { label: 'Usuários',    d: 'M12 15v2m-6 4h12a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2zm10-10V7a4 4 0 0 0-8 0v4h8z',                                                    href: '/dashboard/admin/usuarios' },
  { label: 'Avisos',      d: 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0',                                                                                                href: '/dashboard/secretaria/avisos' },
  { label: 'Bem-estar',   d: 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z',                         href: null },
];

const PERFIL_LABEL: Record<string, string> = {
  ADMIN: 'Administrador', SECRETARIA: 'Secretaria',
  FINANCEIRO: 'Financeiro', PROFESSOR: 'Professor', ALUNO: 'Aluno',
};

function SvgIcon({ d, size = 18 }: { d: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<JwtUser | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [nomeExibido, setNomeExibido] = useState<string | null>(null);
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);
  const [ramaisOpen, setRamaisOpen] = useState(false);
  const [rightTab, setRightTab] = useState<'barra' | 'msg'>('barra');
  const [unreadCount, setUnreadCount] = useState(0);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const t = getToken();
    if (t) setUser(parseJwt(t));
  }, []);

  function carregarPerfil() {
    apiFetch<{ nome: string | null; fotoUrl: string | null }>('/usuarios/me')
      .then(p => { setNomeExibido(p.nome); setFotoUrl(p.fotoUrl); })
      .catch(() => {});
  }

  // Carrega nome/foto reais do usuário (a barra superior não vem no JWT)
  useEffect(() => { carregarPerfil(); }, []);

  // Atualiza a foto/nome do topo em tempo real quando o usuário edita o
  // perfil em Minha Conta, sem precisar recarregar a página.
  useEffect(() => {
    const onPerfilAtualizado = () => carregarPerfil();
    window.addEventListener('fiurj:perfil-atualizado', onPerfilAtualizado);
    return () => window.removeEventListener('fiurj:perfil-atualizado', onPerfilAtualizado);
  }, []);

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  // Contagem de mensagens não lidas pro badge do ícone de Mensagens no TopNav —
  // independente da aba do painel direito estar aberta ou não, pra sempre avisar
  // quando chega mensagem nova. Mesmo intervalo de polling do MessagesPanel (15s).
  const carregarNaoLidas = useCallback(async () => {
    try {
      const conversas = await apiFetch<{ naoLidas: number }[]>('/mensagens/conversas');
      setUnreadCount(conversas.reduce((soma, c) => soma + c.naoLidas, 0));
    } catch { /* silencioso — nao interromper o layout por falha de rede pontual */ }
  }, []);

  useEffect(() => {
    carregarNaoLidas();
    const id = setInterval(carregarNaoLidas, 15000);
    return () => clearInterval(id);
  }, [carregarNaoLidas]);

  // Zera o badge assim que o usuário abre a aba de Mensagens (as conversas
  // individuais são marcadas como lidas ao abrir a thread; aqui só refletimos
  // isso no ícone assim que ele troca de aba).
  useEffect(() => {
    if (rightTab === 'msg') carregarNaoLidas();
  }, [rightTab, carregarNaoLidas]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  const topH = 44;
  const sideW = sidebarOpen ? 210 : 52;
  const rightW = 220;
  const botH = 38;

  const ACOES_RAPIDAS = [
    { d: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', onClick: () => router.push('/dashboard') },
    { d: 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0', onClick: () => router.push('/dashboard/secretaria/avisos') },
    { d: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z', onClick: () => setRightTab('msg'), badge: unreadCount },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden',
      background: '#fff', fontFamily: 'var(--font-body)' }}>

      {/* ── TopNav ── */}
      <div style={{
        height: topH, flexShrink: 0, background: 'var(--blue-dark)',
        display: 'flex', alignItems: 'center', padding: '0 12px',
        gap: 8, zIndex: 20,
      }}>
        {/* Logo / toggle sidebar */}
        <button
          onClick={() => setSidebarOpen(o => !o)}
          title={sidebarOpen ? 'Recolher menu' : 'Expandir menu'}
          style={{
            flexShrink: 0, width: 32, height: 32, border: 'none',
            background: 'transparent', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Image src="/logo.png" alt="FIURJ" width={28} height={28} style={{ objectFit: 'contain' }} unoptimized />
        </button>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Ações rápidas */}
        {ACOES_RAPIDAS.map(({ d, onClick, badge }, i) => (
          <button key={i} onClick={onClick} style={{
            position: 'relative', width: 30, height: 30, border: 'none', borderRadius: 4, cursor: 'pointer',
            background: 'transparent', color: 'rgba(255,255,255,.7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,.12)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
          >
            <SvgIcon d={d} size={16} />
            {!!badge && badge > 0 && (
              <span style={{
                position: 'absolute', top: 1, right: 1, minWidth: 14, height: 14, padding: '0 3px',
                borderRadius: 999, background: 'var(--red, #dc2626)', color: '#fff',
                fontSize: 9, fontWeight: 700, lineHeight: '14px', textAlign: 'center',
                boxShadow: '0 0 0 1.5px var(--blue-dark)',
              }}>
                {badge > 9 ? '9+' : badge}
              </span>
            )}
          </button>
        ))}

        {/* Fullscreen */}
        <button onClick={toggleFullscreen} title={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'} style={{
          width: 30, height: 30, border: 'none', borderRadius: 4, cursor: 'pointer',
          background: 'transparent', color: 'rgba(255,255,255,.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,.12)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
        >
          <SvgIcon d={isFullscreen
            ? 'M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3'
            : 'M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3'} size={16} />
        </button>

        {/* Avatar + logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 4 }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'rgba(255,255,255,.18)', overflow: 'hidden',
          }}>
            <Image src={apiFileUrl(fotoUrl) ?? '/assets/perfil.png'} alt="perfil" key={fotoUrl ?? 'default'}
              width={28} height={28} style={{ objectFit: 'cover' }} unoptimized />
          </div>
          <div style={{ lineHeight: 1.2 }}>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: '#fff' }}>
              {nomeExibido || user?.email?.split('@')[0] || 'Usuário'}
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,.6)' }}>
              {PERFIL_LABEL[user?.perfil ?? ''] ?? user?.perfil ?? ''}
            </div>
          </div>
          <button onClick={logout} title="Sair" style={{
            border: 'none', background: 'transparent', color: 'rgba(255,255,255,.6)',
            cursor: 'pointer', padding: 4,
          }}>
            <SvgIcon d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" size={16} />
          </button>
        </div>
      </div>

      {/* ── Corpo ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Sidebar esquerdo — expansível */}
        <div style={{
          width: sideW, flexShrink: 0, background: 'var(--blue-dark)',
          display: 'flex', flexDirection: 'column',
          transition: 'width 0.22s ease',
          overflow: 'hidden',
        }}>
          {/* Itens de navegação */}
          <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', paddingTop: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {SIDEBAR_ITEMS.map((item) => {
              const isActive = item.href
                ? (item.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(item.href))
                : false;
              return (
                <button
                  key={item.label}
                  title={sidebarOpen ? undefined : item.label}
                  onClick={() => item.href && router.push(item.href)}
                  style={{
                    width: '100%', height: 40, border: 'none',
                    borderRadius: 0,
                    cursor: item.href ? 'pointer' : 'default',
                    background: isActive ? 'var(--red)' : 'transparent',
                    color: isActive ? '#fff' : item.href ? 'rgba(255,255,255,.7)' : 'rgba(255,255,255,.3)',
                    display: 'flex', alignItems: 'center',
                    paddingLeft: 11, gap: 12,
                    whiteSpace: 'nowrap', overflow: 'hidden',
                    textAlign: 'left',
                  }}
                  onMouseEnter={e => { if (!isActive && item.href) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,.12)'; }}
                  onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = isActive ? 'var(--red)' : 'transparent'; }}
                >
                  <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 20 }}>
                    <SvgIcon d={item.d} size={18} />
                  </span>
                  {sidebarOpen && (
                    <span style={{ fontSize: 12.5, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.label}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Conteudo principal */}
        <div style={{ flex: 1, overflow: 'auto', padding: 0 }}>
          {children}
        </div>

        {/* Painel direito */}
        <RightPanel width={rightW} tab={rightTab} onTabChange={setRightTab} />
      </div>

      {/* ── BottomBar ── */}
      <div style={{
        height: botH, flexShrink: 0, background: 'var(--white)',
        borderTop: '1px solid var(--gray-200)',
        display: 'flex', alignItems: 'center', padding: '0 12px', gap: 6,
      }}>
        {[
          { label: 'Novo Aluno', href: '/dashboard/academico/alunos' },
          { label: 'Nova Turma', href: null },
          { label: 'Lançamento de Notas', href: null },
          { label: 'Relatório', href: null },
        ].map(({ label, href }) => (
          <button key={label} onClick={() => href && router.push(href)} style={{
            height: 26, padding: '0 10px', border: '1px solid var(--gray-200)',
            borderRadius: 3, background: 'transparent', cursor: href ? 'pointer' : 'default',
            fontSize: 11.5, color: 'var(--gray-600)',
          }}>
            {label}
          </button>
        ))}
        <button onClick={() => setRamaisOpen(true)} style={{
          height: 26, padding: '0 10px', border: '1px solid var(--gray-200)',
          borderRadius: 3, background: 'transparent', cursor: 'pointer',
          fontSize: 11.5, color: 'var(--gray-600)',
        }}>
          Ramais
        </button>
        <div style={{ flex: 1 }} />
        <div style={{
          height: 6, width: 140, background: 'var(--gray-200)', borderRadius: 3, overflow: 'hidden',
        }}>
          <div style={{ height: '100%', width: '62%', background: 'var(--blue-dark)', borderRadius: 3 }} />
        </div>
        <span style={{ fontSize: 10.5, color: 'var(--gray-400)' }}>62% concluido</span>
      </div>

      <RamaisModal open={ramaisOpen} onClose={() => setRamaisOpen(false)} />
    </div>
  );
}
