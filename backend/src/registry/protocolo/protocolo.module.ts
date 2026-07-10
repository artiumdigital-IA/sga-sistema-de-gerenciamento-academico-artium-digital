import { Module } from '@nestjs/common';
import { ProtocoloController } from './protocolo.controller';
import { ProtocoloService } from './protocolo.service';
import { AuditModule } from '../../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [ProtocoloController],
  providers: [ProtocoloService],
  // Exportado pro DiscenteModule reaproveitar a mesma lógica de numeração
  // sequencial na abertura de protocolo pelo próprio aluno (autoatendimento).
  exports: [ProtocoloService],
})
export class ProtocoloModule {}
