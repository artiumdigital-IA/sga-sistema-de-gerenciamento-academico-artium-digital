'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { apiLogin, saveToken } from '@/lib/auth';
import { apiFileUrl } from '@/lib/api';
import { useBranding } from '@/lib/branding';

export default function LoginPage() {
  const router = useRouter();
  const branding = useBranding();
  const logoUrl = apiFileUrl(branding.logoUrl);
  const logoBrancaUrl = apiFileUrl(branding.logoBrancaUrl);
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [totpToken, setTotpToken] = useState('');
  const [showMfa, setShowMfa] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setLoading(true);
    try {
      const token = await apiLogin({ email, senha, totpToken: showMfa ? totpToken : undefined });
      saveToken(token);
      router.push('/dashboard');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao entrar.';
      if (msg.toLowerCase().includes('mfa')) {
        setShowMfa(true);
        setErro('Informe o codigo do autenticador.');
      } else {
        setErro(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', overflow: 'hidden' }}>

      {/* Painel visual esquerdo */}
      <div style={{
        flex: '1.6', position: 'relative', overflow: 'hidden',
        background: "url('/assets/bg-login.png') center/cover no-repeat, var(--blue-dark)",
      }}>
        <div style={{ position: 'absolute', left: 48, bottom: 48, maxWidth: 480, color: '#fff', zIndex: 1 }}>
          <div style={{ marginBottom: 24 }}>
            <Image src={logoBrancaUrl || '/assets/logoBranca.png.png'} alt={branding.nomeInstituicao}
              width={120} height={40} style={{ objectFit: 'contain' }} unoptimized />
          </div>
          <h2 style={{ fontSize: 26, fontWeight: 700, lineHeight: 1.3, marginBottom: 10 }}>
            Sistema de Gerenciamento Academico
          </h2>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,.78)', lineHeight: 1.6 }}>
            Acesse sua area restrita para gerenciar matriculas, notas, frequencia e muito mais.
          </p>
        </div>
      </div>

      {/* Painel de login direito */}
      <div style={{
        flex: 1, minWidth: 380, maxWidth: 460,
        background: 'var(--white)',
        display: 'flex', flexDirection: 'column',
        padding: '40px 48px',
        borderLeft: '1px solid var(--gray-200)',
      }}>

        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 48 }}>
          <div>
            <div style={{ fontSize: 19, fontWeight: 800, color: 'var(--accent-blue-text)' }}>
              SGA <span style={{ color: 'var(--gray-400)', fontWeight: 500, margin: '0 6px' }}>|</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--gray-500)', fontWeight: 500 }}>
              Sistema de Gerenciamento Academico
            </div>
          </div>
          <Image src={logoUrl || '/assets/logoColorida.png.webp'} alt={branding.nomeInstituicao}
            width={100} height={53} style={{ objectFit: 'contain' }} unoptimized />
        </div>

        <div style={{ fontSize: 14, color: 'var(--gray-700)', marginBottom: 28 }}>
          Por favor, informe suas credenciais de acesso:
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column' }}>

          {/* E-mail */}
          <div style={{ marginBottom: 18 }}>
            <label style={labelStyle}>E-mail</label>
            <div style={{ position: 'relative' }}>
              <input type="email" placeholder="seu@email.com"
                value={email} onChange={e => setEmail(e.target.value)}
                required style={inputStyle} />
              <span style={iconStyle}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </span>
            </div>
          </div>

          {/* Senha */}
          <div style={{ marginBottom: 18 }}>
            <label style={labelStyle}>Senha</label>
            <div style={{ position: 'relative' }}>
              <input type={showPwd ? 'text' : 'password'} placeholder="..."
                value={senha} onChange={e => setSenha(e.target.value)}
                required style={inputStyle} />
              <span style={{ ...iconStyle, cursor: 'pointer' }} onClick={() => setShowPwd(v => !v)}>
                {showPwd ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </span>
            </div>
          </div>

          {/* MFA (condicional) */}
          {showMfa && (
            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle}>Codigo MFA (6 digitos)</label>
              <input type="text" inputMode="numeric" maxLength={6}
                placeholder="000000" value={totpToken}
                onChange={e => setTotpToken(e.target.value.replace(/\D/g, ''))}
                required autoFocus
                style={{ ...inputStyle, letterSpacing: 8, textAlign: 'center', fontSize: 18 }} />
              <p style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 4 }}>
                Abra o app autenticador e insira o codigo de 6 digitos.
              </p>
            </div>
          )}

          {/* Erro */}
          {erro && (
            <div style={{
              background: 'var(--red-light)', color: 'var(--red)',
              fontSize: 12, padding: '8px 12px', borderRadius: 4,
              border: '1px solid #f5c2c7', marginBottom: 16,
            }}>
              {erro}
            </div>
          )}

          {/* Lembrar */}
          <div style={{ display: 'flex', alignItems: 'center', margin: '4px 0 22px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 7,
              fontSize: 12, color: 'var(--gray-500)', cursor: 'pointer' }}>
              <input type="checkbox" style={{ width: 14, height: 14 }} />
              Lembrar meu usuario
            </label>
          </div>

          {/* Botao */}
          <button type="submit" disabled={loading} style={{
            width: '100%', height: 40, border: 'none', borderRadius: 4,
            background: loading ? 'var(--gray-300)' : 'var(--blue-dark)',
            color: '#fff', fontSize: 13, fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 18, fontSize: 11.5 }}>
          <a href="#" style={{ color: 'var(--accent-blue-text)' }}>
            Esqueceu seus dados de acesso?
          </a>
        </div>

        <div style={{ marginTop: 'auto', fontSize: 10.5, color: 'var(--gray-300)', textAlign: 'center', paddingTop: 24 }}>
          {branding.nomeInstituicao} - Sistema de Gerenciamento Academico
        </div>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 600, color: 'var(--gray-500)', display: 'block', marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: '100%', height: 38, padding: '0 36px 0 12px',
  border: '1px solid var(--gray-300)', borderRadius: 4,
  background: 'var(--white)', fontSize: 13, color: 'var(--gray-700)',
  fontFamily: 'inherit', outline: 'none',
};

const iconStyle: React.CSSProperties = {
  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
  color: 'var(--gray-400)', display: 'flex', alignItems: 'center',
};
