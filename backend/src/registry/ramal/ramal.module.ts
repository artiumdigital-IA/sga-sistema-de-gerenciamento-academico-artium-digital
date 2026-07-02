import { Module } from '@nestjs/common';
import { RamalController } from './ramal.controller';
import { RamalService } from './ramal.service';
import { AuditModule } from '../../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [RamalController],
  providers: [RamalService],
  exports: [RamalService],
})
export class RamalModule {}
