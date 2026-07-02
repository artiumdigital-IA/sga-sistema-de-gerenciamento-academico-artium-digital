import { Module } from '@nestjs/common';
import { FrequenciaController } from './frequencia.controller';
import { FrequenciaService } from './frequencia.service';
import { AuditModule } from '../../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [FrequenciaController],
  providers: [FrequenciaService],
})
export class FrequenciaModule {}
