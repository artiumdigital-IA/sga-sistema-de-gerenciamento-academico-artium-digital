import { Module } from '@nestjs/common';
import { CandidatoService } from './candidato.service';
import { CandidatoController } from './candidato.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuditModule } from '../../audit/audit.module';

@Module({ imports: [PrismaModule, AuditModule], controllers: [CandidatoController], providers: [CandidatoService] })
export class CandidatoModule {}
