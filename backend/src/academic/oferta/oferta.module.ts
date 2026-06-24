import { Module } from '@nestjs/common';
import { OfertaController } from './oferta.controller';
import { OfertaService } from './oferta.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuditModule } from '../../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [OfertaController],
  providers: [OfertaService],
  exports: [OfertaService],
})
export class OfertaModule {}
