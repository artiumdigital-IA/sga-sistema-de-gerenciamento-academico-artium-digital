import { Module } from '@nestjs/common';
import { InscricaoService } from './inscricao.service';
import { InscricaoController } from './inscricao.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuditModule } from '../../audit/audit.module';

@Module({ imports: [PrismaModule, AuditModule], controllers: [InscricaoController], providers: [InscricaoService] })
export class InscricaoModule {}
