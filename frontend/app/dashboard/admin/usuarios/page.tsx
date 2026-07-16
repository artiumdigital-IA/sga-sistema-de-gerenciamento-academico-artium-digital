'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { parseJwt, getToken } from '@/lib/auth';

// ─── tipos ───────────────────────────────────────────────────────────────────
type Perfil = 'MASTER' | 'ADMIN' | 'SECRETARIA' | 'FINANCEIRO' | 'PROFESSOR' | 'ALUNO' | 'MANUTENCAO';
type Status = 'ATIVO' | 'INATIVO' | 'BLOQUEADO';

interface Usuario {
  id: string;
  email: string;
  perfil: Perfil;
  status: Status;
  mfaAtivo: boolean;
  alunoId: string | null;
  professorId: string | null;
  criadoEm: string;
  aluno?: { id: string; ra: string; nome: string; curso?: { nome: string } } | null;
  professor?: { id: string; nome: string } | null;
}

interface CreateForm {
  email: string;
  senha: string;
  perfil: Perfil;
  alunoId: string;
  professorId: string;
}

const PERFIL_LABEL: Record<Perfil, string> = {
  MASTER: 'Master', ADMIN: 'Admin', SECRETARIA: 'Secretaria', FINANCEIRO: 'Financeiro',
  PROFESSOR: 'Professor', ALUNO: 'Aluno', MANUTENCAO: 'Manutenção',
};
const PERFIL_COLOR: Record<Perfil, string> = {
  MASTER: '#000000', ADMIN: '#dc2626', SECRETARIA: '#2563eb', FINANCEIRO: '#16a34a',
  PROFESSOR: '#7c3aed', ALUNO: '#d97706', MANUTENCAO: '#0d9488',
};
const STATUS_COLOR: Record<Status, string> = {
  ATIVO: '#16a34a', INATIVO: 'var(--gray-500)', BLOQUEADO: '#dc2626',
};

// ─── componentes auxiliares (fora do componente principal para evitar remount) ─
function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: 999,
      fontSize: 11, fontWeight: 600, color: '#fff', background: color,
    }}>{label}</span>
  );
}

function FieldInput({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-700)' }}>{label}</label>
      <input {...props} style={{
        padding: '7px 10px', border: '1px solid var(--gray-300)', borderRadius: 6,
        fontSize: 13, outline: 'none', ...props.style,
      }} />
    </div>
  );
}

function FieldSelect({ label, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-700)' }}>{label}</label>
      <select {...props} style={{
        padding: '7px 10px', border: '1px solid var(--gray-300)', borderRadius: 6,
        fontSize: 13, background: 'var(--white)',
      }}>{children}</select>
    </div>
  );
}

function Modal({ titulo, onClose, children }: { titulo: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
    }} onClick={onClose}>
      <div style={{
        background: 'var(--white)', borderRadius: 10, padding: 24, width: 420, maxWidth: '94vw',
        boxShadow: '0 20px 60px rgba(0,0,0,.25)',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>{titulo}</h3>
          <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--gray-500)' }}>x</button>
        </div>
        {children}
      </div>
    </div>
  );
}

const BtnPrimary = ({ children, ...p }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button {...p} style={{ padding: '7px 16px', border: 'none', borderRadius: 6, background: '#1e3a5f', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, ...p.style }}>{children}</button>
);
const BtnSecondary = ({ children, ...p }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button {...p} style={{ padding: '7px 16px', border: '1px solid var(--gray-300)', borderRadius: 6, background: 'var(--white)', cursor: 'pointer', fontSize: 13, ...p.style }}>{children}</button>
);

type OpcaoVinculo = { id: string; label: string; sublabel: string };

/** Seletor com busca por nome — troca o antigo campo de "cole o UUID aqui" por
 * uma lista filtrada, buscando de /alunos ou /professores e escondendo quem
 * ja tem login (alunoId/professorId sao @unique em Usuario no schema). */
function BuscaVinculo({
  tipo, valor, onSelecionar,
}: { tipo: 'ALUNO' | 'PROFESSOR'; valor: string; onSelecionar: (id: string, label: string) => void }) {
  const [opcoes, setOpcoes] = useState<OpcaoVinculo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState('');
  const [labelSelecionado, setLabelSelecionado] = useState('');

  useEffect(() => {
    let cancelado = false;
    setCarregando(true);
    apiFetch<any[]>(tipo === 'ALUNO' ? '/alunos' : '/professores')
      .then(lista => {
        if (cancelado) return;
        const semLogin = lista.filter(item => !item.usuario);
        setOpcoes(semLogin.map(item => ({
          id: item.id,
          label: item.nome,
          sublabel: tipo === 'ALUNO'
            ? `RA ${item.ra}${item.curso?.nome ? ' · ' + item.curso.nome : ''}`
            : item.email,
        })));
      })
      .catch(() => { if (!cancelado) setOpcoes([]); })
      .finally(() => { if (!cancelado) setCarregando(false); });
    return () => { cancelado = true; };
  }, [tipo]);

  if (valor && labelSelecionado) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '7px 10px', border: '1px solid var(--gray-300)', borderRadius: 6, fontSize: 13,
      }}>
        <span>{labelSelecionado}</span>
        <button type="button" onClick={() => { onSelecionar('', ''); setLabelSelecionado(''); setBusca(''); }}
          style={{ border: 'none', background: 'none', color: '#2563eb', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
          Trocar
        </button>
      </div>
    );
  }

  const termo = busca.toLowerCase();
  const filtradas = opcoes.filter(o => !termo || o.label.toLowerCase().includes(termo) || o.sublabel.toLowerCase().includes(termo));

  return (
    <div>
      <input
        placeholder={`Buscar ${tipo === 'ALUNO' ? 'aluno' : 'professor'} por nome...`}
        value={busca}
        onChange={e => setBusca(e.target.value)}
        style={{ width: '100%', padding: '7px 10px', border: '1px solid var(--gray-300)', borderRadius: 6, fontSize: 13, marginBottom: 6, boxSizing: 'border-box' }}
      />
      <div style={{ maxHeight: 150, overflowY: 'auto', border: '1px solid var(--gray-200)', borderRadius: 6 }}>
        {carregando ? (
          <p style={{ padding: 8, fontSize: 12, color: 'var(--gray-500)', margin: 0 }}>Carregando...</p>
        ) : filtradas.length === 0 ? (
          <p style={{ padding: 8, fontSize: 12, color: 'var(--gray-500)', margin: 0 }}>
            {opcoes.length === 0
              ? `Nenhum ${tipo === 'ALUNO' ? 'aluno' : 'professor'} sem login disponivel pra vincular.`
              : 'Nenhum resultado.'}
          </p>
        ) : filtradas.map((o, i) => (
          <div key={o.id} onClick={() => { onSelecionar(o.id, o.label); setLabelSelecionado(o.label); }}
            style={{
              padding: '6px 10px', cursor: 'pointer',
              borderBottom: i < filtradas.length - 1 ? '1px solid var(--gray-100)' : 'none',
            }}>
            <div style={{ fontSize: 13, fontWeight: 500 }}>{o.label}</div>
            <div style={{ fontSize: 11, color: 'var(--gray-500)' }}>{o.sublabel}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── componente principal ─────────────────────────────────────────────────────
export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [busca, setBusca] = useState('');
  const [filtroPerfil, setFiltroPerfil] = useState<Perfil | ''>('');
  const [filtroStatus, setFiltroStatus] = useState<Status | ''>('');

  const [modalCriar, setModalCriar] = useState(false);
  const [modalEditar, setModalEditar] = useState<Usuario | null>(null);
  const [modalResetar, setModalResetar] = useState<Usuario | null>(null);
  const [modalMinhaSenha, setModalMinhaSenha] = useState(false);

  const [criar, setCriar] = useState<CreateForm>({ email: '', senha: '', perfil: 'SECRETARIA', alunoId: '', professorId: '' });
  const [editarPerfil, setEditarPerfil] = useState<Perfil>('SECRETARIA');
  const [novaSenha, setNovaSenha] = useState('');
  const [minhaSenhaAtual, setMinhaSenhaAtual] = useState('');
  const [minhaNovaSenha, setMinhaNovaSenha] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState('');

  const token = getToken();
  const meUser = token ? parseJwt(token) : null;
  const isAdmin = meUser?.perfil === 'ADMIN';

  const carregar = useCallback(async () => {
    setLoading(true); setErro('');
    try {
      setUsuarios(await apiFetch<Usuario[]>('/usuarios'));
    } catch (e: any) {
      setErro(e.message ?? 'Erro ao carregar');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const flash = (texto: string) => { setMsg(texto); setTimeout(() => setMsg(''), 3000); };

  const filtrados = usuarios.filter(u => {
    const t = busca.toLowerCase();
    return (!busca || u.email.toLowerCase().includes(t) || (u.aluno?.nome ?? '').toLowerCase().includes(t) || (u.professor?.nome ?? '').toLowerCase().includes(t))
      && (!filtroPerfil || u.perfil === filtroPerfil)
      && (!filtroStatus || u.status === filtroStatus);
  });

  async function handleCriar(e: React.FormEvent) {
    e.preventDefault(); setSalvando(true);
    try {
      const body: Record<string, string> = { email: criar.email, senha: criar.senha, perfil: criar.perfil };
      if (criar.alunoId) body.alunoId = criar.alunoId;
      if (criar.professorId) body.professorId = criar.professorId;
      await apiFetch('/usuarios', { method: 'POST', body: JSON.stringify(body) });
      setModalCriar(false);
      setCriar({ email: '', senha: '', perfil: 'SECRETARIA', alunoId: '', professorId: '' });
      flash('Usuario criado com sucesso.');
      carregar();
    } catch (e: any) { flash('Erro: ' + (e.message ?? 'falha')); }
    finally { setSalvando(false); }
  }

  async function handleEditar(e: React.FormEvent) {
    e.preventDefault(); if (!modalEditar) return; setSalvando(true);
    try {
      await apiFetch(`/usuarios/${modalEditar.id}`, { method: 'PATCH', body: JSON.stringify({ perfil: editarPerfil }) });
      setModalEditar(null); flash('Perfil atualizado.'); carregar();
    } catch (e: any) { flash('Erro: ' + (e.message ?? 'falha')); }
    finally { setSalvando(false); }
  }

  async function handleToggleStatus(u: Usuario) {
    try {
      await apiFetch(`/usuarios/${u.id}/${u.status === 'BLOQUEADO' ? 'ativar' : 'bloquear'}`, { method: 'POST' });
      flash(u.status === 'BLOQUEADO' ? 'Usuario reativado.' : 'Usuario bloqueado.');
      carregar();
    } catch (e: any) { flash('Erro: ' + (e.message ?? 'falha')); }
  }

  async function handleResetar(e: React.FormEvent) {
    e.preventDefault(); if (!modalResetar) return; setSalvando(true);
    try {
      await apiFetch(`/usuarios/${modalResetar.id}/resetar-senha`, { method: 'POST', body: JSON.stringify({ novaSenha }) });
      setModalResetar(null); setNovaSenha(''); flash('Senha resetada.');
    } catch (e: any) { flash('Erro: ' + (e.message ?? 'falha')); }
    finally { setSalvando(false); }
  }

  async function handleMinhaSenha(e: React.FormEvent) {
    e.preventDefault(); setSalvando(true);
    try {
      await apiFetch('/usuarios/me/senha', { method: 'PATCH', body: JSON.stringify({ senhaAtual: minhaSenhaAtual, novaSenha: minhaNovaSenha }) });
      setModalMinhaSenha(false); setMinhaSenhaAtual(''); setMinhaNovaSenha(''); flash('Senha alterada.');
    } catch (e: any) { flash('Erro: ' + (e.message ?? 'falha')); }
    finally { setSalvando(false); }
  }

  return (
    <div style={{ padding: '24px 28px' }}>

      {/* cabecalho */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Gestao de Usuarios</h1>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--gray-500)' }}>
            {usuarios.length} usuario{usuarios.length !== 1 ? 's' : ''} cadastrado{usuarios.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <BtnSecondary onClick={() => setModalMinhaSenha(true)}>Minha senha</BtnSecondary>
          {isAdmin && <BtnPrimary onClick={() => setModalCriar(true)}>+ Novo usuario</BtnPrimary>}
        </div>
      </div>

      {msg && (
        <div style={{
          padding: '10px 14px', borderRadius: 6, marginBottom: 12, fontSize: 13,
          background: msg.startsWith('Erro') ? '#fef2f2' : '#f0fdf4',
          color: msg.startsWith('Erro') ? '#dc2626' : '#16a34a',
          border: `1px solid ${msg.startsWith('Erro') ? '#fca5a5' : '#86efac'}`,
        }}>{msg}</div>
      )}

      {/* filtros */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        <input placeholder="Buscar por e-mail ou nome..." value={busca}
          onChange={e => setBusca(e.target.value)}
          style={{ flex: 1, minWidth: 200, padding: '7px 10px', border: '1px solid var(--gray-300)', borderRadius: 6, fontSize: 13 }} />
        <select value={filtroPerfil} onChange={e => setFiltroPerfil(e.target.value as Perfil | '')}
          style={{ padding: '7px 10px', border: '1px solid var(--gray-300)', borderRadius: 6, fontSize: 13, background: 'var(--white)' }}>
          <option value="">Todos os perfis</option>
          {(Object.keys(PERFIL_LABEL) as Perfil[]).map(p => <option key={p} value={p}>{PERFIL_LABEL[p]}</option>)}
        </select>
        <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value as Status | '')}
          style={{ padding: '7px 10px', border: '1px solid var(--gray-300)', borderRadius: 6, fontSize: 13, background: 'var(--white)' }}>
          <option value="">Todos os status</option>
          <option value="ATIVO">Ativo</option>
          <option value="INATIVO">Inativo</option>
          <option value="BLOQUEADO">Bloqueado</option>
        </select>
      </div>

      {/* tabela */}
      {loading ? <p style={{ color: 'var(--gray-500)', fontSize: 13 }}>Carregando...</p>
        : erro ? <p style={{ color: '#dc2626', fontSize: 13 }}>{erro}</p>
        : (
        <div style={{ background: 'var(--white)', borderRadius: 8, border: '1px solid var(--gray-200)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
                {['E-mail', 'Perfil', 'Status', 'Vinculo', 'Criado em', 'Acoes'].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--gray-700)', fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0
                ? <tr><td colSpan={6} style={{ padding: 24, textAlign: 'center', color: 'var(--gray-400)' }}>Nenhum usuario encontrado.</td></tr>
                : filtrados.map((u, i) => (
                  <tr key={u.id} style={{ borderBottom: i < filtrados.length - 1 ? '1px solid var(--gray-100)' : 'none' }}>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ fontWeight: 500 }}>{u.email}</div>
                      {u.mfaAtivo && <span style={{ fontSize: 10, color: '#7c3aed' }}>MFA ativo</span>}
                    </td>
                    <td style={{ padding: '10px 12px' }}><Badge label={PERFIL_LABEL[u.perfil]} color={PERFIL_COLOR[u.perfil]} /></td>
                    <td style={{ padding: '10px 12px' }}><Badge label={u.status} color={STATUS_COLOR[u.status]} /></td>
                    <td style={{ padding: '10px 12px', color: 'var(--gray-500)', fontSize: 12 }}>
                      {u.aluno ? `${u.aluno.nome} (RA: ${u.aluno.ra})` : u.professor ? u.professor.nome : '-'}
                    </td>
                    <td style={{ padding: '10px 12px', color: 'var(--gray-400)', fontSize: 12 }}>
                      {new Date(u.criadoEm).toLocaleDateString('pt-BR')}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      {isAdmin && (
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          <button onClick={() => { setModalEditar(u); setEditarPerfil(u.perfil); }}
                            style={{ padding: '3px 8px', border: '1px solid var(--gray-300)', borderRadius: 4, background: 'var(--white)', cursor: 'pointer', fontSize: 11 }}>
                            Editar
                          </button>
                          <button onClick={() => handleToggleStatus(u)}
                            style={{ padding: '3px 8px', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 11,
                              background: u.status === 'BLOQUEADO' ? '#dcfce7' : '#fee2e2',
                              color: u.status === 'BLOQUEADO' ? '#16a34a' : '#dc2626' }}>
                            {u.status === 'BLOQUEADO' ? 'Ativar' : 'Bloquear'}
                          </button>
                          <button onClick={() => { setModalResetar(u); setNovaSenha(''); }}
                            style={{ padding: '3px 8px', border: '1px solid var(--gray-300)', borderRadius: 4, background: 'var(--white)', cursor: 'pointer', fontSize: 11 }}>
                            Reset senha
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal: Criar */}
      {modalCriar && (
        <Modal titulo="Novo Usuario" onClose={() => setModalCriar(false)}>
          <form onSubmit={handleCriar} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <FieldInput label="E-mail *" type="email" required value={criar.email}
              onChange={e => setCriar(p => ({ ...p, email: e.target.value }))} />
            <FieldInput label="Senha * (min. 8 caracteres)" type="password" required minLength={8} value={criar.senha}
              onChange={e => setCriar(p => ({ ...p, senha: e.target.value }))} />
            <FieldSelect label="Perfil *" value={criar.perfil}
              onChange={e => setCriar(p => ({ ...p, perfil: e.target.value as Perfil }))}>
              {(Object.keys(PERFIL_LABEL) as Perfil[]).map(p => <option key={p} value={p}>{PERFIL_LABEL[p]}</option>)}
            </FieldSelect>
            {criar.perfil === 'ALUNO' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-700)' }}>Vincular a um aluno (opcional)</label>
                <BuscaVinculo tipo="ALUNO" valor={criar.alunoId}
                  onSelecionar={id => setCriar(p => ({ ...p, alunoId: id }))} />
              </div>
            )}
            {criar.perfil === 'PROFESSOR' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-700)' }}>Vincular a um professor (opcional)</label>
                <BuscaVinculo tipo="PROFESSOR" valor={criar.professorId}
                  onSelecionar={id => setCriar(p => ({ ...p, professorId: id }))} />
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
              <BtnSecondary type="button" onClick={() => setModalCriar(false)}>Cancelar</BtnSecondary>
              <BtnPrimary type="submit" disabled={salvando}>{salvando ? 'Criando...' : 'Criar usuario'}</BtnPrimary>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Editar */}
      {modalEditar && (
        <Modal titulo={`Editar — ${modalEditar.email}`} onClose={() => setModalEditar(null)}>
          <form onSubmit={handleEditar} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <FieldSelect label="Perfil" value={editarPerfil}
              onChange={e => setEditarPerfil(e.target.value as Perfil)}>
              {(Object.keys(PERFIL_LABEL) as Perfil[]).map(p => <option key={p} value={p}>{PERFIL_LABEL[p]}</option>)}
            </FieldSelect>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
              <BtnSecondary type="button" onClick={() => setModalEditar(null)}>Cancelar</BtnSecondary>
              <BtnPrimary type="submit" disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar'}</BtnPrimary>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Resetar senha */}
      {modalResetar && (
        <Modal titulo={`Resetar senha — ${modalResetar.email}`} onClose={() => setModalResetar(null)}>
          <form onSubmit={handleResetar} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <FieldInput label="Nova senha * (min. 8 caracteres)" type="password" required minLength={8}
              value={novaSenha} onChange={e => setNovaSenha(e.target.value)} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
              <BtnSecondary type="button" onClick={() => setModalResetar(null)}>Cancelar</BtnSecondary>
              <BtnPrimary type="submit" disabled={salvando} style={{ background: '#dc2626' }}>{salvando ? 'Resetando...' : 'Resetar senha'}</BtnPrimary>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Minha senha */}
      {modalMinhaSenha && (
        <Modal titulo="Alterar minha senha" onClose={() => setModalMinhaSenha(false)}>
          <form onSubmit={handleMinhaSenha} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <FieldInput label="Senha atual *" type="password" required
              value={minhaSenhaAtual} onChange={e => setMinhaSenhaAtual(e.target.value)} />
            <FieldInput label="Nova senha * (min. 8 caracteres)" type="password" required minLength={8}
              value={minhaNovaSenha} onChange={e => setMinhaNovaSenha(e.target.value)} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
              <BtnSecondary type="button" onClick={() => setModalMinhaSenha(false)}>Cancelar</BtnSecondary>
              <BtnPrimary type="submit" disabled={salvando}>{salvando ? 'Salvando...' : 'Alterar senha'}</BtnPrimary>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
