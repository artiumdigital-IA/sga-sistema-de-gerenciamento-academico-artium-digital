'use client';

import { useEffect } from 'react';
import { fetchBranding, applyBranding, getCachedBranding, BRANDING_UPDATED_EVENT } from '@/lib/branding';

/**
 * Monta uma vez no layout raiz (fora do /dashboard, então cobre também a
 * tela de login). Busca a configuração visual real assim que a página
 * carrega e aplica as cores/nome/favicon — o script inline em layout.tsx já
 * aplicou a versão em cache antes da primeira pintura, então aqui é só
 * "atualizar se mudou" sem gerar flash visível.
 */
export default function BrandingProvider() {
  useEffect(() => {
    let ativo = true;

    async function carregar() {
      try {
        const config = await fetchBranding();
        if (ativo) applyBranding(config);
      } catch {
        // API fora do ar / sem rede — mantém o que já está aplicado (cache ou padrão)
        const cache = getCachedBranding();
        if (ativo && cache) applyBranding(cache);
      }
    }

    carregar();
    window.addEventListener(BRANDING_UPDATED_EVENT, carregar);
    return () => {
      ativo = false;
      window.removeEventListener(BRANDING_UPDATED_EVENT, carregar);
    };
  }, []);

  return null;
}
