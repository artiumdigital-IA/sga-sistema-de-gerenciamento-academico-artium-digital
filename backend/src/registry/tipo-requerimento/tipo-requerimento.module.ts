import { Module } from '@nestjs/common';
import { TipoRequerimentoController } from './tipo-requerimento.controller';
import { TipoRequerimentoService } from './tipo-requerimento.service';
import { AuditModule } from '../../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [TipoRequerimentoController],
  providers: [TipoRequerimentoService],
  exports: [TipoRequerimentoService],
})
export class TipoRequerimentoModule {}
