# Relatório de Status — Plataforma Acadêmica FIURJ

**Data:** 02/07/2026
**Escopo:** núcleo de graduação (Direito e Gestão Pública), conforme especificação do projeto.

---

## Resumo executivo

A plataforma já tem um núcleo acadêmico completo e utilizável em produção, cobrindo cadastro de cursos, matriz curricular, disciplinas, professores, alunos com todos os campos exigidos pelo Censo/INEP, oferta de turmas, matrícula por disciplina, lançamento de notas e frequência, cálculo de resultado e histórico com CR. Além do núcleo (Fases 0 a 4), já foram implementadas as fases de ingresso/processo seletivo, financeiro (estrutura interna, sem Asaas ainda), secretaria e documentos, e relatórios regulatórios do Censo. A plataforma está em produção na VPS Hostinger, acessível em http://187.77.56.182, com deploy automatizado via Coolify a partir do repositório Git. Em paralelo, o levantamento da Kirsch (sistema legado) avançou bastante nas últimas rodadas de exploração e já mapeou onde vive cada informação relevante para a migração, incluindo um achado importante sobre a grade curricular real de Direito e Gestão Pública. O que falta hoje não é mais núcleo acadêmico básico, e sim: fechar as últimas regras de negócio em aberto com a secretaria, avançar a integração com a Kirsch para viabilizar a migração de dados, e decidir o ritmo da Fase 6b (Asaas/pagamentos).

---

## Infraestrutura e deploy

A stack é a definida na especificação: NestJS + Prisma no backend, Next.js + Tailwind no frontend, PostgreSQL 16 e Redis 7 rodando em containers Docker. Em produção, a VPS Hostinger roda Coolify 4.1.2, com um GitHub App conectado ao repositório `fiurj-plataforma`, de forma que todo `git push` na branch principal dispara redeploy automático dos quatro containers (postgres, redis, backend, frontend). O tráfego externo passa por um nginx pré-existente na VPS (`edu-nginx`), já que o firewall da Hostinger só libera a porta 80 de forma confiável; o roteamento interno usa o IP do host (172.20.0.1) para alcançar as portas publicadas do backend e do frontend, contornando um problema de isolamento de rede entre containers de projetos Docker diferentes. Alguns problemas de deploy já foram resolvidos e documentados, entre eles a ausência do OpenSSL na imagem Alpine (necessário para o Prisma) e um bug do Next.js standalone em Docker que fazia o frontend escutar só na interface interna do container e devolver 502 — corrigido fixando a variável `HOSTNAME=0.0.0.0` no Dockerfile. O banco de produção já tem dados reais de teste e os dois usuários administrativos padrão (admin e secretaria), com senhas trocadas desde junho.

---

## O que já está construído

### Núcleo acadêmico (Fases 0 a 4)

O cadastro de cursos, matriz curricular versionada e disciplinas está completo, com suporte a pré-requisitos entre disciplinas — incluindo agora uma tela dedicada de gerenciamento de pré-requisitos por disciplina, com validação de auto-referência, duplicidade e dependência circular. O cadastro de alunos cobre todos os campos do Censo (sexo, cor/raça, nacionalidade, forma de ingresso, situação de vínculo) e de professores (titulação, regime de trabalho), com busca de CEP integrada via ViaCEP no cadastro de endereço do aluno. Desde esta semana, o RA do aluno deixou de ser digitado manualmente: o backend gera um número sequencial por ano (formato AAAA0001, AAAA0002...) automaticamente ao criar o cadastro, e o campo no formulário virou somente leitura.

A oferta de turmas por período letivo, a matrícula por disciplina (não por turma fixa, como pede a especificação) e o controle de vagas estão implementados, assim como o lançamento de notas e frequência, o cálculo de resultado final — incluindo a regra de exame final confirmada com a secretaria — e o histórico acadêmico do aluno com coeficiente de rendimento (CR) calculado automaticamente. Essa combinação (Fase 4) é o marco que a especificação chama de "núcleo acadêmico utilizável", pronto para um piloto com uma coorte real.

As regras de negócio da seção 7 da especificação já foram majoritariamente confirmadas com a secretaria: nota mínima de aprovação direta 6,0, média ponderada pelo peso das avaliações, exame final para quem tem frequência mínima de 75% e nota abaixo de 6,0 (com nota final sendo a média entre o semestre e o exame), reprovação por falta sem direito a exame final, CR considerando apenas disciplinas aprovadas (disciplinas em dependência ficam fora), e as listas completas de situação de vínculo e forma de ingresso. Ainda falta fechar como histórico, CR e integralização devem ser tratados — como dado sempre calculado na hora ou também armazenado.

### Controle de acesso e usuários

O sistema tem controle de acesso por perfil (RBAC) cobrindo Admin, Secretaria, Financeiro, Professor e Aluno, com um guard global que restringe operações de escrita nos módulos acadêmicos a Admin e Secretaria, e libera lançamento de notas também para Professor. Existe um módulo próprio de gestão de usuários, com bloqueio, ativação e reset de senha, além de uma área de edição de perfil (nome, telefone e foto) com upload de imagem persistido em volume Docker, refletido tanto na tela "Minha Conta" quanto no avatar do topo do sistema.

### Ingresso e processo seletivo (Fase 5)

O módulo de ingresso já permite cadastrar processos seletivos, candidatos com todos os campos do Censo e inscrições, com um fluxo de status até a conversão do candidato aprovado em aluno — que já cria o usuário de acesso e gera o RA automaticamente.

### Financeiro (Fase 6, estrutura interna)

A parte de contratos de matrícula e parcelas já está pronta, com geração automática das parcelas ao criar o contrato, registro manual de pagamento, cancelamento e atualização de parcelas vencidas. O que ainda falta desta fase é justamente a integração externa: Asaas para PIX e boleto, emissão de NFS-e e a conciliação de webhooks de pagamento — tudo isso ficou deliberadamente para depois do acadêmico estabilizar, como definido na estratégia do projeto.

### Secretaria e documentos (Fase 7)

O módulo de requerimentos cobre o fluxo completo (aberto, em análise, deferido, indeferido, cancelado). A emissão de documentos já inclui declaração de matrícula, boletim de notas e frequência por período (com seleção de período quando o aluno tem mais de um) e, mais recentemente, o mapa de notas por turma (conhecido na Kirsch como "Mapão"), que mostra todos os alunos matriculados numa oferta com as notas lançadas, média, faltas, frequência e situação — os três documentos são imprimíveis em formato de papel timbrado. Também existe um módulo de avisos, usado tanto numa tela própria de gestão quanto no quadro de avisos do painel principal.

### Relatórios regulatórios (Fase 8)

O módulo de reporting já expõe um resumo consolidado do Censo (totais e quebra por situação de vínculo, forma de ingresso, sexo, cor/raça, titulação docente e regime de trabalho) e listagens exportáveis em CSV de alunos, docentes e cursos com os campos exigidos pelo INEP. Isso ainda é a base de dados para o Censo, não a geração do arquivo oficial de submissão — essa etapa formal continua planejada para mais adiante, até porque a exploração da Kirsch encontrou um bloqueio técnico (arquivo de referência ausente) que impede comparar o layout nativo dela como referência.

### Painel direito ("Barra Rápida")

O painel lateral direito, que replica a estrutura de menu da Kirsch para facilitar a transição de quem já usa o sistema antigo, foi religado a rotas reais da plataforma nova: cliques navegam de verdade, o item da tela atual fica destacado, e o que ainda não tem equivalente construído aparece visivelmente desabilitado em vez de simplesmente sumir. A grande maioria dos itens do menu já aponta para telas funcionais; os que restam desabilitados são majoritariamente funcionalidades de baixa prioridade (calculadora, ranking de alunos) ou telas que a própria exploração da Kirsch encontrou vazias mesmo em uso real (calendário de feriados, datas de bimestre).

---

## Levantamento da Kirsch (migração)

O spike de extração de dados da Kirsch avançou bastante além da conclusão inicial de "só exportação CSV/XML, sem API". A inspeção da instalação local encontrou drivers MySQL (dbExpress/Delphi), o que é forte indício de que o banco real por trás da Kirsch é MySQL — a recomendação em aberto é pedir ao fornecedor um usuário de leitura nessa base, o que mudaria a estratégia de ETL de "a partir de arquivo" para "a partir de réplica de banco", que é a opção preferida pela especificação.

Em várias rodadas de exploração read-only do sistema, mapeamos onde cada informação relevante vive dentro da Kirsch: cadastro de aluno e professor (com boa correspondência aos campos do Censo do nosso modelo), cadastro de curso, e — o achado mais importante — a diferença entre duas telas de grade curricular. A tela "Grade Curricular Fixa" mostrou números defasados e incompletos (Direito com só 1.200h, bem abaixo do mínimo esperado); a tela correta e operacional, usada de fato pela secretaria, é "Formação de Curso (Grade Curricular)", filtrada por ano/semestre, que mostra Direito com 10 períodos (compatível com um bacharelado de 5 anos) e Gestão Pública com 4 períodos — e é essa que deve servir de referência para migrar o `periodo_sugerido` de cada disciplina e validar a carga horária total dos cursos.

Também confirmamos que a Kirsch não tem pré-requisitos entre disciplinas cadastrados operacionalmente para nenhum dos dois cursos de graduação — ou seja, essa informação não pode vir da migração automática e vai precisar ser levantada manualmente com a coordenação de cada curso. Um achado ainda sem explicação é um sufixo em algarismo romano na coluna "Etapa" da grade (por exemplo "1º Período - II"), que precisa ser esclarecido com a secretaria antes de decidir como mapear para o nosso campo de período. A exportação nativa da Kirsch para o INEP está bloqueada por um arquivo de referência ausente na instalação (`Municipio.DAT`), o que também travou o processo na máquina de exploração e precisa ser fechado manualmente.

---

## Pendências e decisões em aberto

Ficam pendentes: a resposta do fornecedor da Kirsch sobre acesso de leitura ao MySQL (ou, alternativamente, conseguir arquivos de exemplo reais dos exports CSV/XML de cada entidade); confirmar com a secretaria se histórico, CR e integralização devem ser guardados ou sempre recalculados; mapear os valores exatos dos dropdowns de Cor/Raça, Situação e Titulação da Kirsch para os enums do nosso schema; esclarecer o sufixo em algarismo romano da coluna Etapa; confirmar que "Formação e Curso" (por ano/semestre) é mesmo a fonte de verdade para a migração, e não a "Grade Curricular Fixa"; e restaurar o arquivo que trava a exportação de exemplo do INEP na Kirsch.

---

## Próximos passos

**Depende da FIURJ (não é código):** confirmar as últimas regras de negócio em aberto com a secretaria e coordenação (especialmente histórico/CR/integralização e o significado do sufixo de Etapa), e obter — via fornecedor da Kirsch — acesso de leitura ao banco MySQL ou, na falta disso, arquivos de exemplo reais dos exports CSV/XML de alunos, cursos, disciplinas, matrículas e notas.

**Pode começar já:** a Fase 6b, com a integração do Asaas para PIX e boleto, conciliação de webhook e NFS-e; o desenho do módulo `migration/` para o ETL a partir de CSV/XML — o esqueleto pode começar mesmo sem os arquivos de exemplo, mas o mapeamento fino de campos depende deles; e, mais adiante, a Fase 9 de migração em massa, parallel run e cutover, que só faz sentido depois que a base de dados de origem estiver clara.
