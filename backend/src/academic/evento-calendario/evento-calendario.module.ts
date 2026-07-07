import { Module } from '@nestjs/common';
import { EventoCalendarioController } from './evento-calendario.controller';
import { EventoCalendarioService } from './evento-calendario.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuditModule } from '../../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [EventoCalendarioController],
  providers: [EventoCalendarioService],
  exports: [EventoCalendarioService],
})
export class EventoCalendarioModule {}
