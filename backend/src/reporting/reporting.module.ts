import { Module } from '@nestjs/common';
import { CensoController } from './censo.controller';
import { CensoService } from './censo.service';

@Module({
  controllers: [CensoController],
  providers: [CensoService],
})
export class ReportingModule {}
