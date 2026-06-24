import { Module } from '@nestjs/common';
import { ResultadoDisciplinaService } from './resultado-disciplina.service';
import { ResultadoDisciplinaController } from './resultado-disciplina.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuditModule } from '../../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [ResultadoDisciplinaController],
  providers: [ResultadoDisciplinaService],
  exports: [ResultadoDisciplinaService],
})
export class ResultadoDisciplinaModule {}
