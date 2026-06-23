import { Module } from '@nestjs/common';
import { MatrizCurricularController } from './matriz-curricular.controller';
import { MatrizCurricularService } from './matriz-curricular.service';
import { AuditModule } from '../../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [MatrizCurricularController],
  providers: [MatrizCurricularService],
  exports: [MatrizCurricularService],
})
export class MatrizCurricularModule {}
