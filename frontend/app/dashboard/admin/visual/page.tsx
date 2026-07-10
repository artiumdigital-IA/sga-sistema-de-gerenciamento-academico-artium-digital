'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { apiFetch, apiUpload, apiFileUrl } from '@/lib/api';
import { getToken, parseJwt } from '@/lib/auth';
import { notificarBrandingAtualizada, BRANDING_PADRAO, type BrandingConfig, type ImagemGaleria } from '@/lib/branding';

const INPUT: React.CSSProperties = { width: '100%', padding: '7px 10px', borderRadius: 5, border: '1px solid var(--gray-300)', fontSize: 13, boxSizing: 'border-box' };
const LABEL: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--gray-700)', marginBottom: 6 };
const BTN = (v: 'primary' | 'ghost') => ({
  padding: '7px 16px', borderRadius: 5, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
  background: v === 'primary' ? '#1a56db' : 'transparent',
  color: v === 'ghost' ? 'var(--gray-700)' : '#fff',
  ...(v === 'ghost' ? { border: '1px solid var(--gray-300)' } : {}),
});

export default function VisualPage() {
  const token = getToken();
  const isAdmin = token ? parseJwt(token)?.perfil === 'ADMIN' : false;

  const [config, setConfig] = useState<BrandingConfig>(BRANDING_PADRAO);
  const [form, setForm] = useState({
    nomeInstituicao: BRANDING_PADRAO.nomeInstituicao,
    nomeCompleto: BRANDING_PADRAO.nomeCompleto,
    corPrimaria: BRANDING_PADRAO.corPrimaria,
    corSecundaria: BRANDING_PADRAO.corSecundaria,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingSimbolo, setUploadingSimbolo] = useState(false);
  const [uploadingGaleria, setUploadingGaleria] = useState(false);
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const simboloInputRef = useRef<HTMLInputElement>(null);
  const galeriaInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const c = await apiFetch<BrandingConfig>('/branding');
      setConfig(c);
      setForm({
        nomeInstituicao: c.nomeInstituicao,
        nomeCompleto: c.nomeCompleto,
        corPrimaria: c.corPrimaria,
        corSecundaria: c.corSecundaria,
      });
    } catch (err: unknown) {
      setMsg({ tipo: 'erro', texto: err instanceof Error ? err.message : 'Erro ao carregar configuração visual.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function salvar() {
    setSaving(true); setMsg(null);
    try {
      const atualizado = await apiFetch<BrandingConfig>('/branding', { method: 'PUT', body: JSON.stringify(form) });
      setConfig(atualizado);
      notificarBrandingAtualizada();
      setMsg({ tipo: 'ok', texto: 'Configuração salva — aplicada em toda a plataforma.' });
    } catch (err: unknown) {
      setMsg({ tipo: 'erro', texto: err instanceof Error ? err.message : 'Erro ao salvar.' });
    } finally {
      setSaving(false);
    }
  }

  async function enviarArquivo(campo: 'logo' | 'simbolo', file: File) {
    const setUploading = campo === 'logo' ? setUploadingLogo : setUploadingSimbolo;
    setUploading(true); setMsg(null);
    try {
      const fd = new FormData();
      fd.append('arquivo', file);
      const atualizado = await apiUpload<BrandingConfig>(`/branding/${campo}`, fd);
      setConfig(atualizado);
      notificarBrandingAtualizada();
      setMsg({ tipo: 'ok', texto: campo === 'logo' ? 'Logo atualizada.' : 'Símbolo atualizado.' });
    } catch (err: unknown) {
      setMsg({ tipo: 'erro', texto: err instanceof Error ? err.message : 'Erro ao enviar arquivo.' });
    } finally {
      setUploading(false);
    }
  }

  // ── Galeria de Publicidade (imagens do /dashboard do aluno) ────────────
  const galeria = [...config.galeriaPublicidade].sort((a, b) => a.ordem - b.ordem);

  async function enviarImagemGaleria(file: File) {
    setUploadingGaleria(true); setMsg(null);
    try {
      const fd = new FormData();
      fd.append('arquivo', file);
      const lista = await apiUpload<ImagemGaleria[]>('/branding/galeria', fd);
      setConfig(c => ({ ...c, galeriaPublicidade: lista }));
      notificarBrandingAtualizada();
      setMsg({ tipo: 'ok', texto: 'Imagem adicionada à galeria.' });
    } catch (err: unknown) {
      setMsg({ tipo: 'erro', texto: err instanceof Error ? err.message : 'Erro ao enviar imagem.' });
    } finally {
      setUploadingGaleria(false);
    }
  }

  async function atualizarImagemGaleria(id: string, dto: { ativa?: boolean; ordem?: number; link?: string | null }) {
    try {
      const lista = await apiFetch<ImagemGaleria[]>(`/branding/galeria/${id}`, { method: 'PATCH', body: JSON.stringify(dto) });
      setConfig(c => ({ ...c, galeriaPublicidade: lista }));
      notificarBrandingAtualizada();
    } catch (err: unknown) {
      setMsg({ tipo: 'erro', texto: err instanceof Error ? err.message : 'Erro ao atualizar imagem.' });
    }
  }

  async function removerImagemGaleria(id: string) {
    try {
      const lista = await apiFetch<ImagemGaleria[]>(`/branding/galeria/${id}`, { method: 'DELETE' });
      setConfig(c => ({ ...c, galeriaPublicidade: lista }));
      notificarBrandingAtualizada();
      setMsg({ tipo: 'ok', texto: 'Imagem removida.' });
    } catch (err: unknown) {
      setMsg({ tipo: 'erro', texto: err instanceof Error ? err.message : 'Erro ao remover imagem.' });
    }
  }

  if (!isAdmin) {
    return (
      <div style={{ padding: 28 }}>
        <p style={{ color: '#e02424', fontSize: 14 }}>Acesso restrito ao administrador.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: 28 }}>
        <p style={{ color: 'var(--gray-500)', fontSize: 14 }}>Carregando...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 28px', maxWidth: 760 }}>
      <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Identidade Visual</h1>
      <p style={{ margin: '2px 0 20px', fontSize: 13, color: 'var(--gray-500)' }}>
        Nome, logo, símbolo e cores da instituição — aplicados em toda a plataforma (login, menu, documentos impressos).
      </p>

      {msg && (
        <div style={{
          padding: '8px 12px', borderRadius: 5, fontSize: 13, marginBottom: 16,
          background: msg.tipo === 'ok' ? '#d1fae5' : '#fee2e2',
          color: msg.tipo === 'ok' ? '#065f46' : '#991b1b',
        }}>
          {msg.texto}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div style={{ background: 'var(--white)', border: '1px solid var(--gray-200)', borderRadius: 8, padding: 16 }}>
          <div style={LABEL}>Logo (login, menu, documentos)</div>
          <div style={{
            height: 90, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--gray-50)', border: '1px dashed var(--gray-300)', borderRadius: 6, marginBottom: 10,
          }}>
            {config.logoUrl
              ? <img src={apiFileUrl(config.logoUrl) ?? ''} alt="Logo" style={{ maxHeight: 70, maxWidth: '90%', objectFit: 'contain' }} />
              : <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>Nenhuma logo enviada</span>}
          </div>
          <input
            ref={logoInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) enviarArquivo('logo', f); e.target.value = ''; }}
          />
          <button style={BTN('ghost')} disabled={uploadingLogo} onClick={() => logoInputRef.current?.click()}>
            {uploadingLogo ? 'Enviando...' : 'Trocar logo'}
          </button>
        </div>

        <div style={{ background: 'var(--white)', border: '1px solid var(--gray-200)', borderRadius: 8, padding: 16 }}>
          <div style={LABEL}>Símbolo (ícone da aba do navegador)</div>
          <div style={{
            height: 90, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--gray-50)', border: '1px dashed var(--gray-300)', borderRadius: 6, marginBottom: 10,
          }}>
            {config.simboloUrl
              ? <img src={apiFileUrl(config.simboloUrl) ?? ''} alt="Símbolo" style={{ maxHeight: 70, maxWidth: '90%', objectFit: 'contain' }} />
              : <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>Nenhum símbolo enviado</span>}
          </div>
          <input
            ref={simboloInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) enviarArquivo('simbolo', f); e.target.value = ''; }}
          />
          <button style={BTN('ghost')} disabled={uploadingSimbolo} onClick={() => simboloInputRef.current?.click()}>
            {uploadingSimbolo ? 'Enviando...' : 'Trocar símbolo'}
          </button>
        </div>
      </div>

      <div style={{ background: 'var(--white)', border: '1px solid var(--gray-200)', borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <div style={{ marginBottom: 12 }}>
          <label style={LABEL}>Nome curto (aparece no menu, título da aba)</label>
          <input style={INPUT} value={form.nomeInstituicao} onChange={e => setForm(f => ({ ...f, nomeInstituicao: e.target.value }))} placeholder="Ex: FIURJ" />
        </div>
        <div>
          <label style={LABEL}>Nome completo (aparece nos documentos oficiais)</label>
          <input style={INPUT} value={form.nomeCompleto} onChange={e => setForm(f => ({ ...f, nomeCompleto: e.target.value }))} placeholder="Ex: Faculdade Instituto Universitário do Rio de Janeiro" />
        </div>
      </div>

      <div style={{ background: 'var(--white)', border: '1px solid var(--gray-200)', borderRadius: 8, padding: 16, marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={LABEL}>Cor primária</label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="color" value={/^#[0-9a-fA-F]{6}$/.test(form.corPrimaria) ? form.corPrimaria : '#1C3A6B'}
                onChange={e => setForm(f => ({ ...f, corPrimaria: e.target.value }))}
                style={{ width: 40, height: 34, padding: 2, border: '1px solid var(--gray-300)', borderRadius: 5, cursor: 'pointer' }}
              />
              <input
                style={{ ...INPUT, fontFamily: 'monospace' }} value={form.corPrimaria}
                onChange={e => setForm(f => ({ ...f, corPrimaria: e.target.value }))} placeholder="#1C3A6B"
              />
            </div>
          </div>
          <div>
            <label style={LABEL}>Cor secundária</label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="color" value={/^#[0-9a-fA-F]{6}$/.test(form.corSecundaria) ? form.corSecundaria : '#C8102E'}
                onChange={e => setForm(f => ({ ...f, corSecundaria: e.target.value }))}
                style={{ width: 40, height: 34, padding: 2, border: '1px solid var(--gray-300)', borderRadius: 5, cursor: 'pointer' }}
              />
              <input
                style={{ ...INPUT, fontFamily: 'monospace' }} value={form.corSecundaria}
                onChange={e => setForm(f => ({ ...f, corSecundaria: e.target.value }))} placeholder="#C8102E"
              />
            </div>
          </div>
        </div>
        <p style={{ fontSize: 11.5, color: 'var(--gray-400)', margin: '10px 0 0' }}>
          A cor primária é usada no menu, botões e destaques; a secundária em alertas e detalhes. As mudanças aplicam na hora, em toda a plataforma.
        </p>
      </div>

      <button style={BTN('primary')} disabled={saving} onClick={salvar}>
        {saving ? 'Salvando...' : 'Salvar alterações'}
      </button>

      <div style={{ background: 'var(--white)', border: '1px solid var(--gray-200)', borderRadius: 8, padding: 16, marginTop: 24 }}>
        <div style={LABEL}>Galeria de Publicidade (dashboard do aluno)</div>
        <p style={{ fontSize: 11.5, color: 'var(--gray-400)', margin: '0 0 14px' }}>
          Imagens exibidas em rodízio no topo do /dashboard de quem tem perfil Aluno, no lugar dos boxes de estatísticas.
          Desative uma imagem pra tirá-la de circulação sem perder o arquivo; a ordem define a sequência do rodízio.
        </p>

        {galeria.length === 0 && (
          <p style={{ fontSize: 12.5, color: 'var(--gray-400)', marginBottom: 12 }}>Nenhuma imagem cadastrada ainda.</p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
          {galeria.map(img => (
            <div key={img.id} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '8px 10px',
              border: '1px solid var(--gray-200)', borderRadius: 6, opacity: img.ativa ? 1 : 0.5,
            }}>
              <div style={{ width: 80, height: 45, borderRadius: 4, overflow: 'hidden', background: 'var(--gray-50)', flexShrink: 0 }}>
                <img src={apiFileUrl(img.url) ?? ''} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--gray-600)' }}>
                  <input type="checkbox" checked={img.ativa} onChange={e => atualizarImagemGaleria(img.id, { ativa: e.target.checked })} />
                  Ativa
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--gray-400)' }}>
                  Ordem:
                  <input
                    type="number" defaultValue={img.ordem}
                    onBlur={e => { const n = Number(e.target.value); if (!Number.isNaN(n)) atualizarImagemGaleria(img.id, { ordem: n }); }}
                    style={{ width: 56, padding: '3px 6px', border: '1px solid var(--gray-300)', borderRadius: 4, fontSize: 11.5 }}
                  />
                </div>
              </div>
              <button onClick={() => removerImagemGaleria(img.id)} style={{
                border: 'none', background: 'transparent', color: '#dc2626', cursor: 'pointer', fontSize: 12,
              }}>
                Remover
              </button>
            </div>
          ))}
        </div>

        <input
          ref={galeriaInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" style={{ display: 'none' }}
          onChange={e => { const f = e.target.files?.[0]; if (f) enviarImagemGaleria(f); e.target.value = ''; }}
        />
        <button style={BTN('ghost')} disabled={uploadingGaleria} onClick={() => galeriaInputRef.current?.click()}>
          {uploadingGaleria ? 'Enviando...' : '+ Adicionar imagem'}
        </button>
      </div>
    </div>
  );
}
