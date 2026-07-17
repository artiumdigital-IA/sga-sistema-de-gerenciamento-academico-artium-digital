import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';
import type { Response } from 'express';
import * as ExcelJS from 'exceljs';
import { create } from 'xmlbuilder2';
import * as archiver from 'archiver';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

/**
 * Relatórios Master — exportação completa do banco (backup/disaster
 * recovery) e dos arquivos enviados, pro perfil MASTER. Ver decisão de
 * design no plano da sessão: SQL vem de `pg_dump` de verdade (não redigido —
 * um backup restaurável precisa da senha real, senão ninguém loga depois de
 * restaurar); XLSX/XML/JSON vêm do Prisma e SEMPRE redigem credenciais
 * (`Usuario.senhaHash`/`mfaSegredo`) porque servem pra leitura/análise, não
 * restauração, e são os formatos mais fáceis de vazar sem querer.
 */
@Injectable()
export class RelatoriosMasterService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** Registra quem baixou o quê, mesmo que o dump falhe depois — dado o
   * risco LGPD, a tentativa em si já importa registrar. */
  async registrarExport(usuarioId: string, formato: string): Promise<void> {
    await this.audit.log({ usuarioId, acao: 'EXPORT', entidade: 'RelatorioMaster', dadosDepois: { formato } });
  }

  /** Nomes de todas as models do schema, via reflexão do Prisma — não
   * precisa listar as ~50 tabelas na mão, e acompanha o schema conforme
   * cresce. */
  private modelos(): string[] {
    return Prisma.dmmf.datamodel.models.map(m => m.name);
  }

  private async linhasDe(nomeModelo: string): Promise<any[]> {
    const chave = nomeModelo.charAt(0).toLowerCase() + nomeModelo.slice(1);
    return (this.prisma as any)[chave].findMany();
  }

  /** Única credencial real do sistema que nunca deve sair num formato de
   * leitura/análise. */
  private redigir(nomeModelo: string, linha: any): any {
    if (nomeModelo !== 'Usuario') return linha;
    return { ...linha, senhaHash: '[REDACTED]', mfaSegredo: linha.mfaSegredo ? '[REDACTED]' : null };
  }

  /**
   * Dump SQL via `pg_dump` real — schema + dados (ou só schema), direto do
   * Postgres, streamado pra `res` sem buffer em memória.
   *
   * Bug corrigido (achado no teste E2E, Jul/2026): antes, o controller já
   * setava `Content-Disposition`/status 200 ANTES de chamar esse método —
   * se `pg_dump` não existisse no container (ENOENT) ou saísse sem
   * escrever nada, o cliente recebia um download "de sucesso" com 0 bytes,
   * sem nenhum erro visível. Agora os headers só são setados aqui, no
   * primeiro chunk real de stdout — se `pg_dump` falhar (ENOENT, código de
   * saída != 0, ou saída vazia) ANTES de qualquer byte ser escrito, quem
   * chama recebe uma exceção de verdade (o controller converte pra 500 com
   * mensagem), em vez de um arquivo vazio silencioso.
   */
  async streamPgDump(apenasSchema: boolean, res: Response): Promise<void> {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) throw new InternalServerErrorException('DATABASE_URL não configurada.');

    const args = apenasSchema ? ['--schema-only', databaseUrl] : [databaseUrl];
    const nomeArquivo = apenasSchema ? 'schema' : 'banco-completo';

    await new Promise<void>((resolve, reject) => {
      const processo = spawn('pg_dump', args);
      let recebeuDados = false;
      let stderrBuffer = '';
      let finalizado = false;

      const falhar = (mensagem: string) => {
        if (finalizado) return;
        finalizado = true;
        if (!res.headersSent) {
          reject(new InternalServerErrorException(mensagem));
        } else {
          // Já começamos a escrever no stream — não dá mais pra trocar o
          // status HTTP. Derruba a conexão pra o cliente não interpretar
          // um arquivo truncado como um dump válido.
          res.destroy(new Error(mensagem));
          reject(new InternalServerErrorException(mensagem));
        }
      };

      processo.stdout.on('data', (chunk: Buffer) => {
        if (!recebeuDados) {
          recebeuDados = true;
          res.setHeader('Content-Type', 'application/sql');
          res.setHeader('Content-Disposition', `attachment; filename="${nomeArquivo}.sql"`);
        }
        res.write(chunk);
      });

      processo.stderr.on('data', (d: Buffer) => {
        const texto = d.toString();
        stderrBuffer += texto;
        console.error(`pg_dump: ${texto}`);
      });

      processo.on('error', (err) => {
        falhar(`Não foi possível executar pg_dump: ${err.message}`);
      });

      processo.on('close', (codigo) => {
        if (finalizado) return;
        if (codigo !== 0) {
          falhar(`pg_dump saiu com código ${codigo}.${stderrBuffer ? ' ' + stderrBuffer.trim() : ''}`);
          return;
        }
        if (!recebeuDados) {
          falhar('pg_dump não retornou nenhum dado (dump vazio) — verifique se o binário está instalado no container.');
          return;
        }
        finalizado = true;
        res.end();
        resolve();
      });
    });
  }

  /** XLSX — 1 aba por tabela, streamado pra `res` (WorkbookWriter não
   * acumula tudo em memória). */
  async streamXlsx(res: Response): Promise<void> {
    const workbook = new (ExcelJS as any).stream.xlsx.WorkbookWriter({ stream: res });
    for (const nomeModelo of this.modelos()) {
      const linhas = await this.linhasDe(nomeModelo);
      const sheet = workbook.addWorksheet(nomeModelo.slice(0, 31));
      if (linhas.length > 0) {
        sheet.columns = Object.keys(linhas[0]).map(k => ({ header: k, key: k }));
        for (const linha of linhas) {
          sheet.addRow(this.redigir(nomeModelo, linha)).commit();
        }
      }
      sheet.commit();
    }
    await workbook.commit();
  }

  /** XML — <banco><tabela nome="..."><linha><campo>valor</campo>...  */
  async gerarXml(): Promise<string> {
    const root = create({ version: '1.0', encoding: 'UTF-8' }).ele('banco');
    for (const nomeModelo of this.modelos()) {
      const linhas = await this.linhasDe(nomeModelo);
      const tabela = root.ele('tabela', { nome: nomeModelo });
      for (const linhaOriginal of linhas) {
        const linha = this.redigir(nomeModelo, linhaOriginal);
        const linhaEl = tabela.ele('linha');
        for (const [campo, valor] of Object.entries(linha)) {
          linhaEl.ele(campo).txt(valor === null || valor === undefined ? '' : String(valor));
        }
      }
    }
    return root.end({ prettyPrint: true });
  }

  /** JSON — { NomeModelo: [linha, ...] } pra cada uma das ~50 tabelas. */
  async gerarJson(): Promise<Record<string, any[]>> {
    const resultado: Record<string, any[]> = {};
    for (const nomeModelo of this.modelos()) {
      const linhas = await this.linhasDe(nomeModelo);
      resultado[nomeModelo] = linhas.map((linha) => this.redigir(nomeModelo, linha));
    }
    return resultado;
  }

  /** ZIP de tudo em uploads/ (avatars, documentos, capturas-prova,
   * branding) — arquivos físicos enviados, que não moram no Postgres. */
  async streamUploadsZip(res: Response): Promise<void> {
    const archive = new (archiver as any).ZipArchive({ zlib: { level: 9 } });
    await new Promise<void>((resolve, reject) => {
      archive.on('error', (err: Error) => {
        if (!res.headersSent) reject(new InternalServerErrorException(`Falha ao gerar ZIP: ${err.message}`));
        else { res.destroy(err); reject(err); }
      });
      archive.on('end', () => resolve());
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="uploads.zip"');
      archive.pipe(res);
      const uploadsDir = join(process.cwd(), 'uploads');
      if (existsSync(uploadsDir)) archive.directory(uploadsDir, false);
      archive.finalize();
    });
  }
}
