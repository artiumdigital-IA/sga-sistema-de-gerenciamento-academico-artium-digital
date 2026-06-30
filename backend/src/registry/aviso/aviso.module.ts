import { Module } from '@nestjs/common';
import { AvisoController } from './aviso.controller';
import { AvisoService } from './aviso.service';
import { AuditModule } from '../../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [AvisoController],
  providers: [AvisoService],
})
export class AvisoModule {}
