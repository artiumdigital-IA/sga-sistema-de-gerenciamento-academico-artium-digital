import { Module } from '@nestjs/common';
import { MatriculaDisciplinaController } from './matricula-disciplina.controller';
import { MatriculaDisciplinaService } from './matricula-disciplina.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuditModule } from '../../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [MatriculaDisciplinaController],
  providers: [MatriculaDisciplinaService],
  exports: [MatriculaDisciplinaService],
})
export class MatriculaDisciplinaModule {}
