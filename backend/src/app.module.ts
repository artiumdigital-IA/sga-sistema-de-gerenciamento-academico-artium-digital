import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { AcademicModule } from './academic/academic.module';
import { AuditModule } from './audit/audit.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { EnrollmentModule } from './enrollment/enrollment.module';
import { RegistryModule } from './registry/registry.module';
import { ReportingModule } from './reporting/reporting.module';
import { FinancialModule } from './financial/financial.module';
import { SystemModule } from './system/system.module';
import { BrandingModule } from './branding/branding.module';
import { PermissoesTelaModule } from './permissoes-tela/permissoes-tela.module';
import { DiscenteModule } from './discente/discente.module';
import { HealthModule } from './health/health.module';
import { LibraryModule } from './library/library.module';
import { PushModule } from './push/push.module';
import { DocenteModule } from './docente/docente.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { TelaPermissaoGuard } from './permissoes-tela/guards/tela-permissao.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuditModule,
    AuthModule,
    AcademicModule,
    UsuariosModule,
    EnrollmentModule,
    RegistryModule,
    ReportingModule,
    FinancialModule,
    SystemModule,
    BrandingModule,
    PermissoesTelaModule,
    DiscenteModule,
    HealthModule,
    LibraryModule,
    PushModule,
    DocenteModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    // TelaPermissaoGuard roda por ultimo, depois de autenticacao (JWT) e
    // perfil (@Roles). Fecha a lacuna da nota de seguranca da tela de
    // Permissoes: bloqueia tambem a chamada direta ao endpoint quando a
    // tela correspondente esta desabilitada pro perfil do usuario, nao so
    // o icone/link no menu do frontend. Ver permissoes-tela/decorators/tela.decorator.ts.
    { provide: APP_GUARD, useClass: TelaPermissaoGuard },
  ],
})
export class AppModule {}
