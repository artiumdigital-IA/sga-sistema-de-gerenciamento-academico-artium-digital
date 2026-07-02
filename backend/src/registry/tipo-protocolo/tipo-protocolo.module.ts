import { Module } from '@nestjs/common';
import { TipoProtocoloController } from './tipo-protocolo.controller';
import { TipoProtocoloService } from './tipo-protocolo.service';
import { AuditModule } from '../../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [TipoProtocoloController],
  providers: [TipoProtocoloService],
  exports: [TipoProtocoloService],
})
export class TipoProtocoloModule {}
