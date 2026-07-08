/**
 * components/QrCode.tsx — Renderiza um QR code (usado na carteirinha do
 * estudante para linkar à página pública de validação).
 *
 * Implementado como uma simples <img> apontando pro serviço público
 * api.qrserver.com (goqr.me), em vez de uma lib npm — evita depender de um
 * pacote novo (e do respectivo package-lock.json, que não dá pra regenerar
 * neste ambiente sem acesso à internet) só pra desenhar um QR code. Como a
 * própria página já precisa de internet pra carregar (é uma tela do sistema,
 * atrás de login), isso não adiciona nenhuma dependência de rede que não
 * existisse antes.
 */
interface QrCodeProps {
  value: string;
  size?: number;
  fgColor?: string;
  bgColor?: string;
  className?: string;
}

export default function QrCode({ value, size = 96, fgColor = '#000000', bgColor = '#ffffff', className }: QrCodeProps) {
  if (!value) return null;

  const cor = fgColor.replace('#', '');
  const fundo = bgColor.replace('#', '');
  const src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=1&qzone=1&color=${cor}&bgcolor=${fundo}&data=${encodeURIComponent(value)}`;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt="QR code de validação da carteirinha"
      width={size}
      height={size}
      className={className}
      style={{ display: 'block', width: size, height: size }}
    />
  );
}
