'use client';

import { useState, useRef, useEffect } from 'react';
import { getToken, parseJwt } from '@/lib/auth';
import { apiFetch, apiUpload, apiFileUrl } from '@/lib/api';
import { useBranding } from '@/lib/branding';
import { GaleriaPublicidade } from '@/components/dashboard/GaleriaPublicidade';
import { ProgressoCurso } from '@/components/dashboard/ProgressoCurso';
import Image from 'next/image';

/* ─── Tipos ─── */
type ActiveView = 'painel' | 'conta' | 'comunidade';
interface DragState { id: string; colIdx: number; }

/* ─── Dados estáticos ─── */
const HORARIO_PERIODOS = [
  { nome: 'RBS',    inicio: '07:15', fim: '07:30' },
  { nome: 'P1',     inicio: '07:30', fim: '08:20' },
  { nome: 'P2',     inicio: '08:20', fim: '09:10' },
  { nome: 'Inter.', inicio: '09:10', fim: '09:25' },
  { nome: 'P3',     inicio: '09:25', fim: '10:15' },
  { nome: 'P4',     inicio: '10:15', fim: '11:05' },
  { nome: 'Inter.', inicio: '11:05', fim: '11:15' },
  { nome: 'P5',     inicio: '11:15', fim: '12:05' },
];

const HORARIO_DIAS = ['SEG', 'TER', 'QUA', 'QUI', 'SEX'];

const HORARIO_GRADE: Record<string, string[]> = {
  'P1': ['Português','Matemática','História','Física','Inglês'],
  'P2': ['Inglês','Física','Matemática','Português','História'],
  'P3': ['Matemática','Inglês','Física','História','Português'],
  'P4': ['Física','Português','Inglês','Matemática','Ed. Física'],
  'P5': ['Ed. Física','História','Português','Inglês','Matemática'],
};

const BOLETIM_SUBTABS = ['Boletim','Ausência','Ocorrências','Agenda','Arquivos'];

const BOLETIM_ITEMS = [
  { initials: 'MS', color: '#e17076', name: 'Maria Souza',    tag: 'GERAL',         text: 'Prova de Direito Constitucional remarcada para 25/06.',  time: '08:30' },
  { initials: 'AT', color: '#5e9bd6', name: 'Administração',   tag: 'IMPORTANTE',    text: 'Reunião do Colegiado — sala 5A às 14h desta quinta-feira.', time: '09:00' },
  { initials: 'RC', color: '#6fcf97', name: 'Coord. Pedagógico', tag: 'APENAS EQUIPE', text: 'Revisão dos índices de aprovação do 2º semestre.',       time: '10:15' },
  { initials: 'JB', color: '#f2994a', name: 'João Batista',   tag: 'GERAL',         text: 'Semana de Cultura e Diversidade: 13 a 17/06 no Pátio.', time: 'Ontem' },
];

const TAG_COLORS: Record<string, { bg: string; color: string }> = {
  'GERAL':          { bg: '#dde1e8', color: '#5e6878' },
  'IMPORTANTE':     { bg: '#f8d7db', color: '#C8102E' },
  'APENAS EQUIPE':  { bg: '#fef3cd', color: '#b45309' },
};

const CALENDARIO_EVENTOS = [
  { evento: 'Início do 2º Semestre',           local: 'Toda a Faculdade',  cat: 'Acadêmico',   tipo: 'Semestral', inicio: '03/07', fim: '–' },
  { evento: 'Avaliação Bimestral — Módulo I',  local: 'Salas de Aula',    cat: 'Avaliações',  tipo: 'Bimestral', inicio: '18/07', fim: '22/07' },
  { evento: 'Semana de Cultura e Diversidade', local: 'Pátio Central',    cat: 'Eventos',     tipo: 'Cultural',  inicio: '13/06', fim: '17/06' },
];

const CAT_COLORS: Record<string, { bg: string; color: string }> = {
  'Acadêmico':  { bg: '#d4edda', color: '#1a7a3c' },
  'Avaliações': { bg: '#f8d7db', color: '#C8102E' },
  'Eventos':    { bg: '#d4edda', color: '#1a7a3c' },
};

/* ─── Stats Bar (dados reais da API) ─── */
interface Stats { cursos: number; alunos: number; professores: number; loading: boolean; }

const STATS_CONFIG = [
  { key: 'cursos' as const,      label: 'Cursos',      color: '#1a56db', emoji: '📚' },
  { key: 'alunos' as const,      label: 'Alunos',      color: '#0694a2', emoji: '👥' },
  { key: 'professores' as const, label: 'Professores', color: '#7e3af2', emoji: '🎓' },
];

function StatsBar({ stats }: { stats: Stats }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: 12,
      padding: '14px 14px 0',
    }}>
      {STATS_CONFIG.map(cfg => (
        <div key={cfg.label} style={{
          background: 'var(--white)',
          border: '1px solid var(--gray-200)',
          borderRadius: 8,
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          boxShadow: '0 1px 3px rgba(0,0,0,.06)',
        }}>
          <div style={{
            width: 42, height: 42, borderRadius: 10,
            background: cfg.color + '18',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, flexShrink: 0,
          }}>
            {cfg.emoji}
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--gray-900)', lineHeight: 1.1 }}>
              {stats.loading ? '—' : stats[cfg.key].toLocaleString('pt-BR')}
            </div>
            <div style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 2 }}>{cfg.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Componente card draggable ─── */
function DashCard({
  id, title, icon, children, dragging, onDragStart,
}: {
  id: string; title: string; icon: React.ReactNode; children: React.ReactNode;
  dragging: boolean; onDragStart: (e: React.DragEvent) => void;
}) {
  return (
    <div
      id={id}
      draggable
      onDragStart={onDragStart}
      style={{
        background: 'var(--white)',
        borderRadius: 6,
        border: '1px solid var(--gray-200)',
        boxShadow: '0 1px 4px rgba(0,0,0,.06)',
        marginBottom: 14,
        opacity: dragging ? 0.4 : 1,
        transition: 'opacity .15s',
        overflow: 'hidden',
      }}
    >
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 14px', borderBottom: '1px solid var(--gray-100)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ cursor: 'grab', color: 'var(--gray-300)', display: 'flex', userSelect: 'none' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="5" cy="6" r="1.5"/><circle cx="12" cy="6" r="1.5"/><circle cx="19" cy="6" r="1.5"/>
              <circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>
              <circle cx="5" cy="18" r="1.5"/><circle cx="12" cy="18" r="1.5"/><circle cx="19" cy="18" r="1.5"/>
            </svg>
          </span>
          <span style={{ color: 'var(--accent-blue-text)' }}>{icon}</span>
          <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--gray-700)' }}>{title}</span>
        </div>
        <button style={{ border: 'none', background: 'none', color: 'var(--gray-400)', cursor: 'pointer', display: 'flex', padding: 2 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>
          </svg>
        </button>
      </div>
      {children}
    </div>
  );
}

/* ─── Grade Horária ─── */
interface Oferta {
  id: string;
  horario?: string;
  sala?: string;
  turno: string;
  vagas: number;
  disciplina: { nome: string; cargaHoraria: number };
  professor: { nome: string };
  periodoLetivo: { ano: number; semestre: number; status: string };
}

const TURNO_LABEL: Record<string, string> = {
  MANHA: 'Manhã', TARDE: 'Tarde', NOITE: 'Noite', INTEGRAL: 'Integral',
};

function GradeHoraria() {
  const [ofertas, setOfertas] = useState<Oferta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<Oferta[]>('/ofertas')
      .then(data => {
        // prioriza periodo EM_ANDAMENTO, senão pega o mais recente
        const ativos = data.filter(o => o.periodoLetivo?.status === 'EM_ANDAMENTO');
        setOfertas(ativos.length > 0 ? ativos : data.slice(0, 10));
      })
      .catch(() => setOfertas([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: '16px 14px', fontSize: 12, color: 'var(--gray-400)' }}>Carregando...</div>;
  if (ofertas.length === 0) return <div style={{ padding: '16px 14px', fontSize: 12, color: 'var(--gray-400)' }}>Nenhuma oferta no período ativo.</div>;

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5 }}>
        <thead>
          <tr>
            {['Disciplina','Professor','Turno','Horário','Sala','Vagas'].map(h => (
              <th key={h} style={thStyle}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ofertas.map((o, i) => (
            <tr key={o.id} style={{ background: i % 2 === 0 ? 'var(--white)' : 'var(--gray-50)' }}>
              <td style={{ ...tdStyle, fontWeight: 500, color: 'var(--gray-700)' }}>{o.disciplina?.nome ?? '—'}</td>
              <td style={tdStyle}>{o.professor?.nome ?? '—'}</td>
              <td style={tdStyle}>{TURNO_LABEL[o.turno] ?? o.turno}</td>
              <td style={{ ...tdStyle, color: 'var(--accent-blue-text)' }}>{o.horario ?? '—'}</td>
              <td style={tdStyle}>{o.sala ?? '—'}</td>
              <td style={tdStyle}>{o.vagas}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ─── Boletim Diário ─── */
interface AvisoItem {
  id: string;
  titulo: string;
  texto: string;
  tag: 'GERAL' | 'IMPORTANTE' | 'APENAS_EQUIPE';
  autorNome: string;
  criadoEm: string;
}

const AVISO_TAG_LABEL: Record<string, string> = {
  GERAL: 'GERAL', IMPORTANTE: 'IMPORTANTE', APENAS_EQUIPE: 'APENAS EQUIPE',
};

function BoletimDiario() {
  const [activeTab, setActiveTab] = useState(0);
  const [avisos, setAvisos] = useState<AvisoItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<AvisoItem[]>('/avisos')
      .then(data => setAvisos(data))
      .catch(() => setAvisos([]))
      .finally(() => setLoading(false));
  }, []);

  function fmtTime(iso: string) {
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 86400000 && d.getDate() === now.getDate()) {
      return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }
    if (diff < 172800000) return 'Ontem';
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  }

  function initials(name: string) {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }

  const AVATAR_COLORS = ['#e17076','#5e9bd6','#6fcf97','#f2994a','#7e3af2','#0694a2'];

  return (
    <div>
      {/* sub-tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--gray-200)', overflowX: 'auto' }}>
        {BOLETIM_SUBTABS.map((t, i) => (
          <button key={t} onClick={() => setActiveTab(i)} style={{
            padding: '6px 12px', fontSize: 11.5, fontWeight: 600, border: 'none', background: 'none',
            cursor: 'pointer', whiteSpace: 'nowrap',
            color: activeTab === i ? 'var(--accent-blue-text)' : 'var(--gray-400)',
            borderBottom: activeTab === i ? '2px solid var(--accent-blue-text)' : '2px solid transparent',
            marginBottom: -1,
          }}>
            {t}
          </button>
        ))}
      </div>
      {/* items */}
      {activeTab === 0 ? (
        <div>
          {loading && (
            <div style={{ padding: '16px 14px', fontSize: 12, color: 'var(--gray-400)' }}>Carregando...</div>
          )}
          {!loading && avisos.length === 0 && (
            <div style={{ padding: '24px 14px', textAlign: 'center', color: 'var(--gray-400)', fontSize: 12 }}>
              Nenhum aviso publicado.
            </div>
          )}
          {avisos.map((item, i) => {
            const tagKey = item.tag;
            const tag = TAG_COLORS[AVISO_TAG_LABEL[tagKey]] ?? { bg: 'var(--gray-100)', color: 'var(--gray-500)' };
            const avatarColor = AVATAR_COLORS[i % AVATAR_COLORS.length];
            return (
              <div key={item.id} style={{
                display: 'flex', gap: 10, padding: '10px 14px',
                borderBottom: '1px solid var(--gray-100)', alignItems: 'flex-start',
              }}>
                <div style={{
                  width: 30, height: 30, borderRadius: '50%',
                  background: avatarColor, color: '#fff', fontSize: 10, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>{initials(item.autorNome)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 3 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-700)' }}>{item.autorNome}</span>
                    <span style={{
                      fontSize: 9, fontWeight: 700, letterSpacing: '.4px',
                      background: tag.bg, color: tag.color,
                      padding: '1px 5px', borderRadius: 3,
                    }}>{AVISO_TAG_LABEL[tagKey]}</span>
                    <span style={{ fontSize: 10, color: 'var(--gray-400)', marginLeft: 'auto' }}>{fmtTime(item.criadoEm)}</span>
                  </div>
                  <p style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--gray-700)', margin: '0 0 2px' }}>{item.titulo}</p>
                  <p style={{ fontSize: 12, color: 'var(--gray-500)', lineHeight: 1.5, margin: 0 }}>{item.texto}</p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ padding: '24px 14px', textAlign: 'center', color: 'var(--gray-400)', fontSize: 12 }}>
          Sem registros em {BOLETIM_SUBTABS[activeTab]}.
        </div>
      )}
    </div>
  );
}

/* ─── Calendário Acadêmico ─── */
interface PeriodoLetivo {
  id: string;
  ano: number;
  semestre: number;
  dataInicio: string;
  dataFim: string;
  status: string;
}

const PERIODO_STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  EM_ANDAMENTO: { bg: '#d4edda', color: '#1a7a3c' },
  PLANEJADO:    { bg: '#dbeafe', color: '#1e40af' },
  ENCERRADO:    { bg: 'var(--gray-100)', color: 'var(--gray-500)' },
};

const PERIODO_STATUS_LABEL: Record<string, string> = {
  EM_ANDAMENTO: 'Em andamento',
  PLANEJADO:    'Planejado',
  ENCERRADO:    'Encerrado',
};

function CalendarioAcademico() {
  const [periodos, setPeriodos] = useState<PeriodoLetivo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<PeriodoLetivo[]>('/periodos-letivos')
      .then(data => setPeriodos(data))
      .catch(() => setPeriodos([]))
      .finally(() => setLoading(false));
  }, []);

  const fmt = (iso: string) => {
    try { return new Date(iso).toLocaleDateString('pt-BR'); } catch { return iso; }
  };

  if (loading) return <div style={{ padding: '16px 14px', fontSize: 12, color: 'var(--gray-400)' }}>Carregando...</div>;
  if (periodos.length === 0) return <div style={{ padding: '16px 14px', fontSize: 12, color: 'var(--gray-400)' }}>Nenhum período cadastrado.</div>;

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5 }}>
        <thead>
          <tr>
            {['Período','Semestre','Situação','Início','Fim'].map(h => (
              <th key={h} style={thStyle}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {periodos.map((p, i) => {
            const c = PERIODO_STATUS_COLORS[p.status] ?? { bg: 'var(--gray-100)', color: 'var(--gray-500)' };
            return (
              <tr key={p.id} style={{ background: i % 2 === 0 ? 'var(--white)' : 'var(--gray-50)' }}>
                <td style={{ ...tdStyle, fontWeight: 600, color: 'var(--gray-700)' }}>{p.ano}</td>
                <td style={tdStyle}>{p.semestre}º Semestre</td>
                <td style={tdStyle}>
                  <span style={{ background: c.bg, color: c.color, padding: '2px 6px', borderRadius: 3, fontSize: 10.5, fontWeight: 600 }}>
                    {PERIODO_STATUS_LABEL[p.status] ?? p.status}
                  </span>
                </td>
                <td style={tdStyle}>{fmt(p.dataInicio)}</td>
                <td style={tdStyle}>{fmt(p.dataFim)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ─── Minha Conta ─── */
interface MeuPerfil {
  id: string;
  email: string;
  perfil: string;
  status: string;
  mfaAtivo: boolean;
  nome: string | null;
  telefone: string | null;
  fotoUrl: string | null;
}

const CARGO_LABEL: Record<string, string> = {
  ADMIN: 'Administrador do Sistema', SECRETARIA: 'Secretaria Acadêmica',
  FINANCEIRO: 'Financeiro', PROFESSOR: 'Professor', ALUNO: 'Aluno',
};

function MinhaConta() {
  const branding = useBranding();
  const [perfil, setPerfil] = useState<MeuPerfil | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [editando, setEditando] = useState(false);
  const [alterandoSenha, setAlterandoSenha] = useState(false);

  function carregar() {
    setLoading(true);
    apiFetch<MeuPerfil>('/usuarios/me')
      .then(data => { setPerfil(data); setErro(null); })
      .catch(e => setErro(e.message ?? 'Erro ao carregar perfil.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { carregar(); }, []);

  if (loading) return <div style={{ padding: 24, fontSize: 12.5, color: 'var(--gray-400)' }}>Carregando…</div>;
  if (erro || !perfil) return <div style={{ padding: 24, fontSize: 12.5, color: 'var(--accent-red-text)' }}>{erro ?? 'Não foi possível carregar seu perfil.'}</div>;

  const nomeExibido = perfil.nome || perfil.email.split('@')[0];
  const cargo = CARGO_LABEL[perfil.perfil] ?? perfil.perfil;
  const fotoSrc = apiFileUrl(perfil.fotoUrl) ?? '/assets/perfil.png';

  return (
    <div style={{ padding: '16px 16px' }}>
      {/* Profile header */}
      <div style={{ background: 'var(--white)', borderRadius: 6, border: '1px solid var(--gray-200)', padding: '16px 20px', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Image src={fotoSrc} alt="Perfil" width={60} height={60} key={fotoSrc}
            style={{ borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--gray-200)' }} unoptimized />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--gray-700)' }}>{nomeExibido}</div>
            <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 2 }}>{cargo} · {branding.nomeInstituicao}</div>
            <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{perfil.email}</div>
          </div>
          <button onClick={() => setEditando(true)} style={{ padding: '6px 12px', border: '1px solid var(--gray-300)', borderRadius: 4, background: 'transparent', fontSize: 12, cursor: 'pointer', color: 'var(--gray-600)' }}>
            Editar Perfil
          </button>
        </div>
      </div>

      {/* 3-col grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 14 }}>
        {[
          { title: 'Dados Pessoais', fields: [
            ['Nome completo', nomeExibido],
            ['E-mail', perfil.email],
            ['Cargo', cargo],
            ['Telefone', perfil.telefone || '—'],
            ['Unidade', `${branding.nomeInstituicao} — Campus Central`],
          ]},
          { title: 'Segurança', fields: [
            ['Senha', '••••••••'],
            ['2FA', perfil.mfaAtivo ? 'Ativado' : 'Desativado'],
            ['Status da conta', perfil.status === 'ATIVO' ? 'Ativo' : perfil.status],
          ]},
          { title: 'Preferências', fields: [
            ['Idioma', 'Português (Brasil)'],
            ['Fuso horário', 'América/São_Paulo (GMT-3)'],
            ['Tema', 'Claro'],
          ]},
        ].map(card => (
          <div key={card.title} style={{ background: 'var(--white)', borderRadius: 6, border: '1px solid var(--gray-200)', overflow: 'hidden' }}>
            <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--gray-100)', fontWeight: 600, fontSize: 12.5, color: 'var(--gray-700)' }}>{card.title}</div>
            <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {card.fields.map(([label, val]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                  <span style={{ color: 'var(--gray-400)' }}>{label}</span>
                  {label === 'Senha' ? (
                    <button onClick={() => setAlterandoSenha(true)} style={{ padding: '3px 8px', border: '1px solid var(--gray-300)', borderRadius: 4, background: 'transparent', fontSize: 11, cursor: 'pointer', color: 'var(--accent-blue-text)', fontWeight: 600 }}>
                      Alterar
                    </button>
                  ) : (
                    <span style={{ color: 'var(--gray-700)', fontWeight: 500 }}>{val}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {editando && (
        <EditarPerfilModal
          perfil={perfil}
          onClose={() => setEditando(false)}
          onSaved={(atualizado) => { setPerfil(atualizado); setEditando(false); }}
        />
      )}

      {alterandoSenha && (
        <AlterarSenhaModal onClose={() => setAlterandoSenha(false)} />
      )}
    </div>
  );
}

/* ─── Modal: Editar Perfil ───
   Componente definido no nível de módulo (fora de MinhaConta) para evitar
   remount a cada render do pai, que causaria perda de foco nos inputs. */
function EditarPerfilModal({ perfil, onClose, onSaved }: {
  perfil: MeuPerfil;
  onClose: () => void;
  onSaved: (p: MeuPerfil) => void;
}) {
  const [nome, setNome] = useState(perfil.nome ?? '');
  const [telefone, setTelefone] = useState(perfil.telefone ?? '');
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(apiFileUrl(perfil.fotoUrl));
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function onEscolherFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      setErro('A imagem deve ter no máximo 3MB.');
      return;
    }
    setErro(null);
    setFotoFile(file);
    setPreview(URL.createObjectURL(file));
  }

  async function salvar() {
    setSalvando(true);
    setErro(null);
    try {
      let atualizado = await apiFetch<MeuPerfil>('/usuarios/me', {
        method: 'PATCH',
        body: JSON.stringify({ nome: nome.trim(), telefone: telefone.trim() }),
      });
      if (fotoFile) {
        const formData = new FormData();
        formData.append('foto', fotoFile);
        atualizado = await apiUpload<MeuPerfil>('/usuarios/me/foto', formData);
      }
      onSaved(atualizado);
      // Avisa o layout (avatar/nome na barra superior) para recarregar o perfil.
      window.dispatchEvent(new CustomEvent('fiurj:perfil-atualizado'));
    } catch (e: any) {
      setErro(e.message ?? 'Erro ao salvar perfil.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'var(--white)', borderRadius: 8, width: 380, maxWidth: '92vw',
        padding: 20, boxShadow: '0 8px 30px rgba(0,0,0,.2)',
      }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--gray-700)', marginBottom: 16 }}>Editar Perfil</div>

        {/* Foto */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginBottom: 18 }}>
          <div style={{ position: 'relative', width: 72, height: 72 }}>
            <Image src={preview ?? '/assets/perfil.png'} alt="Preview" width={72} height={72}
              style={{ borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--gray-200)' }} unoptimized />
          </div>
          <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp"
            onChange={onEscolherFoto} style={{ display: 'none' }} />
          <button onClick={() => fileInputRef.current?.click()} style={{
            padding: '5px 10px', border: '1px solid var(--gray-300)', borderRadius: 4,
            background: 'transparent', fontSize: 11.5, cursor: 'pointer', color: 'var(--gray-600)',
          }}>
            Trocar foto
          </button>
        </div>

        {/* Campos */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
          <label style={{ fontSize: 11.5, color: 'var(--gray-500)' }}>
            Nome completo
            <input value={nome} onChange={e => setNome(e.target.value)} placeholder="Seu nome completo"
              style={{ width: '100%', marginTop: 4, padding: '7px 10px', border: '1px solid var(--gray-300)', borderRadius: 4, fontSize: 12.5, boxSizing: 'border-box' }} />
          </label>
          <label style={{ fontSize: 11.5, color: 'var(--gray-500)' }}>
            Telefone
            <input value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="(21) 99999-0000"
              style={{ width: '100%', marginTop: 4, padding: '7px 10px', border: '1px solid var(--gray-300)', borderRadius: 4, fontSize: 12.5, boxSizing: 'border-box' }} />
          </label>
        </div>

        {erro && <div style={{ fontSize: 11.5, color: 'var(--accent-red-text)', marginBottom: 10 }}>{erro}</div>}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onClose} disabled={salvando} style={{
            padding: '7px 14px', border: '1px solid var(--gray-300)', borderRadius: 4,
            background: 'transparent', fontSize: 12, cursor: 'pointer', color: 'var(--gray-600)',
          }}>
            Cancelar
          </button>
          <button onClick={salvar} disabled={salvando} style={{
            padding: '7px 14px', border: 'none', borderRadius: 4,
            background: 'var(--blue-dark)', fontSize: 12, cursor: 'pointer', color: '#fff',
            opacity: salvando ? 0.7 : 1,
          }}>
            {salvando ? 'Salvando…' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Modal: Alterar Senha ─── */
function AlterarSenhaModal({ onClose }: { onClose: () => void }) {
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  async function salvar() {
    setErro(null);
    if (!senhaAtual) { setErro('Informe sua senha atual.'); return; }
    if (novaSenha.length < 8) { setErro('A nova senha deve ter pelo menos 8 caracteres.'); return; }
    if (novaSenha !== confirmarSenha) { setErro('A confirmação não confere com a nova senha.'); return; }
    setSalvando(true);
    try {
      await apiFetch('/usuarios/me/senha', {
        method: 'PATCH',
        body: JSON.stringify({ senhaAtual, novaSenha }),
      });
      setSucesso(true);
    } catch (e: any) {
      setErro(e.message ?? 'Erro ao alterar senha.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'var(--white)', borderRadius: 8, width: 360, maxWidth: '92vw',
        padding: 20, boxShadow: '0 8px 30px rgba(0,0,0,.2)',
      }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--gray-700)', marginBottom: 16 }}>Alterar Senha</div>

        {sucesso ? (
          <>
            <div style={{ fontSize: 12.5, color: 'var(--gray-600)', marginBottom: 16 }}>Senha alterada com sucesso.</div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={onClose} style={{
                padding: '7px 14px', border: 'none', borderRadius: 4,
                background: 'var(--blue-dark)', fontSize: 12, cursor: 'pointer', color: '#fff',
              }}>
                Fechar
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
              <label style={{ fontSize: 11.5, color: 'var(--gray-500)' }}>
                Senha atual
                <input type="password" value={senhaAtual} onChange={e => setSenhaAtual(e.target.value)}
                  style={{ width: '100%', marginTop: 4, padding: '7px 10px', border: '1px solid var(--gray-300)', borderRadius: 4, fontSize: 12.5, boxSizing: 'border-box' }} />
              </label>
              <label style={{ fontSize: 11.5, color: 'var(--gray-500)' }}>
                Nova senha (mínimo 8 caracteres)
                <input type="password" value={novaSenha} onChange={e => setNovaSenha(e.target.value)}
                  style={{ width: '100%', marginTop: 4, padding: '7px 10px', border: '1px solid var(--gray-300)', borderRadius: 4, fontSize: 12.5, boxSizing: 'border-box' }} />
              </label>
              <label style={{ fontSize: 11.5, color: 'var(--gray-500)' }}>
                Confirmar nova senha
                <input type="password" value={confirmarSenha} onChange={e => setConfirmarSenha(e.target.value)}
                  style={{ width: '100%', marginTop: 4, padding: '7px 10px', border: '1px solid var(--gray-300)', borderRadius: 4, fontSize: 12.5, boxSizing: 'border-box' }} />
              </label>
            </div>

            {erro && <div style={{ fontSize: 11.5, color: 'var(--accent-red-text)', marginBottom: 10 }}>{erro}</div>}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={onClose} disabled={salvando} style={{
                padding: '7px 14px', border: '1px solid var(--gray-300)', borderRadius: 4,
                background: 'transparent', fontSize: 12, cursor: 'pointer', color: 'var(--gray-600)',
              }}>
                Cancelar
              </button>
              <button onClick={salvar} disabled={salvando} style={{
                padding: '7px 14px', border: 'none', borderRadius: 4,
                background: 'var(--blue-dark)', fontSize: 12, cursor: 'pointer', color: '#fff',
                opacity: salvando ? 0.7 : 1,
              }}>
                {salvando ? 'Salvando…' : 'Salvar'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── CARDS data ─── */
const INITIAL_CARDS = [
  {
    id: 'card-grade',
    colIdx: 0,
    title: 'Grade Horária',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    content: <GradeHoraria />,
  },
  {
    id: 'card-boletim',
    colIdx: 0,
    title: 'Boletim Diário',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/></svg>,
    content: <BoletimDiario />,
  },
  {
    id: 'card-calendario',
    colIdx: 1,
    title: 'Calendário Acadêmico',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><circle cx="8" cy="15" r="1"/><circle cx="12" cy="15" r="1"/><circle cx="16" cy="15" r="1"/></svg>,
    content: <CalendarioAcademico />,
  },
];

/* ─── Página principal ─── */
export default function DashboardPage() {
  const [activeView, setActiveView] = useState<ActiveView>(() => {
    if (typeof window === 'undefined') return 'painel';
    const v = new URLSearchParams(window.location.search).get('view');
    return v === 'conta' || v === 'comunidade' ? v : 'painel';
  });
  const [colMode, setColMode] = useState<'1' | '2'>('2');
  const [cards, setCards] = useState(INITIAL_CARDS);
  const dragId = useRef<string | null>(null);
  const [stats, setStats] = useState<Stats>({ cursos: 0, alunos: 0, professores: 0, loading: true });
  const [banner, setBanner] = useState<{ id: string; titulo: string; texto: string } | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  // Aviso de acesso negado — o middleware manda pra cá com ?acessoNegado=... quando
  // bloqueia uma rota (hoje só /dashboard/admin/permissoes, restrita à conta master).
  // Sem isso, o redirect é silencioso e parece um ícone de menu quebrado.
  const [acessoNegadoMsg, setAcessoNegadoMsg] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    const motivo = new URLSearchParams(window.location.search).get('acessoNegado');
    if (motivo === 'permissoes') {
      return 'A tela de Matriz de Permissões é restrita à conta administradora master (admin@fiurj.edu.br) e a usuários com perfil Master.';
    }
    return null;
  });
  useEffect(() => {
    if (acessoNegadoMsg && typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('acessoNegado');
      window.history.replaceState({}, '', url.toString());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Perfil ALUNO vê a Galeria de Publicidade + Progresso no Curso no lugar dos
  // 3 boxes de estatísticas (Cursos/Alunos/Professores) — ver `souAluno` abaixo.
  const [perfil, setPerfil] = useState<string | null>(null);
  useEffect(() => {
    const t = getToken();
    if (t) setPerfil(parseJwt(t)?.perfil ?? null);
  }, []);
  const souAluno = perfil === 'ALUNO';

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };
    const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';
    Promise.all([
      fetch(`${API}/cursos`, { headers }).then(r => r.json()),
      fetch(`${API}/alunos`, { headers }).then(r => r.json()),
      fetch(`${API}/professores`, { headers }).then(r => r.json()),
    ]).then(([cursos, alunos, professores]) => {
      setStats({
        cursos: Array.isArray(cursos) ? cursos.length : 0,
        alunos: Array.isArray(alunos) ? alunos.length : 0,
        professores: Array.isArray(professores) ? professores.length : 0,
        loading: false,
      });
    }).catch(() => setStats(s => ({ ...s, loading: false })));
  }, []);

  // Faixa de aviso no topo — puxa o aviso IMPORTANTE mais recente do módulo Avisos
  // (Secretaria > Avisos). Editável por lá, sem precisar mexer em código.
  useEffect(() => {
    apiFetch<Array<{ id: string; titulo: string; texto: string; tag: string }>>('/avisos')
      .then(data => {
        const maisRecente = data.find(a => a.tag === 'IMPORTANTE');
        setBanner(maisRecente ? { id: maisRecente.id, titulo: maisRecente.titulo, texto: maisRecente.texto } : null);
      })
      .catch(() => setBanner(null));
  }, []);

  useEffect(() => { setBannerDismissed(false); }, [banner?.id]);

  /* Drag & drop */
  function onDragStart(e: React.DragEvent, id: string) {
    dragId.current = id;
    e.dataTransfer.effectAllowed = 'move';
  }

  function onDrop(e: React.DragEvent, targetColIdx: number, targetId?: string) {
    e.preventDefault();
    const src = dragId.current;
    if (!src || src === targetId) return;
    setCards(prev => {
      const list = [...prev];
      const srcIdx = list.findIndex(c => c.id === src);
      if (srcIdx === -1) return prev;
      const [moved] = list.splice(srcIdx, 1);
      moved.colIdx = targetColIdx;
      if (targetId) {
        const tgtIdx = list.findIndex(c => c.id === targetId);
        list.splice(tgtIdx, 0, moved);
      } else {
        list.push(moved);
      }
      return list;
    });
    dragId.current = null;
  }

  const col1 = cards.filter(c => c.colIdx === 0);
  const col2 = cards.filter(c => c.colIdx === 1);

  return (
    <div>
      {/* ── Acesso negado — o menu mandou pra uma rota bloqueada pelo middleware ── */}
      {acessoNegadoMsg && (
        <div style={{
          background: '#fee2e2', borderBottom: '1px solid #fecaca',
          padding: '7px 16px', fontSize: 11.5, color: '#991b1b',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <strong>Acesso não permitido:</strong> {acessoNegadoMsg}
          <button onClick={() => setAcessoNegadoMsg(null)} style={{ marginLeft: 'auto', border: 'none', background: 'none', fontSize: 14, color: '#991b1b', cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>
      )}
      {/* ── Alert banner — dinâmico, vem do módulo Avisos (tag IMPORTANTE) ── */}
      {banner && !bannerDismissed && (
        <div style={{
          background: '#fff3cd', borderBottom: '1px solid #ffeaa7',
          padding: '7px 16px', fontSize: 11.5, color: '#856404',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <strong>{banner.titulo}:</strong> {banner.texto}
          <button onClick={() => setBannerDismissed(true)} style={{ marginLeft: 'auto', border: 'none', background: 'none', fontSize: 14, color: '#856404', cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>
      )}

      {/* ── Sub-header (tabs principais) ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 0,
        background: 'var(--white)', borderBottom: '1px solid var(--gray-200)',
        padding: '0 12px',
      }}>
        {([
          { key: 'painel',    label: 'Painel ▾' },
          { key: 'conta',     label: 'Minha Conta' },
          { key: 'comunidade',label: 'Comunidade' },
        ] as const).map(tab => (
          <button key={tab.key} onClick={() => setActiveView(tab.key)} style={{
            padding: '9px 14px', fontSize: 12.5, fontWeight: 600, border: 'none', background: 'none',
            cursor: 'pointer',
            color: activeView === tab.key ? 'var(--accent-blue-text)' : 'var(--gray-400)',
            borderBottom: activeView === tab.key ? '2px solid var(--accent-blue-text)' : '2px solid transparent',
          }}>
            {tab.label}
          </button>
        ))}

        {/* Layout toggle (só visível no painel) */}
        {activeView === 'painel' && (
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
            {(['1','2'] as const).map(n => (
              <button key={n} title={`${n} coluna${n==='2'?'s':''}`}
                onClick={() => setColMode(n)}
                style={{
                  width: 26, height: 22, border: '1px solid var(--gray-300)', borderRadius: 3,
                  background: colMode === n ? 'var(--blue-dark)' : 'transparent',
                  color: colMode === n ? '#fff' : 'var(--gray-400)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {n === '1' ? (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><rect x="1" y="1" width="8" height="8" rx="1"/></svg>
                ) : (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><rect x="1" y="1" width="3.5" height="8" rx="0.5"/><rect x="5.5" y="1" width="3.5" height="8" rx="0.5"/></svg>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Views ── */}
      {activeView === 'painel' && (
        <div>
        {souAluno ? (
          <>
            <GaleriaPublicidade />
            <ProgressoCurso />
          </>
        ) : (
          <StatsBar stats={stats} />
        )}
        <div style={{
          display: 'grid',
          gridTemplateColumns: colMode === '2' ? '1fr 1fr' : '1fr',
          gap: 0,
          padding: '14px 14px 0',
        }}>
          {/* Coluna 1 */}
          <div
            onDragOver={e => e.preventDefault()}
            onDrop={e => onDrop(e, 0)}
            style={{ paddingRight: colMode === '2' ? 7 : 0, minHeight: 100 }}
          >
            {col1.length === 0 && (
              <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--gray-300)', fontSize: 12, border: '2px dashed var(--gray-200)', borderRadius: 6, marginBottom: 14 }}>
                Arraste um card para esta coluna
              </div>
            )}
            {col1.map(card => (
              <DashCard
                key={card.id}
                id={card.id}
                title={card.title}
                icon={card.icon}
                dragging={dragId.current === card.id}
                onDragStart={e => onDragStart(e, card.id)}
              >
                {card.content}
              </DashCard>
            ))}
          </div>

          {/* Coluna 2 */}
          {colMode === '2' && (
            <div
              onDragOver={e => e.preventDefault()}
              onDrop={e => onDrop(e, 1)}
              style={{ paddingLeft: 7, minHeight: 100 }}
            >
              {col2.length === 0 && (
                <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--gray-300)', fontSize: 12, border: '2px dashed var(--gray-200)', borderRadius: 6, marginBottom: 14 }}>
                  Arraste um card para esta coluna
                </div>
              )}
              {col2.map(card => (
                <DashCard
                  key={card.id}
                  id={card.id}
                  title={card.title}
                  icon={card.icon}
                  dragging={dragId.current === card.id}
                  onDragStart={e => onDragStart(e, card.id)}
                >
                  {card.content}
                </DashCard>
              ))}
            </div>
          )}
        </div>
        </div>
      )}

      {activeView === 'conta' && <MinhaConta />}

      {activeView === 'comunidade' && (
        <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--gray-400)', fontSize: 14 }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🌐</div>
          Em breve.
        </div>
      )}
    </div>
  );
}

/* ─── Estilos de tabela ─── */
const thStyle: React.CSSProperties = {
  background: 'var(--gray-50)',
  color: 'var(--gray-500)',
  fontWeight: 600,
  padding: '7px 10px',
  textAlign: 'left',
  borderBottom: '1px solid var(--gray-200)',
  fontSize: 11,
  whiteSpace: 'nowrap',
};

const tdStyle: React.CSSProperties = {
  padding: '7px 10px',
  borderBottom: '1px solid var(--gray-100)',
  color: 'var(--gray-500)',
  fontSize: 11.5,
};
