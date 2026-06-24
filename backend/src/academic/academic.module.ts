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
  ],
})
export class AcademicModule {}
