import { Global, Module } from '@nestjs/common';
import { TurmaAcessoService } from './turma-acesso.service';

// @Global(): importado uma única vez (em AcademicModule) e fica injetável em
// qualquer módulo do app sem precisar reimportar — mesmo padrão do
// PrismaModule.
@Global()
@Module({
  providers: [TurmaAcessoService],
  exports: [TurmaAcessoService],
})
export class TurmaAcessoModule {}
