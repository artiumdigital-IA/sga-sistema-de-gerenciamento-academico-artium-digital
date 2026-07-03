import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import BrandingProvider from '@/components/BrandingProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Plataforma Acadêmica',
  description: 'Sistema de gestão acadêmica',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
};

// Injeta o tema ANTES da pintura inicial, evitando flash
const themeScript = `(function(){try{if((localStorage.getItem('fiurj_theme')||'light')==='dark'){document.documentElement.classList.add('dark-theme');}}catch(e){}})();`;

// Injeta a marca (nome/cores/favicon) em cache ANTES da pintura inicial,
// mesma estratégia do tema — evita flash das cores/nome da instituição
// antiga trocando pra nova. O <BrandingProvider> (montado no body) busca a
// versão real via GET /branding logo em seguida e reaplica se tiver mudado,
// além de atualizar esse cache pra próxima carga.
const brandingScript = `(function(){
  try {
    var raw = localStorage.getItem('fiurj_branding_cache');
    if (!raw) return;
    var c = JSON.parse(raw);
    var root = document.documentElement.style;
    function shade(hex, percent) {
      var clean = String(hex).replace('#','');
      if (!/^[0-9a-fA-F]{6}$/.test(clean)) return hex;
      var num = parseInt(clean, 16);
      var r = (num >> 16) & 0xff, g = (num >> 8) & 0xff, b = num & 0xff;
      var mix = percent >= 0 ? 255 : 0;
      var amount = Math.abs(percent);
      r = Math.round(r + (mix - r) * amount);
      g = Math.round(g + (mix - g) * amount);
      b = Math.round(b + (mix - b) * amount);
      function h(v){ v = Math.min(255, Math.max(0, v)).toString(16); return v.length === 1 ? '0' + v : v; }
      return '#' + h(r) + h(g) + h(b);
    }
    if (c.corPrimaria) {
      root.setProperty('--blue-dark', c.corPrimaria);
      root.setProperty('--blue-mid', shade(c.corPrimaria, 0.15));
      root.setProperty('--blue-light', shade(c.corPrimaria, 0.3));
      root.setProperty('--accent-blue-text', c.corPrimaria);
    }
    if (c.corSecundaria) {
      root.setProperty('--red', c.corSecundaria);
      root.setProperty('--red-light', shade(c.corSecundaria, 0.85));
      root.setProperty('--accent-red-text', c.corSecundaria);
    }
    if (c.nomeInstituicao) document.title = c.nomeInstituicao + ' — Plataforma Acadêmica';
  } catch (e) {}
})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script dangerouslySetInnerHTML={{ __html: brandingScript }} />
      </head>
      <body className={inter.className}>
        <BrandingProvider />
        {children}
      </body>
    </html>
  );
}
