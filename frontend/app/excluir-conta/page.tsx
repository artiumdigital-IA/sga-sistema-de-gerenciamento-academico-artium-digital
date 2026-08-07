'use client';
import { useBranding } from '@/lib/branding';
import { apiFileUrl } from '@/lib/api';

const EMAIL_SOLICITACAO = 'contato@fiurj.edu.br';

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 28 }}>
      <h2 style={{ fontSize: 17, fontWeight: 700, color: '#1C3A6B', marginBottom: 10 }}>{titulo}</h2>
      <div style={{ fontSize: 14, lineHeight: 1.75, color: '#374151' }}>{children}</div>
    </section>
  );
}

export default function ExcluirContaPage() {
  const branding = useBranding();
  const logoUrl = apiFileUrl(branding.logoUrl);
  const nome = branding.nomeInstituicao || 'FIURJ';
  const nomeCompleto = branding.nomeCompleto || nome;

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6', padding: '48px 16px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ maxWidth: 760, margin: '0 auto', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '40px 36px' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 6 }}>
          {logoUrl && <img src={logoUrl} alt={nome} style={{ height: 40, objectFit: 'contain' }} />}
          <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.4 }}>
            {nomeCompleto}
          </div>
        </div>

        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#111827', marginTop: 18, marginBottom: 28 }}>
          Solicitar exclusão de conta e dados
        </h1>

        <Secao titulo="Como solicitar">
          <p>
            Para solicitar a exclusão da sua conta e dos dados pessoais associados a ela na Plataforma
            Acadêmica {nome} (portal web e aplicativo {nome} Aluno), envie um e-mail para{' '}
            <a href={`mailto:${EMAIL_SOLICITACAO}`} style={{ color: '#1C3A6B', fontWeight: 600 }}>
              {EMAIL_SOLICITACAO}
            </a>{' '}
            com o assunto <strong>&quot;Solicitação de exclusão de conta&quot;</strong>, informando:
          </p>
          <ul style={{ paddingLeft: 20, marginTop: 10 }}>
            <li>Nome completo;</li>
            <li>RA (Registro Acadêmico) ou matrícula;</li>
            <li>CPF;</li>
            <li>E-mail cadastrado na plataforma.</li>
          </ul>
        </Secao>

        <Secao titulo="Como o pedido é processado">
          <p>
            A solicitação é analisada e processada pela Secretaria Acadêmica da {nome}, que confirma a
            identidade do solicitante antes de executar a exclusão. O prazo de resposta é de até 30 dias
            corridos a partir do recebimento do pedido.
          </p>
        </Secao>

        <Secao titulo="Quais dados são excluídos">
          <p>
            São excluídos ou anonimizados os dados de identificação e acesso (login, telefone, endereço,
            fotografia) que não sejam exigidos por obrigação legal.
          </p>
        </Secao>

        <Secao titulo="Quais dados são mantidos, mesmo após a exclusão">
          <p>
            Por exigência da legislação educacional, o <strong>histórico escolar</strong> (disciplinas
            cursadas, notas, frequência e situação de vínculo) é mantido de forma permanente, mesmo após a
            exclusão da conta de acesso — essa retenção é obrigatória para todas as instituições de
            ensino superior no Brasil e independe da vontade do titular. Da mesma forma, registros
            financeiros e documentos exigidos por obrigações fiscais/regulatórias são mantidos pelo prazo
            legal aplicável. Mais detalhes em nossa{' '}
            <a href="/privacidade" style={{ color: '#1C3A6B', fontWeight: 600 }}>Política de Privacidade</a>.
          </p>
        </Secao>

        <Secao titulo="Efeito da exclusão">
          <p>
            Após a exclusão, o acesso à conta (portal web e aplicativo) é encerrado e os dados de login
            deixam de estar disponíveis. Documentos acadêmicos oficiais (histórico, declarações) continuam
            podendo ser solicitados diretamente à Secretaria Acadêmica, por serem parte do registro
            permanente exigido por lei.
          </p>
        </Secao>

      </div>
    </div>
  );
}
