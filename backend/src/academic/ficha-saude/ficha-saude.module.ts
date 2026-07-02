import { Module } from '@nestjs/common';
import { FichaSaudeController } from './ficha-saude.controller';
import { FichaSaudeService } from './ficha-saude.service';
import { AuditModule } from '../../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [FichaSaudeController],
  providers: [FichaSaudeService],
})
export class FichaSaudeModule {}
