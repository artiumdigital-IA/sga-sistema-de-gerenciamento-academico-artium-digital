import { Module } from '@nestjs/common';
import { CursoController } from './curso.controller';
import { CursoService } from './curso.service';
import { AuditModule } from '../../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [CursoController],
  providers: [CursoService],
  exports: [CursoService],
})
export class CursoModule {}
