import { Module } from '@nestjs/common';
import { CursoModule } from './curso/curso.module';
import { MatrizCurricularModule } from './matriz-curricular/matriz-curricular.module';
import { DisciplinaModule } from './disciplina/disciplina.module';
import { AlunoModule } from './aluno/aluno.module';
import { ProfessorModule } from './professor/professor.module';

@Module({
  imports: [CursoModule, MatrizCurricularModule, DisciplinaModule, AlunoModule, ProfessorModule],
  exports: [CursoModule, MatrizCurricularModule, DisciplinaModule, AlunoModule, ProfessorModule],
})
export class AcademicModule {}
