import { Module } from '@nestjs/common';
import { NotaPautaController } from './nota-pauta.controller';
import { NotaPautaService } from './nota-pauta.service';
import { AuditModule } from '../../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [NotaPautaController],
  providers: [NotaPautaService],
})
export class NotaPautaModule {}
