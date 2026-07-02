import { Module } from '@nestjs/common';
import { MateriaEquiparadaController } from './materia-equiparada.controller';
import { MateriaEquiparadaService } from './materia-equiparada.service';
import { AuditModule } from '../../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [MateriaEquiparadaController],
  providers: [MateriaEquiparadaService],
})
export class MateriaEquiparadaModule {}
