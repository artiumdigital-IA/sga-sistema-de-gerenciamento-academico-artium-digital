'use client';
import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';

interface StatusData {
  backend: {
    nodeVersion: string; ambiente: string; uptimeSegundos: number;
    memoria: { rss: number; heapUsed: number; heapTotal: number };
    cpu: { percentualUmNucleo: number | null; userMs: number; systemMs: number; janelaMs: number };
  };
  sistemaOperacional: {
    hostname: string; plataforma: string; arquitetura: string; cpus: number;
    loadAverage: number[]; memoriaTotalBytes: number; memoriaLivreBytes: number; memoriaUsadaPercentual: number | null;
  };
  disco: { totalBytes: number; livreBytes: number; usadoBytes: number; usadoPercentual: number | null } | null;
  uploads: { porPasta: { pasta: string; arquivos: number; bytes: number }[]; totalArquivos: number; totalBytes: number };
  banco: {
    conectado: boolean; latenciaMs: number | null; versao: string | null;
    tamanhoBytes: number | null; conexoesAtivas: number | null; erro?: string;
  };
  contagens: {
    alunos: number; professores: number; cursos: number; disciplinas: number; ofertas: number; matriculas: number;
    usuarios: number; protocolos: number; ocorrencias: number; mensagens: number; requerimentos: number;
    processosSeletivos: number; candidatos: number; contratos: number; avisos: number; auditoriasTotais: number;
    usuariosPorPerfil: { perfil: string; total: number }[];
    usuariosPorStatus: { status: string; total: number }[];
  };
  login: {
    recentes: { id: string; acao: string; criadoEm: string; usuario: { email: string } | null; dadosDepois: any }[];
    falhas24h: number;
    sucessos24h: number;
  };
  sessoes: {
    totalLogados: number;
    totalUsuarios: number;
    janelaSessaoMs: number;
    usuarios: {
      id: string; nome: string | null; email: string; perfil: string;
      logado: boolean; ultimoLogin: string | null; tempoLogadoSegundos: number | null;
    }[];
  };
  auditoriaRecente: { id: string; acao: string; entidade: string; entidadeId: string | null; criadoEm: string; usuario: { email: string; nome?: string | null } | null }[];
  geradoEm: string;
}

function formatBytes(bytes: number | null | undefined): string {
  if (bytes == null) return '—';
  if (bytes === 0) return '0 B';
  const unidades = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), unidades.length - 1);
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${unidades[i]}`;
}
function formatUptime(segundos: number): string {
  const d = Math.floor(segundos / 86400);
  const h = Math.floor((segundos % 86400) / 3600);
  const m = Math.floor((segundos % 3600) / 60);
  const partes = [];
  if (d > 0) partes.push(`${d}d`);
  if (h > 0 || d > 0) partes.push(`${h}h`);
  partes.push(`${m}min`);
  return partes.join(' ');
}

const PASTA_LABEL: Record<string, string> = { avatars: 'Fotos de perfil', documentos: 'Documentos de alunos' };
const PERFIL_LABEL: Record<string, string> = {
  ADMIN: 'Admin', SECRETARIA: 'Secretaria', FINANCEIRO: 'Financeiro', PROFESSOR: 'Professor', ALUNO: 'Aluno',
};
const LOGIN_MOTIVO_LABEL: Record<string, string> = {
  usuario_nao_encontrado: 'e-mail não cadastrado', usuario_inativo_ou_bloqueado: 'usuário inativo/bloqueado',
  senha_invalida: 'senha inválida', mfa_ausente: 'MFA não informado', mfa_invalido: 'código MFA inválido',
};

const CARD: React.CSSProperties = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 16 };
const TITLE: React.CSSProperties = { margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: '#374151', display: 'flex', alignItems: 'center', gap: 6 };
const ROW: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', fontSize: 12.5, padding: '4px 0', color: '#374151' };
const LABEL: React.CSSProperties = { color: '#6b7280' };

function Barra({ percentual, cor = '#1a56db' }: { percentual: number | null; cor?: string }) {
  if (percentual == null) return null;
  const c = percentual > 90 ? '#dc2626' : percentual > 75 ? '#d97706' : cor;
  return (
    <div style={{ height: 6, background: '#f3f4f6', borderRadius: 3, overflow: 'hidden', marginTop: 6 }}>
      <div style={{ height: '100%', width: `${Math.min(percentual, 100)}%`, background: c, borderRadius: 3 }} />
    </div>
  );
}

function Dot({ ok }: { ok: boolean }) {
  return <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: ok ? '#22c55e' : '#dc2626' }} />;
}

const CONTAGEM_LABELS: [keyof StatusData['contagens'], string][] = [
  ['alunos', 'Alunos'], ['professores', 'Professores'], ['cursos', 'Cursos'], ['disciplinas', 'Disciplinas'],
  ['ofertas', 'Ofertas'], ['matriculas', 'Matrículas'], ['usuarios', 'Usuários'], ['protocolos', 'Protocolos'],
  ['ocorrencias', 'Ocorrências'], ['mensagens', 'Mensagens'], ['requerimentos', 'Requerimentos'],
  ['processosSeletivos', 'Processos Seletivos'], ['candidatos', 'Candidatos'], ['contratos', 'Contratos'],
  ['avisos', 'Avisos'], ['auditoriasTotais', 'Registros de Auditoria'],
];

export default function PainelSistemaPage() {
  const [data, setData] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<Date | null>(null);

  const carregar = useCallback(async () => {
    setErro('');
    try {
      const d = await apiFetch<StatusData>('/sistema/status');
      setData(d);
      setUltimaAtualizacao(new Date());
    } catch (e: any) {
      setErro(e.message ?? 'Erro ao carregar status do sistema (verifique se você é Admin)');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregar();
    const id = setInterval(carregar, 20000);
    return () => clearInterval(id);
  }, [carregar]);

  if (loading) return <div style={{ padding: 28, color: '#6b7280' }}>Carregando painel do sistema...</div>;
  if (erro) return <div style={{ padding: 28, color: '#dc2626' }}>{erro}</div>;
  if (!data) return null;

  return (
    <div style={{ padding: '24px 28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700 }}>Painel do Sistema</h1>
          <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>
            Verificação geral: backend, VPS/SO, disco, banco de dados e volume de dados. Atualiza a cada 20s.
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          {ultimaAtualizacao && <p style={{ margin: '0 0 6px', fontSize: 11, color: '#9ca3af' }}>Atualizado {ultimaAtualizacao.toLocaleTimeString('pt-BR')}</p>}
          <button onClick={carregar} style={{ padding: '6px 14px', borderRadius: 5, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', fontSize: 12 }}>
            ↻ Atualizar agora
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 16 }}>
        {/* Backend */}
        <div style={CARD}>
          <h3 style={TITLE}>Backend</h3>
          <div style={ROW}><span style={LABEL}>Status</span><span><Dot ok={true} /> Online</span></div>
          <div style={ROW}><span style={LABEL}>Ambiente</span><span>{data.backend.ambiente}</span></div>
          <div style={ROW}><span style={LABEL}>Node.js</span><span>{data.backend.nodeVersion}</span></div>
          <div style={ROW}><span style={LABEL}>Uptime</span><span>{formatUptime(data.backend.uptimeSegundos)}</span></div>
          <div style={ROW}><span style={LABEL}>CPU (processo)</span><span>{data.backend.cpu.percentualUmNucleo != null ? `${data.backend.cpu.percentualUmNucleo}%` : '—'}</span></div>
          <Barra percentual={data.backend.cpu.percentualUmNucleo} />
          <div style={{ ...ROW, marginTop: 6 }}><span style={LABEL}>Memória (RSS)</span><span>{formatBytes(data.backend.memoria.rss)}</span></div>
          <div style={ROW}><span style={LABEL}>Heap usado</span><span>{formatBytes(data.backend.memoria.heapUsed)} / {formatBytes(data.backend.memoria.heapTotal)}</span></div>
        </div>

        {/* SO / VPS */}
        <div style={CARD}>
          <h3 style={TITLE}>Servidor (VPS)</h3>
          <div style={ROW}><span style={LABEL}>Host</span><span>{data.sistemaOperacional.hostname}</span></div>
          <div style={ROW}><span style={LABEL}>Plataforma</span><span>{data.sistemaOperacional.plataforma} ({data.sistemaOperacional.arquitetura})</span></div>
          <div style={ROW}><span style={LABEL}>CPUs</span><span>{data.sistemaOperacional.cpus}</span></div>
          <div style={ROW}><span style={LABEL}>Load average</span><span>{data.sistemaOperacional.loadAverage.map(n => n.toFixed(2)).join(' / ')}</span></div>
          <div style={ROW}><span style={LABEL}>Memória</span><span>{formatBytes(data.sistemaOperacional.memoriaTotalBytes - data.sistemaOperacional.memoriaLivreBytes)} / {formatBytes(data.sistemaOperacional.memoriaTotalBytes)}</span></div>
          <Barra percentual={data.sistemaOperacional.memoriaUsadaPercentual} />
        </div>

        {/* Disco */}
        <div style={CARD}>
          <h3 style={TITLE}>Disco</h3>
          {data.disco ? (
            <>
              <div style={ROW}><span style={LABEL}>Usado</span><span>{formatBytes(data.disco.usadoBytes)} / {formatBytes(data.disco.totalBytes)}</span></div>
              <div style={ROW}><span style={LABEL}>Livre</span><span>{formatBytes(data.disco.livreBytes)}</span></div>
              <div style={ROW}><span style={LABEL}>% usado</span><span>{data.disco.usadoPercentual ?? '—'}%</span></div>
              <Barra percentual={data.disco.usadoPercentual} />
            </>
          ) : <p style={{ fontSize: 12, color: '#9ca3af' }}>Não foi possível ler o disco.</p>}
        </div>

        {/* Banco de dados */}
        <div style={CARD}>
          <h3 style={TITLE}>Banco de Dados</h3>
          <div style={ROW}><span style={LABEL}>Status</span><span><Dot ok={data.banco.conectado} /> {data.banco.conectado ? 'Conectado' : 'Falha'}</span></div>
          <div style={ROW}><span style={LABEL}>Latência</span><span>{data.banco.latenciaMs != null ? `${data.banco.latenciaMs} ms` : '—'}</span></div>
          <div style={ROW}><span style={LABEL}>Tamanho</span><span>{formatBytes(data.banco.tamanhoBytes)}</span></div>
          <div style={ROW}><span style={LABEL}>Conexões ativas</span><span>{data.banco.conexoesAtivas ?? '—'}</span></div>
          <p style={{ fontSize: 10.5, color: '#9ca3af', margin: '8px 0 0', lineHeight: 1.4 }}>{data.banco.versao ?? data.banco.erro ?? ''}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14, marginBottom: 16 }}>
        {/* Contagens de dados */}
        <div style={CARD}>
          <h3 style={TITLE}>Volume de Dados</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {CONTAGEM_LABELS.map(([key, label]) => (
              <div key={key} style={{ textAlign: 'center', padding: '10px 4px', background: '#f9fafb', borderRadius: 6 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#1a56db' }}>{data.contagens[key] as number}</div>
                <div style={{ fontSize: 10.5, color: '#6b7280' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Usuários por perfil/status */}
        <div style={CARD}>
          <h3 style={TITLE}>Usuários</h3>
          <p style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', margin: '0 0 4px' }}>Por perfil</p>
          {data.contagens.usuariosPorPerfil.map(u => (
            <div key={u.perfil} style={ROW}><span style={LABEL}>{u.perfil}</span><span>{u.total}</span></div>
          ))}
          <p style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', margin: '10px 0 4px' }}>Por status</p>
          {data.contagens.usuariosPorStatus.map(u => (
            <div key={u.status} style={ROW}><span style={LABEL}>{u.status}</span><span>{u.total}</span></div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 16 }}>
        {/* Uploads */}
        <div style={CARD}>
          <h3 style={TITLE}>Armazenamento de Uploads</h3>
          <div style={ROW}><span style={LABEL}>Total</span><span style={{ fontWeight: 600 }}>{formatBytes(data.uploads.totalBytes)} ({data.uploads.totalArquivos} arquivo{data.uploads.totalArquivos !== 1 ? 's' : ''})</span></div>
          {data.uploads.porPasta.map(p => (
            <div key={p.pasta} style={ROW}>
              <span style={LABEL}>{PASTA_LABEL[p.pasta] ?? p.pasta}</span>
              <span>{formatBytes(p.bytes)} · {p.arquivos} arq.</span>
            </div>
          ))}
        </div>

        {/* Segurança / Login */}
        <div style={CARD}>
          <h3 style={TITLE}>Segurança — Login</h3>
          <div style={{ display: 'flex', gap: 16, marginBottom: 8 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: data.login.falhas24h > 0 ? '#dc2626' : '#374151' }}>{data.login.falhas24h}</div>
              <div style={{ fontSize: 10.5, color: '#6b7280' }}>Falhas (24h)</div>
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#065f46' }}>{data.login.sucessos24h}</div>
              <div style={{ fontSize: 10.5, color: '#6b7280' }}>Sucessos (24h)</div>
            </div>
          </div>
          <div style={{ maxHeight: 150, overflowY: 'auto' }}>
            {data.login.recentes.length === 0 && <p style={{ fontSize: 11, color: '#9ca3af' }}>Nenhum evento de login ainda.</p>}
            {data.login.recentes.map(l => {
              const ok = l.acao === 'LOGIN';
              const email = l.usuario?.email ?? l.dadosDepois?.email ?? '—';
              const motivo = !ok ? (LOGIN_MOTIVO_LABEL[l.dadosDepois?.motivo] ?? l.dadosDepois?.motivo) : null;
              return (
                <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, padding: '3px 0', borderBottom: '1px solid #f3f4f6' }}>
                  <span style={{ color: ok ? '#065f46' : '#991b1b' }}>{ok ? '✓' : '✗'} {email}{motivo ? ` — ${motivo}` : ''}</span>
                  <span style={{ color: '#9ca3af', flexShrink: 0, marginLeft: 8 }}>{new Date(l.criadoEm).toLocaleTimeString('pt-BR')}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Usuários Logados */}
        <div style={CARD}>
          <h3 style={TITLE}>Usuários Logados</h3>
          <div style={{ display: 'flex', gap: 16, marginBottom: 8 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#065f46' }}>{data.sessoes.totalLogados}</div>
              <div style={{ fontSize: 10.5, color: '#6b7280' }}>Logados agora</div>
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#374151' }}>{data.sessoes.totalUsuarios}</div>
              <div style={{ fontSize: 10.5, color: '#6b7280' }}>Usuários ativos</div>
            </div>
          </div>
          <div style={{ maxHeight: 150, overflowY: 'auto' }}>
            {data.sessoes.usuarios.length === 0 && <p style={{ fontSize: 11, color: '#9ca3af' }}>Nenhum usuário ativo.</p>}
            {data.sessoes.usuarios.map(u => (
              <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11.5, padding: '3px 0', borderBottom: '1px solid #f3f4f6', gap: 8 }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  <Dot ok={u.logado} /> {u.nome || u.email} <span style={{ color: '#9ca3af' }}>· {PERFIL_LABEL[u.perfil] ?? u.perfil}</span>
                </span>
                <span style={{ flexShrink: 0, color: u.logado ? '#065f46' : '#9ca3af' }}>
                  {u.logado
                    ? `há ${formatUptime(u.tempoLogadoSegundos ?? 0)}`
                    : u.ultimoLogin
                      ? `últ.: ${new Date(u.ultimoLogin).toLocaleDateString('pt-BR')} ${new Date(u.ultimoLogin).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
                      : 'nunca logou'}
                </span>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 10, color: '#9ca3af', margin: '8px 0 0', lineHeight: 1.4 }}>
            Aproximação: sem sessão no servidor (JWT puro), "logado" = fez login há menos tempo que a validade
            do token. Não detecta logout manual antes do token expirar.
          </p>
        </div>
      </div>

      {/* Auditoria recente */}
      <div style={CARD}>
        <h3 style={TITLE}>Auditoria Recente</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
              {['Data/Hora', 'Usuário', 'Ação', 'Entidade'].map(h => (
                <th key={h} style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 600, color: '#6b7280', fontSize: 11 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.auditoriaRecente.length === 0 && (
              <tr><td colSpan={4} style={{ padding: 16, textAlign: 'center', color: '#9ca3af' }}>Sem registros ainda.</td></tr>
            )}
            {data.auditoriaRecente.map(a => (
              <tr key={a.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '6px 10px', color: '#6b7280' }}>{new Date(a.criadoEm).toLocaleString('pt-BR')}</td>
                <td style={{ padding: '6px 10px' }}>{a.usuario?.email ?? '— (sistema)'}</td>
                <td style={{ padding: '6px 10px' }}>{a.acao}</td>
                <td style={{ padding: '6px 10px' }}>{a.entidade}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
