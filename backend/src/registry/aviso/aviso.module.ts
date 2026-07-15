import { Module } from '@nestjs/common';
import { AvisoController } from './aviso.controller';
import { AvisoService } from './aviso.service';
import { AuditModule } from '../../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [AvisoController],
  providers: [AvisoService],
  // Exportado pro DocenteModule reaproveitar (POST /docente/aviso-turma
  // chama AvisoService.create() por baixo -- ver docente.service.ts).
  exports: [AvisoService],
})
export class AvisoModule {}
