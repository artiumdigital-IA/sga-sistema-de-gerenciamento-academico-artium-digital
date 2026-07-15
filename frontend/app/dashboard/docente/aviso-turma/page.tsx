'use client';
import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';

interface Oferta {
  id: string;
  disciplina: { nome: string; codigo: string };
  periodoLetivo: { ano: number; semestre: string };
  turno: string;
  _count: { matriculas: number };
}
interface AvisoTurma {
  id: string; titulo: string; texto: string; tag: string; criadoEm: string;
  oferta: { disciplina: { nome: string; codigo: string } } | null;
}

const TAGS = [
  { value: 'GERAL', label: 'Geral' },
  { value: 'IMPORTANTE', label: 'Importante' },
];

const BTN_P: React.CSSProperties = { padding: '8px 18px', borderRadius: 5, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, background: '#1a56db', color: '#fff' };
const INPUT: React.CSSProperties = { padding: '7px 10px', borderRadius: 5, border: '1px solid var(--gray-300)', fontSize: 13, boxSizing: 'border-box' };

export default function AvisoTurmaPage() {
  const [ofertas, setOfertas] = useState<Oferta[]>([]);
  const [ofertaId, setOfertaId] = useState('');
  const [titulo, setTitulo] = useState('');
  const [texto, setTexto] = useState('');
  const [tag, setTag] = useState('GERAL');
  const [enviados, setEnviados] = useState<AvisoTurma[]>([]);
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  async function carregar() {
    try {
      const [os, avs] = await Promise.all([
        apiFetch<Oferta[]>('/docente/ofertas'),
        apiFetch<AvisoTurma[]>('/docente/aviso-turma'),
      ]);
      setOfertas(os); setEnviados(avs);
    } catch (e: any) { setErro(e.message ?? 'Erro ao carregar'); }
    finally { setLoading(false); }
  }

  useEffect(() => { carregar(); }, []);

  async function enviar() {
    if (!ofertaId || !titulo.trim() || !texto.trim()) { setErro('Preencha turma, título e texto.'); return; }
    setErro(''); setSucesso(''); setEnviando(true);
    try {
      const resultado = await apiFetch<{ push: { destinatarios: number } }>('/docente/aviso-turma', {
        method: 'POST',
        body: JSON.stringify({ ofertaId, titulo, texto, tag }),
      });
      setSucesso(`Aviso enviado! Push notification disparado para ${resultado.push.destinatarios} dispositivo(s) com o app instalado.`);
      setTitulo(''); setTexto('');
      await carregar();
    } catch (e: any) { setErro(e.message ?? 'Erro ao enviar aviso'); }
    finally { setEnviando(false); }
  }

  if (loading) return <div style={{ padding: 24, color: 'var(--gray-500)', fontSize: 13 }}>Carregando...</div>;

  return (
    <div style={{ padding: '24px 28px', maxWidth: 720 }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700 }}>Aviso para Turma</h1>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--gray-500)' }}>
          Envia um aviso só pros alunos matriculados na turma escolhida — quem tem o app instalado recebe também uma notificação push no celular.
        </p>
      </div>

      <div style={{ background: 'var(--white)', border: '1px solid var(--gray-200)', borderRadius: 8, padding: 20, marginBottom: 20 }}>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-700)', display: 'block', marginBottom: 4 }}>Turma</label>
          <select style={{ ...INPUT, width: '100%' }} value={ofertaId} onChange={e => setOfertaId(e.target.value)}>
            <option value="">Selecione a turma</option>
            {ofertas.map(o => (
              <option key={o.id} value={o.id}>
                {o.disciplina.codigo} - {o.disciplina.nome} ({o.periodoLetivo.ano}/{o.periodoLetivo.semestre}, {o.turno}) — {o._count.matriculas} aluno(s)
              </option>
            ))}
          </select>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-700)', display: 'block', marginBottom: 4 }}>Título</label>
          <input style={{ ...INPUT, width: '100%' }} value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ex.: Prova remarcada para sexta-feira" />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-700)', display: 'block', marginBottom: 4 }}>Texto</label>
          <textarea style={{ ...INPUT, width: '100%', minHeight: 90, resize: 'vertical', fontFamily: 'inherit' }} value={texto} onChange={e => setTexto(e.target.value)} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-700)', display: 'block', marginBottom: 4 }}>Tag</label>
          <select style={INPUT} value={tag} onChange={e => setTag(e.target.value)}>
            {TAGS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <button style={BTN_P} disabled={enviando} onClick={enviar}>{enviando ? 'Enviando...' : 'Enviar aviso'}</button>
        {erro && <p style={{ color: '#dc2626', fontSize: 12, margin: '10px 0 0' }}>{erro}</p>}
        {sucesso && <p style={{ color: '#16a34a', fontSize: 12, margin: '10px 0 0' }}>{sucesso}</p>}
      </div>

      <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 10px' }}>Avisos já enviados</h2>
      <div style={{ background: 'var(--white)', border: '1px solid var(--gray-200)', borderRadius: 8, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
              {['Turma', 'Título', 'Tag', 'Enviado em'].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--gray-700)', fontSize: 12 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {enviados.length === 0 && (
              <tr><td colSpan={4} style={{ padding: 24, textAlign: 'center', color: 'var(--gray-400)' }}>Nenhum aviso de turma enviado ainda.</td></tr>
            )}
            {enviados.map(a => (
              <tr key={a.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                <td style={{ padding: '10px 14px', color: 'var(--gray-500)', fontSize: 12 }}>{a.oferta ? `${a.oferta.disciplina.codigo} - ${a.oferta.disciplina.nome}` : '—'}</td>
                <td style={{ padding: '10px 14px' }}>{a.titulo}</td>
                <td style={{ padding: '10px 14px', fontSize: 12 }}>{a.tag}</td>
                <td style={{ padding: '10px 14px', color: 'var(--gray-500)', fontSize: 12 }}>{new Date(a.criadoEm).toLocaleDateString('pt-BR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
