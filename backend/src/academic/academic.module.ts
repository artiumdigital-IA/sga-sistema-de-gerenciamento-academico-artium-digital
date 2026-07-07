import { Module } from '@nestjs/common';
import { CursoModule } from './curso/curso.module';
import { MatrizCurricularModule } from './matriz-curricular/matriz-curricular.module';
import { DisciplinaModule } from './disciplina/disciplina.module';
import { AlunoModule } from './aluno/aluno.module';
import { ProfessorModule } from './professor/professor.module';
import { PeriodoLetivoModule } from './periodo-letivo/periodo-letivo.module';
import { OfertaModule } from './oferta/oferta.module';
import { MatriculaDisciplinaModule } from './matricula-disciplina/matricula-disciplina.module';
import { AvaliacaoModule } from './avaliacao/avaliacao.module';
import { ResultadoDisciplinaModule } from './resultado-disciplina/resultado-disciplina.module';
import { FichaSaudeModule } from './ficha-saude/ficha-saude.module';
import { UnidadeModule } from './unidade/unidade.module';
import { MateriaEquiparadaModule } from './materia-equiparada/materia-equiparada.module';
import { FrequenciaModule } from './frequencia/frequencia.module';
import { NotaPautaModule } from './nota-pauta/nota-pauta.module';

@Module({
  imports: [
    CursoModule,
    MatrizCurricularModule,
    DisciplinaModule,
    AlunoModule,
    ProfessorModule,
    PeriodoLetivoModule,
    OfertaModule,
    MatriculaDisciplinaModule,
    AvaliacaoModule,
    ResultadoDisciplinaModule,
    FichaSaudeModule,
    UnidadeModule,
    MateriaEquiparadaModule,
    FrequenciaModule,
    NotaPautaModule,
  ],
  exports: [
    CursoModule,
    MatrizCurricularModule,
    DisciplinaModule,
    AlunoModule,
    ProfessorModule,
    PeriodoLetivoModule,
    OfertaModule,
    MatriculaDisciplinaModule,
    AvaliacaoModule,
    ResultadoDisciplinaModule,
    FichaSaudeModule,
    UnidadeModule,
    MateriaEquiparadaModule,
    FrequenciaModule,
    NotaPautaModule,
  ],
})
export class AcademicModule {}
