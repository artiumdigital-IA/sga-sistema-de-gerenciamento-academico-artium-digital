'use client';

/**
 * components/QrCode.tsx — Gera um QR code em <canvas> a partir de um texto
 * (usado na carteirinha do estudante para linkar à página pública de
 * validação). Usa a lib `qrcode` (client-side, sem dependência de servidor).
 */
import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';

interface QrCodeProps {
  value: string;
  size?: number;
  fgColor?: string;
  bgColor?: string;
  className?: string;
}

export default function QrCode({ value, size = 96, fgColor = '#000000', bgColor = '#ffffff', className }: QrCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    if (!canvasRef.current || !value) return;
    setErro(false);
    QRCode.toCanvas(canvasRef.current, value, {
      width: size,
      margin: 1,
      color: { dark: fgColor, light: bgColor },
    }).catch(() => setErro(true));
  }, [value, size, fgColor, bgColor]);

  if (!value) return null;

  return (
    <div className={className} style={{ width: size, height: size, background: bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {erro
        ? <span style={{ fontSize: 8, color: fgColor, textAlign: 'center' }}>QR indisponível</span>
        : <canvas ref={canvasRef} style={{ width: size, height: size, display: 'block' }} />}
    </div>
  );
}
