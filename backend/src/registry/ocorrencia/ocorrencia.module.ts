import { Module } from '@nestjs/common';
import { OcorrenciaController } from './ocorrencia.controller';
import { OcorrenciaService } from './ocorrencia.service';
import { AuditModule } from '../../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [OcorrenciaController],
  providers: [OcorrenciaService],
})
export class OcorrenciaModule {}
