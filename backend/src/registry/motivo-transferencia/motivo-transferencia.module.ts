import { Module } from '@nestjs/common';
import { MotivoTransferenciaController } from './motivo-transferencia.controller';
import { MotivoTransferenciaService } from './motivo-transferencia.service';
import { AuditModule } from '../../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [MotivoTransferenciaController],
  providers: [MotivoTransferenciaService],
  exports: [MotivoTransferenciaService],
})
export class MotivoTransferenciaModule {}
