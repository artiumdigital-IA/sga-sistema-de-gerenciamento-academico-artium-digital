import { Module } from '@nestjs/common';
import { ProcessoSeletivoService } from './processo-seletivo.service';
import { ProcessoSeletivoController } from './processo-seletivo.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuditModule } from '../../audit/audit.module';

@Module({ imports: [PrismaModule, AuditModule], controllers: [ProcessoSeletivoController], providers: [ProcessoSeletivoService] })
export class ProcessoSeletivoModule {}
