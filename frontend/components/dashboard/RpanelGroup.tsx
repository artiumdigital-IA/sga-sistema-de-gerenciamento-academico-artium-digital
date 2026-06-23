'use client';
import { useState } from 'react';

export function RpanelGroup({ title, items }: { title: string; items: string[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: '1px solid var(--gray-200)' }}>
      <div onClick={() => setOpen(o => !o)} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 10px', cursor: 'pointer', fontSize: 11.5, fontWeight: 600,
        color: 'var(--gray-700)', userSelect: 'none',
      }}>
        <span>{title}</span>
        <span style={{ fontSize: 10, color: 'var(--gray-400)' }}>{open ? '▾' : '▸'}</span>
      </div>
      {open && (
        <div style={{ paddingBottom: 4 }}>
          {items.map(item => (
            <div key={item} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '5px 10px 5px 20px', fontSize: 11.5,
              color: 'var(--gray-500)', cursor: 'pointer',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'var(--gray-100)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
            >
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
              {item}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
