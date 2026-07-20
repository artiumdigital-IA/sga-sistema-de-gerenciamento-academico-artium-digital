import { BadRequestException, Injectable } from '@nestjs/common';
import { Perfil } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { TELAS_SISTEMA, TelaSistema } from './telas-sistema';

const TODOS_PERFIS: Perfil[] = ['MASTER', 'ADMIN', 'SECRETARIA', 'FINANCEIRO', 'PROFESSOR', 'ALUNO', 'SUPORTE'] as Perfil[];

/**
 * Default de uma tela quando não existe registro explícito em PermissaoTela
 * pra aquele (perfil, chave) — ver comentário em `matriz()`.
 *
 * Bug corrigido: telas do grupo "Menu Discente" (autoatendimento do próprio
 * aluno) usavam o mesmo default-liberado de todas as outras telas, então
 * apareciam "habilitadas" pra TODOS os perfis (Admin/Professor/Financeiro/
 * Secretaria incluídos) na Matriz, até alguém desmarcar cada uma manualmente —
 * o que nunca tinha sido feito, já que essas telas foram adicionadas depois.
 * O resto do código já deixa claro que Menu Discente é só do perfil ALUNO
 * (ver frontend/components/dashboard/RightPanel.tsx), então o default correto
 * pra esse grupo é: liberado só pra ALUNO, desligado pros demais. Um registro
 * explícito na Matriz sempre tem prioridade sobre esse default (dá pra ligar/
 * desligar manualmente caso algum perfil precise de exceção).
 *
 * Mesmo raciocínio pro grupo "Menu Docente" (Jul/2026, autoatendimento do
 * professor — ver RightPanel.tsx): default liberado só pra PROFESSOR.
 */
function defaultHabilitada(tela: TelaSistema, perfil: Perfil): boolean {
  if (tela.grupo === 'Menu Discente') return perfil === 'ALUNO';
  if (tela.grupo === 'Menu Docente') return perfil === 'PROFESSOR';
  return true;
}

@Injectable()
export class PermissoesTelaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Matriz completa: uma linha por tela, com o estado (habilitada/desabilitada)
   * de cada perfil. Combinações sem registro no banco entram no default de
   * `defaultHabilitada()` (liberado pra quase tudo; Menu Discente é exceção,
   * default só pra ALUNO) — um registro no banco sempre tem prioridade.
   */
  async matriz() {
    const registros = await this.prisma.permissaoTela.findMany();
    const mapa = new Map(registros.map(r => [`${r.perfil}:${r.chaveTela}`, r.habilitada]));

    return TELAS_SISTEMA.map(tela => ({
      chave: tela.chave,
      label: tela.label,
      grupo: tela.grupo,
      perfis: Object.fromEntries(
        TODOS_PERFIS.map(perfil => [perfil, mapa.get(`${perfil}:${tela.chave}`) ?? defaultHabilitada(tela, perfil)]),
      ) as Record<Perfil, boolean>,
    }));
  }

  async alternar(dto: { perfil: Perfil; chaveTela: string; habilitada: boolean }, operadorId?: string) {
    const tela = TELAS_SISTEMA.find(t => t.chave === dto.chaveTela);
    if (!tela) throw new BadRequestException(`Tela desconhecida: ${dto.chaveTela}`);

    const antes = await this.prisma.permissaoTela.findUnique({
      where: { perfil_chaveTela: { perfil: dto.perfil, chaveTela: dto.chaveTela } },
    });

    const registro = await this.prisma.permissaoTela.upsert({
      where: { perfil_chaveTela: { perfil: dto.perfil, chaveTela: dto.chaveTela } },
      update: { habilitada: dto.habilitada },
      create: { perfil: dto.perfil, chaveTela: dto.chaveTela, habilitada: dto.habilitada },
    });

    await this.audit.log({
      usuarioId: operadorId,
      acao: 'UPDATE',
      entidade: 'PermissaoTela',
      entidadeId: registro.id,
      dadosAntes: { habilitada: antes?.habilitada ?? defaultHabilitada(tela, dto.perfil) },
      dadosDepois: { perfil: dto.perfil, chaveTela: dto.chaveTela, habilitada: dto.habilitada, tela: tela.label },
    });

    return registro;
  }

  /** Usado por QUALQUER usuário autenticado (não só o admin master) — alimenta
   * o filtro de menu/rota no frontend pro próprio perfil. Retorna só as
   * chaves habilitadas (ausência de registro = usa o default de
   * `defaultHabilitada()`, ver comentário acima). */
  async minhasChavesHabilitadas(perfil: Perfil): Promise<string[]> {
    // MASTER enxerga toda tela do sistema, sem exceção — nem passa pela
    // matriz (nenhum admin consegue restringir MASTER por aqui, de propósito).
    if (perfil === 'MASTER') return TELAS_SISTEMA.map(t => t.chave);

    const registros = await this.prisma.permissaoTela.findMany({
      where: { perfil },
      select: { chaveTela: true, habilitada: true },
    });
    const mapa = new Map(registros.map(r => [r.chaveTela, r.habilitada]));
    return TELAS_SISTEMA
      .filter(t => mapa.get(t.chave) ?? defaultHabilitada(t, perfil))
      .map(t => t.chave);
  }
}
