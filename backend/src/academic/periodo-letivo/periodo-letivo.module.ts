import { Module } from '@nestjs/common';
import { PeriodoLetivoController } from './periodo-letivo.controller';
import { PeriodoLetivoService } from './periodo-letivo.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuditModule } from '../../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [PeriodoLetivoController],
  providers: [PeriodoLetivoService],
  exports: [PeriodoLetivoService],
})
export class PeriodoLetivoModule {}
