import { Module } from '@nestjs/common';
import { ProvaGeradaController } from './prova-gerada.controller';
import { ProvaGeradaService } from './prova-gerada.service';
import { AuditModule } from '../../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [ProvaGeradaController],
  providers: [ProvaGeradaService],
  exports: [ProvaGeradaService],
})
export class ProvaGeradaModule {}
