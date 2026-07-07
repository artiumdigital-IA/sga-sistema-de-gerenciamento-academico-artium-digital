'use client';
import { useRouter, usePathname } from 'next/navigation';

export interface RpanelItem {
  label: string;
  /** Rota de destino. null = tela ainda não existe na plataforma nova (item fica desabilitado). */
  href: string | null;
}

export function RpanelGroup({ title, items, open, onToggle }: {
  title: string; items: RpanelItem[]; open: boolean; onToggle: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div style={{ borderBottom: '1px solid var(--gray-200)' }}>
      <div onClick={onToggle} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 10px', cursor: 'pointer', fontSize: 11.5, fontWeight: 600,
        color: 'var(--gray-700)', userSelect: 'none',
      }}>
        <span>{title}</span>
        <span style={{ fontSize: 10, color: 'var(--gray-400)' }}>{open ? '▾' : '▸'}</span>
      </div>
      {open && (
        <div style={{ paddingBottom: 4 }}>
          {items.map(item => {
            const enabled = !!item.href;
            const isActive = enabled && pathname.startsWith(item.href!);
            return (
              <div key={item.label}
                title={enabled ? undefined : 'Ainda não disponível na plataforma nova'}
                onClick={() => enabled && router.push(item.href!)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '5px 10px 5px 20px', fontSize: 11.5,
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? 'var(--accent-blue-text)' : enabled ? 'var(--gray-500)' : 'var(--gray-300)',
                  background: isActive ? 'var(--gray-100)' : 'transparent',
                  cursor: enabled ? 'pointer' : 'default',
                }}
                onMouseEnter={e => { if (enabled && !isActive) (e.currentTarget as HTMLDivElement).style.background = 'var(--gray-100)'; }}
                onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
              >
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
                {item.label}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
