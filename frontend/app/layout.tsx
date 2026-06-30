import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'FIURJ — Plataforma Acadêmica',
  description: 'Sistema de gestão acadêmica da Faculdade Instituto Rio de Janeiro',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
};

// Injeta o tema ANTES da pintura inicial, evitando flash
const themeScript = `(function(){try{if((localStorage.getItem('fiurj_theme')||'light')==='dark'){document.documentElement.classList.add('dark-theme');}}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
