/**
 * telas-sistema.ts — inventário canônico de "telas" do sistema pra matriz de
 * permissões por perfil.
 *
 * IMPORTANTE: existe uma cópia idêntica em
 * frontend/lib/telas-sistema.ts (mesmo padrão de duplicação intencional já
 * usado no projeto pra calculo de CR/integralização — ver comentário em
 * documento.service.ts). Se adicionar/remover uma tela aqui, replica lá.
 *
 * `chave` é o identificador estável gravado em PermissaoTela.chaveTela — nunca
 * reaproveitar uma chave pra outra tela nem renomear sem migrar os dados.
 * `prefixos` são os paths de rota (frontend, sob /dashboard) cobertos por essa
 * tela — usado tanto pra decidir se um link de menu aparece quanto (no
 * frontend) pra bloquear acesso direto por URL. Um prefixo cobre também suas
 * subrotas (ex: "/dashboard/academico/alunos" cobre ".../alunos/xxx/historico").
 */
export type TelaSistema = {
  chave: string;
  label: string;
  grupo: string;
  prefixos: string[];
};

export const TELAS_SISTEMA: TelaSistema[] = [
  // ── Acadêmico ────────────────────────────────────────────────────────
  { chave: 'cursos', label: 'Cursos', grupo: 'Acadêmico', prefixos: ['/dashboard/academico/cursos'] },
  { chave: 'matrizes', label: 'Matrizes Curriculares', grupo: 'Acadêmico', prefixos: ['/dashboard/academico/matrizes'] },
  { chave: 'disciplinas', label: 'Disciplinas', grupo: 'Acadêmico', prefixos: ['/dashboard/academico/disciplinas'] },
  { chave: 'periodos', label: 'Períodos Letivos', grupo: 'Acadêmico', prefixos: ['/dashboard/academico/periodos'] },
  { chave: 'unidades', label: 'Unidades de Ensino', grupo: 'Acadêmico', prefixos: ['/dashboard/academico/unidades'] },
  {
    chave: 'alunos', label: 'Alunos', grupo: 'Acadêmico',
    prefixos: [
      '/dashboard/academico/alunos',
      '/dashboard/academico/saude',
      '/dashboard/academico/situacao',
      '/dashboard/academico/historico',
      '/dashboard/academico/documentos',
      '/dashboard/academico/equiparacoes',
      '/dashboard/financeiro/observacoes',
    ],
  },
  { chave: 'professores', label: 'Professores', grupo: 'Acadêmico', prefixos: ['/dashboard/academico/professores'] },
  { chave: 'ofertas', label: 'Ofertas / Turmas', grupo: 'Acadêmico', prefixos: ['/dashboard/academico/ofertas'] },
  { chave: 'matriculas', label: 'Matrículas', grupo: 'Acadêmico', prefixos: ['/dashboard/academico/matriculas'] },
  { chave: 'notas', label: 'Lançamento de Notas', grupo: 'Acadêmico', prefixos: ['/dashboard/academico/notas'] },
  { chave: 'frequencia', label: 'Frequência', grupo: 'Acadêmico', prefixos: ['/dashboard/academico/frequencia'] },
  { chave: 'pauta', label: 'Notas & Frequência por Pauta', grupo: 'Acadêmico', prefixos: ['/dashboard/academico/pauta'] },
  { chave: 'mapao', label: 'Mapa de Notas / Relatório', grupo: 'Acadêmico', prefixos: ['/dashboard/academico/mapao'] },
  { chave: 'ranking', label: 'Ranking de Alunos', grupo: 'Acadêmico', prefixos: ['/dashboard/academico/ranking'] },
  { chave: 'ocorrencias', label: 'Ocorrências', grupo: 'Acadêmico', prefixos: ['/dashboard/academico/ocorrencias'] },
  { chave: 'transferencia', label: 'Transferência de Turma', grupo: 'Acadêmico', prefixos: ['/dashboard/academico/transferencia'] },

  // ── Ingresso ─────────────────────────────────────────────────────────
  { chave: 'processos-seletivos', label: 'Processos Seletivos', grupo: 'Ingresso', prefixos: ['/dashboard/ingresso/processos'] },
  { chave: 'candidatos', label: 'Candidatos', grupo: 'Ingresso', prefixos: ['/dashboard/ingresso/candidatos'] },

  // ── Secretaria ───────────────────────────────────────────────────────
  { chave: 'requerimentos', label: 'Requerimentos', grupo: 'Secretaria', prefixos: ['/dashboard/secretaria/requerimentos'] },
  { chave: 'documentos', label: 'Documentos (declaração, boletim, carteirinha...)', grupo: 'Secretaria', prefixos: ['/dashboard/secretaria/documentos'] },
  { chave: 'certificados', label: 'Gerador de Certificado', grupo: 'Secretaria', prefixos: ['/dashboard/secretaria/certificados'] },
  { chave: 'avisos', label: 'Avisos', grupo: 'Secretaria', prefixos: ['/dashboard/secretaria/avisos'] },
  { chave: 'mensagens', label: 'Mensagens', grupo: 'Secretaria', prefixos: ['/dashboard/secretaria/mensagens'] },
  { chave: 'protocolos', label: 'Protocolos', grupo: 'Secretaria', prefixos: ['/dashboard/secretaria/protocolos'] },
  { chave: 'tipos-protocolo', label: 'Tipos de Protocolo', grupo: 'Secretaria', prefixos: ['/dashboard/secretaria/tipos-protocolo'] },
  { chave: 'motivos-ocorrencia', label: 'Motivos de Ocorrência', grupo: 'Secretaria', prefixos: ['/dashboard/secretaria/motivos-ocorrencia'] },
  { chave: 'motivos-transferencia', label: 'Motivos de Transferência', grupo: 'Secretaria', prefixos: ['/dashboard/secretaria/motivos-transferencia'] },
  { chave: 'provas-geradas', label: 'Provas Geradas', grupo: 'Secretaria', prefixos: ['/dashboard/secretaria/provas-geradas', '/dashboard/provas-geradas'] },

  // ── Financeiro ───────────────────────────────────────────────────────
  { chave: 'contratos', label: 'Contratos / Mensalidades', grupo: 'Financeiro', prefixos: ['/dashboard/financeiro/contratos'] },
  { chave: 'receitas', label: 'Receitas', grupo: 'Financeiro', prefixos: ['/dashboard/financeiro/receitas'] },
  { chave: 'contas-bancarias', label: 'Contas Bancárias', grupo: 'Financeiro', prefixos: ['/dashboard/financeiro/contas-bancarias'] },
  { chave: 'cnab-boletos', label: 'Boletos (CNAB)', grupo: 'Financeiro', prefixos: ['/dashboard/financeiro/cnab/boletos'] },
  { chave: 'cnab-remessas', label: 'Remessas (CNAB)', grupo: 'Financeiro', prefixos: ['/dashboard/financeiro/cnab/remessas'] },
  { chave: 'cnab-retornos', label: 'Retornos (CNAB)', grupo: 'Financeiro', prefixos: ['/dashboard/financeiro/cnab/retornos'] },

  // ── CPagar (Contas a Pagar) ──────────────────────────────────────────
  { chave: 'cpagar-colaboradores', label: 'Colaboradores', grupo: 'CPagar', prefixos: ['/dashboard/cpagar/colaboradores'] },
  { chave: 'cpagar-tabelas-imposto', label: 'Tabelas de Imposto', grupo: 'CPagar', prefixos: ['/dashboard/cpagar/tabelas-imposto'] },
  { chave: 'cpagar-folha', label: 'Folha de Pagamento', grupo: 'CPagar', prefixos: ['/dashboard/cpagar/folha'] },
  { chave: 'cpagar-prestadores', label: 'Prestadores de Serviço', grupo: 'CPagar', prefixos: ['/dashboard/cpagar/prestadores'] },
  { chave: 'cpagar-acordos', label: 'Acordos', grupo: 'CPagar', prefixos: ['/dashboard/cpagar/acordos'] },
  { chave: 'cpagar-gastos', label: 'Gastos Fixos e Variáveis', grupo: 'CPagar', prefixos: ['/dashboard/cpagar/gastos'] },

  // ── Relatórios ───────────────────────────────────────────────────────
  { chave: 'censo', label: 'Censo / INEP', grupo: 'Relatórios', prefixos: ['/dashboard/relatorios/censo'] },
  { chave: 'bolsistas', label: 'Bolsistas', grupo: 'Relatórios', prefixos: ['/dashboard/relatorios/bolsistas', '/dashboard/financeiro/bolsistas'] },
  { chave: 'relatorio-financeiro', label: 'Relatórios Financeiros', grupo: 'Relatórios', prefixos: ['/dashboard/relatorios/financeiro'] },

  // ── Administração ────────────────────────────────────────────────────
  { chave: 'usuarios', label: 'Usuários', grupo: 'Administração', prefixos: ['/dashboard/admin/usuarios'] },
  { chave: 'log', label: 'Log de Auditoria', grupo: 'Administração', prefixos: ['/dashboard/admin/log'] },
  { chave: 'sistema', label: 'Painel do Sistema', grupo: 'Administração', prefixos: ['/dashboard/admin/sistema'] },
  { chave: 'visual', label: 'Identidade Visual', grupo: 'Administração', prefixos: ['/dashboard/admin/visual'] },
  { chave: 'relatorios-master', label: 'Relatórios Master', grupo: 'Administração', prefixos: ['/dashboard/admin/relatorios-master'] },

  // ── Utilitários ──────────────────────────────────────────────────────
  { chave: 'calculadora', label: 'Calculadora', grupo: 'Utilitários', prefixos: ['/dashboard/utilitarios/calculadora'] },
  { chave: 'ramais', label: 'Ramais', grupo: 'Utilitários', prefixos: ['/dashboard/utilitarios/ramais'] },

  // ── Biblioteca (feature nova, sem equivalente no Kirsch) ────────────────
  { chave: 'biblioteca-acervo', label: 'Acervo (Livros)', grupo: 'Biblioteca', prefixos: ['/dashboard/biblioteca/livros'] },
  { chave: 'biblioteca-equipamentos', label: 'Equipamentos', grupo: 'Biblioteca', prefixos: ['/dashboard/biblioteca/equipamentos'] },
  { chave: 'biblioteca-emprestimos', label: 'Empréstimos', grupo: 'Biblioteca', prefixos: ['/dashboard/biblioteca/emprestimos'] },

  // ── Suporte / Chamados de Manutenção (Jul/2026) ─────────────────────────
  // Só as telas de GERENCIAR ficam aqui — abrir chamado e "meus chamados"
  // (`/dashboard/suporte/meus-chamados`) são autoatendimento, sem @Tela() no
  // controller (mesmo raciocínio de Mensagens/Ramais: widget sempre
  // disponível, não controlado pela matriz), então não têm chave própria.
  { chave: 'chamados-manutencao', label: 'Chamados de Manutenção (Gerenciar)', grupo: 'Suporte', prefixos: ['/dashboard/suporte/chamados'] },
  { chave: 'tipos-chamado-manutencao', label: 'Tipos de Chamado', grupo: 'Suporte', prefixos: ['/dashboard/suporte/tipos-chamado'] },

  // ── Menu Discente (autoatendimento do ALUNO — ver components/dashboard/RightPanel.tsx) ──
  // As 8 primeiras já têm dado real (aluno próprio, via /discente/*); as 8 seguintes
  // (marcadas "placeholder") ainda são só uma tela "Em construção" — o módulo de dados
  // (Horas AAC, Certificações etc.) entra depois, item por item. Todas ficam aqui pra já
  // poderem ser ativadas/desativadas por perfil na matriz de Permissões de Tela.
  { chave: 'discente-horarios', label: 'Quadro de Horários', grupo: 'Menu Discente', prefixos: ['/dashboard/discente/horarios'] },
  { chave: 'discente-documentos', label: 'Pendências de Documentos', grupo: 'Menu Discente', prefixos: ['/dashboard/discente/documentos'] },
  { chave: 'discente-protocolo', label: 'Protocolo (Abertura/Consulta)', grupo: 'Menu Discente', prefixos: ['/dashboard/discente/protocolo'] },
  { chave: 'discente-carteira', label: 'Carteira de Estudante', grupo: 'Menu Discente', prefixos: ['/dashboard/discente/carteira'] },
  { chave: 'discente-disciplinas', label: 'Disciplinas e Avaliações', grupo: 'Menu Discente', prefixos: ['/dashboard/discente/disciplinas'] },
  { chave: 'discente-historico', label: 'Notas e Histórico', grupo: 'Menu Discente', prefixos: ['/dashboard/discente/historico'] },
  { chave: 'discente-financeiro', label: 'Financeiro (Aluno)', grupo: 'Menu Discente', prefixos: ['/dashboard/discente/financeiro'] },
  { chave: 'discente-perfil', label: 'Perfil', grupo: 'Menu Discente', prefixos: ['/dashboard/discente/perfil'] },
  { chave: 'discente-renovacao', label: 'Minha Renovação (placeholder)', grupo: 'Menu Discente', prefixos: ['/dashboard/discente/renovacao'] },
  { chave: 'discente-conquistas', label: 'Conquistas e Avaliações (placeholder)', grupo: 'Menu Discente', prefixos: ['/dashboard/discente/conquistas'] },
  { chave: 'discente-provas-polo', label: 'Provas no Polo (placeholder)', grupo: 'Menu Discente', prefixos: ['/dashboard/discente/provas-polo'] },
  { chave: 'discente-aac', label: 'Horas AAC (placeholder)', grupo: 'Menu Discente', prefixos: ['/dashboard/discente/aac'] },
  { chave: 'discente-certificacoes', label: 'Certificações (placeholder)', grupo: 'Menu Discente', prefixos: ['/dashboard/discente/certificacoes'] },
  { chave: 'discente-conteudos-extras', label: 'Conteúdos Extras (placeholder)', grupo: 'Menu Discente', prefixos: ['/dashboard/discente/conteudos-extras'] },
  { chave: 'discente-carreiras', label: 'Carreiras (placeholder)', grupo: 'Menu Discente', prefixos: ['/dashboard/discente/carreiras'] },

  // ── Menu Docente (autoatendimento do PROFESSOR — ver components/dashboard/RightPanel.tsx) ──
  // Pauta e Notas reaproveitam as telas 'pauta'/'notas' já existentes (grupo
  // Acadêmico) — o professor já tinha acesso de escrita a elas, só ganharam
  // um atalho a mais no painel. As 3 telas abaixo são novas de verdade.
  { chave: 'docente-alunos', label: 'Alunos (das minhas turmas)', grupo: 'Menu Docente', prefixos: ['/dashboard/docente/alunos'] },
  { chave: 'docente-captura-prova', label: 'Captura de Prova', grupo: 'Menu Docente', prefixos: ['/dashboard/docente/captura-prova'] },
  { chave: 'docente-aviso-turma', label: 'Aviso para Turma', grupo: 'Menu Docente', prefixos: ['/dashboard/docente/aviso-turma'] },
  { chave: 'docente-gerador-prova', label: 'Gerador de Prova', grupo: 'Menu Docente', prefixos: ['/dashboard/docente/gerador-prova'] },
];
