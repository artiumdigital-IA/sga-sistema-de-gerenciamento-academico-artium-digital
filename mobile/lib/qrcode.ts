/**
 * lib/qrcode.ts — monta a URL de um QR code (usado na carteirinha, pra
 * linkar à página pública de validação). Mesma estratégia do componente
 * web (frontend/components/QrCode.tsx): um <Image> apontando pro serviço
 * público api.qrserver.com, em vez de uma lib nativa nova — evita puxar
 * mais uma dependência nativa só pra isso (mesmo critério já documentado
 * no CLAUDE.md sobre versão de lib nativa e Expo Go), e a tela já precisa
 * de internet pra carregar o resto dos dados mesmo.
 */
export function qrCodeUrl(value: string, size = 96): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=1&qzone=1&color=000000&bgcolor=ffffff&data=${encodeURIComponent(value)}`;
}
