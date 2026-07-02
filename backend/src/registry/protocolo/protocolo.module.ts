import { Module } from '@nestjs/common';
import { ProtocoloController } from './protocolo.controller';
import { ProtocoloService } from './protocolo.service';
import { AuditModule } from '../../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [ProtocoloController],
  providers: [ProtocoloService],
})
export class ProtocoloModule {}
