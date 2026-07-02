import { Module } from '@nestjs/common';
import { MotivoOcorrenciaController } from './motivo-ocorrencia.controller';
import { MotivoOcorrenciaService } from './motivo-ocorrencia.service';
import { AuditModule } from '../../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [MotivoOcorrenciaController],
  providers: [MotivoOcorrenciaService],
  exports: [MotivoOcorrenciaService],
})
export class MotivoOcorrenciaModule {}
