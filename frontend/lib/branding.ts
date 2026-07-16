/**
 * lib/branding.ts — Configuração visual da instituição (nome, logo, símbolo,
 * cores primária/secundária), buscada de GET /branding (endpoint público —
 * funciona até na tela de login, antes de autenticar).
 *
 * A ideia é permitir reaproveitar esta plataforma pra outra instituição só
 * trocando esses valores pela tela de admin, sem tocar em código (ver
 * ConfiguracaoVisual no backend). A arquitetura continua single-tenant: uma
 * instituição = um deploy inteiro, com sua própria config visual.
 */
import { useState, useEffect } from 'react';
import { apiFetch, apiFileUrl } from './api';

/** Uma imagem da galeria de publicidade exibida no /dashboard do perfil
 * ALUNO (ver ConfiguracaoVisual.galeriaPublicidade no backend). Gerenciada
 * em /dashboard/admin/visual. */
export interface ImagemGaleria {
  id: string;
  url: string;
  ordem: number;
  ativa: boolean;
  link: string | null;
  criadoEm: string;
}

export interface BrandingConfig {
  id: string;
  nomeInstituicao: string;
  nomeCompleto: string;
  logoUrl: string | null;
  logoBrancaUrl: string | null;
  simboloUrl: string | null;
  corPrimaria: string;
  corSecundaria: string;
  galeriaPublicidade: ImagemGaleria[];
}

export const BRANDING_CACHE_KEY = 'fiurj_branding_cache';
export const BRANDING_UPDATED_EVENT = 'fiurj:branding-atualizada';

export const BRANDING_PADRAO: BrandingConfig = {
  id: 'default',
  nomeInstituicao: 'FIURJ',
  nomeCompleto: 'FIURJ — Faculdade Instituto Universitário do Rio de Janeiro',
  logoUrl: null,
  logoBrancaUrl: null,
  simboloUrl: null,
  corPrimaria: '#1C3A6B',
  corSecundaria: '#C8102E',
  galeriaPublicidade: [],
};

export function getCachedBranding(): BrandingConfig | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(BRANDING_CACHE_KEY);
    return raw ? (JSON.parse(raw) as BrandingConfig) : null;
  } catch {
    return null;
  }
}

/** Busca a config real na API e atualiza o cache local (usado pelo script de
 * pre-pintura na próxima carga, pra evitar flash do nome/cor antigos). */
export async function fetchBranding(): Promise<BrandingConfig> {
  const config = await apiFetch<BrandingConfig>('/branding');
  try {
    localStorage.setItem(BRANDING_CACHE_KEY, JSON.stringify(config));
  } catch {
    // localStorage indisponível (modo privado etc.) — sem cache, sem flash-prevention,
    // mas a aplicação da marca em si continua funcionando normalmente
  }
  return config;
}

/** Clareia (percent > 0) ou escurece (percent < 0) uma cor hex, misturando
 * com branco/preto — usado pra derivar as variações (--blue-mid/--blue-light
 * etc.) a partir das duas cores que o admin configura. Aproximação simples,
 * não é um color-space perceptual de verdade, mas é suficiente pro caso de
 * uso (variações de tonalidade de UI, não design gráfico de precisão). */
function shade(hex: string, percent: number): string {
  const clean = hex.replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) return hex;
  const num = parseInt(clean, 16);
  let r = (num >> 16) & 0xff;
  let g = (num >> 8) & 0xff;
  let b = num & 0xff;
  const mix = percent >= 0 ? 255 : 0;
  const amount = Math.abs(percent);
  r = Math.round(r + (mix - r) * amount);
  g = Math.round(g + (mix - g) * amount);
  b = Math.round(b + (mix - b) * amount);
  const hex2 = (v: number) => Math.min(255, Math.max(0, v)).toString(16).padStart(2, '0');
  return `#${hex2(r)}${hex2(g)}${hex2(b)}`;
}

/** Aplica a config visual no documento atual: variáveis CSS de cor
 * (blue-dark, red, accent-blue-text etc, ver globals.css), título da aba e
 * favicon. Chamada tanto pelo script inline de pre-pintura (lendo do cache)
 * quanto pelo BrandingProvider depois de buscar a config real da API. */
export function applyBranding(config: BrandingConfig) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement.style;
  const primaria = config.corPrimaria || BRANDING_PADRAO.corPrimaria;
  const secundaria = config.corSecundaria || BRANDING_PADRAO.corSecundaria;

  root.setProperty('--blue-dark', primaria);
  root.setProperty('--blue-mid', shade(primaria, 0.15));
  root.setProperty('--blue-light', shade(primaria, 0.3));
  root.setProperty('--accent-blue-text', primaria);

  root.setProperty('--red', secundaria);
  root.setProperty('--red-light', shade(secundaria, 0.85));
  root.setProperty('--accent-red-text', secundaria);

  if (config.nomeInstituicao) {
    document.title = `${config.nomeInstituicao} — Plataforma Acadêmica`;
  }

  const simboloUrl = apiFileUrl(config.simboloUrl);
  if (simboloUrl) {
    let link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = simboloUrl;
  }
}

/** Dispara depois de salvar a config na tela de admin — o BrandingProvider
 * escuta esse evento e reaplica sem precisar de reload (mesmo padrão já
 * usado pro evento fiurj:perfil-atualizado). */
export function notificarBrandingAtualizada() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(BRANDING_UPDATED_EVENT));
  }
}

/** Hook pra qualquer componente cliente que precise exibir nome/logo/símbolo
 * dinâmicos (login, TopNav, documentos imprimíveis etc). Começa com o valor
 * em cache (ou o padrão FIURJ, se não houver cache ainda) pra não piscar, e
 * atualiza assim que a config real chega da API — inclusive reagindo se o
 * admin salvar uma mudança na tela de Identidade Visual enquanto a página
 * estiver aberta. */
export function useBranding(): BrandingConfig {
  const [config, setConfig] = useState<BrandingConfig>(() => getCachedBranding() ?? BRANDING_PADRAO);

  useEffect(() => {
    let ativo = true;
    function carregar() {
      fetchBranding()
        .then(c => { if (ativo) setConfig(c); })
        .catch(() => { /* mantém o valor em cache/padrão se a API falhar */ });
    }
    carregar();
    window.addEventListener(BRANDING_UPDATED_EVENT, carregar);
    return () => {
      ativo = false;
      window.removeEventListener(BRANDING_UPDATED_EVENT, carregar);
    };
  }, []);

  return config;
}
