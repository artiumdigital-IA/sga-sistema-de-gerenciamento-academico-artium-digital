import { Module } from '@nestjs/common';
import { CursoModule } from './curso/curso.module';
import { MatrizCurricularModule } from './matriz-curricular/matriz-curricular.module';
import { DisciplinaModule } from './disciplina/disciplina.module';

@Module({
  imports: [CursoModule, MatrizCurricularModule, DisciplinaModule],
  exports: [CursoModule, MatrizCurricularModule, DisciplinaModule],
})
export class AcademicModule {}
