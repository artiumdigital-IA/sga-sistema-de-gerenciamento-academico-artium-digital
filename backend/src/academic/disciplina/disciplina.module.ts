import { Module } from '@nestjs/common';
import { DisciplinaController } from './disciplina.controller';
import { DisciplinaService } from './disciplina.service';
import { AuditModule } from '../../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [DisciplinaController],
  providers: [DisciplinaService],
  exports: [DisciplinaService],
})
export class DisciplinaModule {}
