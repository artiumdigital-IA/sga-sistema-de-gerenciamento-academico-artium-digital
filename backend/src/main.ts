import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Sem isso, o processo Nest ignora SIGTERM (o sinal que o Docker manda ao
  // parar/reiniciar um container -- todo redeploy no Coolify faz isso) e é
  // encerrado à força depois do timeout padrão do Docker (10s), sem rodar
  // PrismaService.onModuleDestroy() -- a conexão com o Postgres fica aberta
  // do lado do banco até o TCP dela expirar sozinho. Cada redeploy sem esse
  // hook "vaza" uma conexão do pool do Postgres; depois de dias com vários
  // redeploys (este projeto teve dezenas, ver histórico de commits), o
  // max_connections do Postgres pode ficar perto do limite, fazendo novas
  // requisições esperarem (ou travarem) por uma conexão livre -- um dos
  // candidatos mais fortes pro "Gateway Timeout intermitente" investigado
  // aqui, porque explica por que o problema é intermitente E parece piorar
  // com o tempo/mais redeploys, não algo que já estivesse quebrado desde o
  // primeiro deploy.
  app.enableShutdownHooks();

  // Garante que as pastas de uploads existam (fotos de perfil, documentos digitalizados, etc.)
  const uploadsDir = join(process.cwd(), 'uploads', 'avatars');
  if (!existsSync(uploadsDir)) mkdirSync(uploadsDir, { recursive: true });
  const documentosDir = join(process.cwd(), 'uploads', 'documentos');
  if (!existsSync(documentosDir)) mkdirSync(documentosDir, { recursive: true });
  const brandingDir = join(process.cwd(), 'uploads', 'branding');
  if (!existsSync(brandingDir)) mkdirSync(brandingDir, { recursive: true });
  const capturasProvaDir = join(process.cwd(), 'uploads', 'capturas-prova');
  if (!existsSync(capturasProvaDir)) mkdirSync(capturasProvaDir, { recursive: true });
  const cnabRemessasDir = join(process.cwd(), 'uploads', 'cnab', 'remessas');
  if (!existsSync(cnabRemessasDir)) mkdirSync(cnabRemessasDir, { recursive: true });
  const cnabRetornosDir = join(process.cwd(), 'uploads', 'cnab', 'retornos');
  if (!existsSync(cnabRetornosDir)) mkdirSync(cnabRetornosDir, { recursive: true });
  const importacaoLegadoDir = join(process.cwd(), 'uploads', 'importacao-legado');
  if (!existsSync(importacaoLegadoDir)) mkdirSync(importacaoLegadoDir, { recursive: true });

  // Serve arquivos estaticos (uploads) — fora do prefixo /api/v1
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads' });

  // Prefixo global da API
  app.setGlobalPrefix('api/v1');

  // Validação automática dos DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS (ajustar origens em produção)
  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
    exposedHeaders: ['Content-Disposition'],
  });

  // Swagger (apenas em desenvolvimento)
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('FIURJ Plataforma Acadêmica')
      .setDescription('API do sistema acadêmico da FIURJ')
      .setVersion('0.1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`🚀 Backend rodando em http://localhost:${port}/api/v1`);
  if (process.env.NODE_ENV !== 'production') {
    console.log(`📖 Swagger em http://localhost:${port}/api/docs`);
  }
}

bootstrap();
