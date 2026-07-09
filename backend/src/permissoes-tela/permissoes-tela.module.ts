import { Module } from '@nestjs/common';
import { PermissoesTelaController } from './permissoes-tela.controller';
import { PermissoesTelaService } from './permissoes-tela.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [PermissoesTelaController],
  providers: [PermissoesTelaService],
  exports: [PermissoesTelaService],
})
export class PermissoesTelaModule {}
