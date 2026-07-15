import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { AvisoModule } from '../registry/aviso/aviso.module';
import { PushModule } from '../push/push.module';
import { DocenteController } from './docente.controller';
import { DocenteService } from './docente.service';

@Module({
  imports: [PrismaModule, AuditModule, AvisoModule, PushModule],
  controllers: [DocenteController],
  providers: [DocenteService],
})
export class DocenteModule {}
