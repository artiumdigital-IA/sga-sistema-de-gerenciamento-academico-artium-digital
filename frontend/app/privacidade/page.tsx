'use client';
import { useBranding } from '@/lib/branding';
import { apiFileUrl } from '@/lib/api';

const ATUALIZADO_EM = '06 de agosto de 2026';

const EMAIL_ENCARREGADO = 'contato@fiurj.edu.br';

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 28 }}>
      <h2 style={{ fontSize: 17, fontWeight: 700, color: '#1C3A6B', marginBottom: 10 }}>{titulo}</h2>
      <div style={{ fontSize: 14, lineHeight: 1.75, color: '#374151' }}>{children}</div>
    </section>
  );
}

export default function PrivacidadePage() {
  const branding = useBranding();
  const logoUrl = apiFileUrl(branding.logoUrl);
  const nome = branding.nomeInstituicao || 'FIURJ';
  const nomeCompleto = branding.nomeCompleto || nome;

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6', padding: '48px 16px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ maxWidth: 760, margin: '0 auto', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '40px 36px' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 6 }}>
          {logoUrl && <img src={logoUrl} alt={nome} style={{ height: 40, objectFit: 'contain' }} />}
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.4 }}>
              {nomeCompleto}
            </div>
          </div>
        </div>

        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#111827', marginTop: 18, marginBottom: 6 }}>
          Política de Privacidade
        </h1>
        <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 32 }}>
          Última atualização: {ATUALIZADO_EM}
        </p>

        <p style={{ fontSize: 14, lineHeight: 1.75, color: '#374151', marginBottom: 28 }}>
          Esta Política de Privacidade descreve como a {nome} coleta, usa, armazena e protege os
          dados pessoais de alunos, professores e demais usuários da Plataforma Acadêmica {nome}
          (portal web e aplicativo móvel), em conformidade com a Lei Geral de Proteção de Dados
          Pessoais (Lei nº 13.709/2018 — LGPD).
        </p>

        <Secao titulo="1. Quem somos">
          A {nomeCompleto} é a instituição responsável pelo tratamento dos dados pessoais coletados
          por meio desta plataforma, atuando como controladora dos dados nos termos da LGPD.
        </Secao>

        <Secao titulo="2. Quais dados coletamos">
          <p style={{ marginBottom: 10 }}>Dependendo do seu vínculo com a instituição (aluno, professor, candidato ou colaborador), podemos coletar:</p>
          <ul style={{ paddingLeft: 20, marginBottom: 10 }}>
            <li><strong>Dados de identificação e cadastro:</strong> nome, CPF, RG, data de nascimento, sexo, naturalidade, nacionalidade, endereço, telefone, e-mail, fotografia.</li>
            <li><strong>Dados acadêmicos:</strong> RA, curso, matrícula, disciplinas, notas, frequência, histórico escolar, situação de vínculo, forma de ingresso.</li>
            <li><strong>Dados financeiros:</strong> contratos de matrícula, parcelas, boletos, comprovantes de pagamento.</li>
            <li><strong>Dados exigidos por regulação educacional (Censo da Educação Superior/INEP):</strong> cor/raça, deficiência, titulação e regime de trabalho docente, entre outros campos exigidos pelo MEC.</li>
            <li><strong>Dados de acesso e uso:</strong> registros de login, endereço IP e informações do dispositivo, para fins de segurança e auditoria.</li>
          </ul>
        </Secao>

        <Secao titulo="3. Como e por que usamos seus dados">
          <p>Utilizamos os dados coletados para: gerenciar matrícula, notas, frequência e histórico
          escolar; emitir documentos acadêmicos (declarações, boletins, históricos, carteirinha);
          processar cobranças e pagamentos; cumprir obrigações legais e regulatórias perante o MEC/INEP;
          viabilizar comunicação institucional (avisos, mensagens); e garantir a segurança da
          plataforma.</p>
        </Secao>

        <Secao titulo="4. Base legal">
          <p>O tratamento dos dados pessoais nesta plataforma se baseia, conforme o caso, em: execução
          de contrato educacional do qual o titular é parte; cumprimento de obrigação legal ou
          regulatória (incluindo prestação de informações ao Censo da Educação Superior/INEP);
          exercício regular de direitos em processo administrativo; e, quando aplicável, consentimento
          do titular.</p>
        </Secao>

        <Secao titulo="5. Com quem compartilhamos">
          <p>Seus dados podem ser compartilhados com: órgãos governamentais de regulação do ensino
          superior (MEC/INEP), quando exigido por lei; instituições financeiras e bancárias, para
          processamento de cobranças (emissão e liquidação de boletos); e prestadores de serviço que
          apoiam a operação da plataforma (ex.: hospedagem), sempre sob obrigação de confidencialidade.
          A {nome} não vende dados pessoais a terceiros.</p>
        </Secao>

        <Secao titulo="6. Segurança das informações">
          <p>Adotamos medidas técnicas e administrativas para proteger os dados pessoais, incluindo:
          conexão criptografada (HTTPS) entre aplicativo/portal e nossos servidores; controle de acesso
          por perfil de usuário; autenticação multifator para perfis administrativos; e registro de
          auditoria das operações realizadas sobre dados pessoais.</p>
        </Secao>

        <Secao titulo="7. Por quanto tempo guardamos seus dados">
          <p>Os dados acadêmicos (histórico escolar) são mantidos de forma permanente, conforme exigido
          pela legislação educacional. Os demais dados pessoais são mantidos pelo período necessário ao
          cumprimento da finalidade para a qual foram coletados e das obrigações legais aplicáveis,
          sendo eliminados ou anonimizados após esse período, quando cabível.</p>
        </Secao>

        <Secao titulo="8. Seus direitos como titular de dados">
          <p style={{ marginBottom: 10 }}>Nos termos do art. 18 da LGPD, você pode solicitar, a qualquer momento:</p>
          <ul style={{ paddingLeft: 20 }}>
            <li>Confirmação da existência de tratamento e acesso aos seus dados;</li>
            <li>Correção de dados incompletos, inexatos ou desatualizados;</li>
            <li>Anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em desconformidade com a lei;</li>
            <li>Portabilidade dos dados a outro fornecedor de serviço;</li>
            <li>Informação sobre com quem seus dados são compartilhados;</li>
            <li>Revogação do consentimento, quando o tratamento se basear nele.</li>
          </ul>
        </Secao>

        <Secao titulo="9. Aplicativo móvel">
          <p>O aplicativo {nome} Aluno acessa apenas os dados necessários para exibir suas informações
          acadêmicas e financeiras, autenticando-se com suas credenciais institucionais. O aplicativo
          pode solicitar permissão de acesso a arquivos/câmera do dispositivo exclusivamente para
          funcionalidades explícitas, como anexar documentos.</p>
        </Secao>

        <Secao titulo="10. Alterações nesta política">
          <p>Esta política pode ser atualizada periodicamente para refletir mudanças legais ou na
          própria plataforma. A data da última atualização está indicada no topo desta página.</p>
        </Secao>

        <Secao titulo="11. Contato do Encarregado de Dados (DPO)">
          <p>Para exercer seus direitos ou esclarecer dúvidas sobre o tratamento de dados pessoais,
          entre em contato com o Encarregado de Proteção de Dados da {nome} pelo e-mail:{' '}
          <a href={`mailto:${EMAIL_ENCARREGADO}`} style={{ color: '#1C3A6B', fontWeight: 600 }}>
            {EMAIL_ENCARREGADO}
          </a>.</p>
        </Secao>

      </div>
    </div>
  );
}
