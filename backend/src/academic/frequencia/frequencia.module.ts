import { Module } from '@nestjs/common';
import { FrequenciaController } from './frequencia.controller';
import { FrequenciaService } from './frequencia.service';
import { AuditModule } from '../../audit/audit.module';
import { ResultadoDisciplinaModule } from '../resultado-disciplina/resultado-disciplina.module';

@Module({
  imports: [AuditModule, ResultadoDisciplinaModule],
  controllers: [FrequenciaController],
  providers: [FrequenciaService],
})
export class FrequenciaModule {}
