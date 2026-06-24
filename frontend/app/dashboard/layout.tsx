'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { getToken, parseJwt, logout, type JwtUser } from '@/lib/auth';
import { RightPanel } from '@/components/dashboard/RightPanel';

const SIDEBAR_ITEMS = [
  { label: 'Painel',      d: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',                                                                                                                       href: '/dashboard' },
  { label: 'Cursos',      d: 'M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z',                                                                                         href: '/dashboard/academico/cursos' },
  { label: 'Matrizes',    d: 'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2',                    href: '/dashboard/academico/matrizes' },
  { label: 'Disciplinas', d: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253', href: '/dashboard/academico/disciplinas' },
  { label: 'Períodos',    d: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z',                                                                       href: '/dashboard/academico/periodos' },
  { label: 'Alunos',      d: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M23 21v-2a4 4 0 0 0-3-3.87',                                                                                                  href: '/dashboard/academico/alunos' },
  { label: 'Professores', d: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',                                                                                        href: '/dashboard/academico/professores' },
  { label: 'Ofertas',     d: 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z',                          href: '/dashboard/academico/ofertas' },
  { label: 'Matrículas',  d: 'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m-6 9l2 2 4-4',            href: '/dashboard/academico/matriculas' },
  { label: 'Avisos',      d: 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0',                                                                                                href: null },
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
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const t = getToken();
    if (t) setUser(parseJwt(t));
  }, []);

  const topH = 44;
  const sideW = 52;
  const rightW = 220;
  const botH = 38;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden',
      background: 'var(--gray-50)', fontFamily: 'var(--font-body)' }}>

      {/* ── TopNav ── */}
      <div style={{
        height: topH, flexShrink: 0, background: 'var(--blue-dark)',
        display: 'flex', alignItems: 'center', padding: '0 12px',
        gap: 8, zIndex: 20,
      }}>
        <Image src="/assets/logoBranca.png.png" alt="FIURJ"
          width={80} height={28} style={{ objectFit: 'contain', marginRight: 8 }} unoptimized />

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Ações rápidas */}
        {[
          'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
          'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0',
          'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
        ].map((d, i) => (
          <button key={i} style={{
            width: 30, height: 30, border: 'none', borderRadius: 4, cursor: 'pointer',
            background: 'transparent', color: 'rgba(255,255,255,.7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,.12)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
          >
            <SvgIcon d={d} size={16} />
          </button>
        ))}

        {/* Avatar + logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 4 }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'rgba(255,255,255,.18)', overflow: 'hidden',
          }}>
            <Image src="/assets/perfil.png" alt="perfil"
              width={28} height={28} style={{ objectFit: 'cover' }} unoptimized />
          </div>
          <div style={{ lineHeight: 1.2 }}>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: '#fff' }}>
              {user?.email?.split('@')[0] ?? 'Usuário'}
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

        {/* Sidebar esquerdo */}
        <div style={{
          width: sideW, flexShrink: 0, background: 'var(--blue-dark)',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          paddingTop: 6, gap: 2, overflowY: 'auto',
        }}>
          {SIDEBAR_ITEMS.map((item) => {
            const isActive = item.href
              ? (item.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(item.href))
              : false;
            return (
              <button
                key={item.label}
                title={item.label}
                onClick={() => item.href && router.push(item.href)}
                style={{
                  width: 40, height: 40, border: 'none', borderRadius: 6,
                  cursor: item.href ? 'pointer' : 'default',
                  background: isActive ? 'var(--red)' : 'transparent',
                  color: isActive ? '#fff' : item.href ? 'rgba(255,255,255,.65)' : 'rgba(255,255,255,.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
                onMouseEnter={e => { if (!isActive && item.href) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,.12)'; }}
                onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
              >
                <SvgIcon d={item.d} size={18} />
              </button>
            );
          })}
        </div>

        {/* Conteudo principal */}
        <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
          {children}
        </div>

        {/* Painel direito */}
        <RightPanel width={rightW} />
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
        <div style={{ flex: 1 }} />
        <div style={{
          height: 6, width: 140, background: 'var(--gray-200)', borderRadius: 3, overflow: 'hidden',
        }}>
          <div style={{ height: '100%', width: '62%', background: 'var(--blue-dark)', borderRadius: 3 }} />
        </div>
        <span style={{ fontSize: 10.5, color: 'var(--gray-400)' }}>62% concluido</span>
      </div>
    </div>
  );
}
