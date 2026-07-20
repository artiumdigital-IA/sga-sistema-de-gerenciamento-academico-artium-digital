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
import { LivroService } from '../library/livro/livro.service';
import { LinhaImportarLivroDto } from './dto/importar-livros.dto';

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
    private readonly livroService: LivroService,
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

  /**
   * XLSX só do módulo Biblioteca — 3 abas (Livros com um linha por
   * exemplar físico, Equipamentos, Empréstimos com o item/usuário já
   * resolvidos por nome). Card "Módulo Biblioteca" da tela Relatórios
   * Master — visão pra auditoria/controle de acervo, separada do dump
   * genérico "1 aba por tabela" que já existe.
   */
  async streamBibliotecaXlsx(res: Response): Promise<void> {
    const workbook = new (ExcelJS as any).stream.xlsx.WorkbookWriter({ stream: res });

    const livros = await this.prisma.livro.findMany({
      include: { exemplares: true },
      orderBy: { titulo: 'asc' },
    });
    const sheetLivros = workbook.addWorksheet('Livros');
    sheetLivros.columns = [
      { header: 'Título', key: 'titulo' },
      { header: 'Autor', key: 'autor' },
      { header: 'Editora', key: 'editora' },
      { header: 'ISBN', key: 'isbn' },
      { header: 'Categoria', key: 'categoria' },
      { header: 'Ano', key: 'anoPublicacao' },
      { header: 'CDD', key: 'cdd' },
      { header: 'Cutter', key: 'cutter' },
      { header: 'Edição', key: 'edicao' },
      { header: 'Nº Exemplar', key: 'numeroExemplar' },
      { header: 'Código Tombamento', key: 'codigoTombamento' },
      { header: 'Localização', key: 'localizacao' },
      { header: 'Status Exemplar', key: 'statusExemplar' },
    ];
    for (const livro of livros) {
      const exemplares = livro.exemplares.length > 0 ? livro.exemplares : [null];
      for (const ex of exemplares) {
        sheetLivros
          .addRow({
            titulo: livro.titulo,
            autor: livro.autor,
            editora: livro.editora,
            isbn: livro.isbn,
            categoria: livro.categoria,
            anoPublicacao: livro.anoPublicacao,
            cdd: livro.cdd,
            cutter: livro.cutter,
            edicao: livro.edicao,
            numeroExemplar: ex?.numeroExemplar ?? null,
            codigoTombamento: ex?.codigoTombamento ?? null,
            localizacao: ex?.localizacao ?? null,
            statusExemplar: ex?.status ?? null,
          })
          .commit();
      }
    }
    sheetLivros.commit();

    const equipamentos = await this.prisma.equipamento.findMany({ orderBy: { patrimonio: 'asc' } });
    const sheetEquip = workbook.addWorksheet('Equipamentos');
    sheetEquip.columns = [
      { header: 'Patrimônio', key: 'patrimonio' },
      { header: 'Tipo', key: 'tipo' },
      { header: 'Modelo', key: 'modelo' },
      { header: 'Nº Série', key: 'numeroSerie' },
      { header: 'Status', key: 'status' },
      { header: 'Observações', key: 'observacoes' },
    ];
    for (const eq of equipamentos) sheetEquip.addRow(eq).commit();
    sheetEquip.commit();

    const emprestimos = await this.prisma.emprestimo.findMany({
      include: {
        exemplarLivro: { include: { livro: { select: { titulo: true } } } },
        equipamento: { select: { patrimonio: true, modelo: true } },
        usuario: { select: { nome: true, email: true } },
      },
      orderBy: { dataEmprestimo: 'desc' },
    });
    const sheetEmp = workbook.addWorksheet('Emprestimos');
    sheetEmp.columns = [
      { header: 'Tipo', key: 'tipoItem' },
      { header: 'Item', key: 'item' },
      { header: 'Usuário', key: 'usuario' },
      { header: 'E-mail', key: 'email' },
      { header: 'Data Empréstimo', key: 'dataEmprestimo' },
      { header: 'Prevista Devolução', key: 'dataPrevistaDevolucao' },
      { header: 'Data Devolução', key: 'dataDevolucao' },
      { header: 'Status', key: 'status' },
      { header: 'Uso Institucional', key: 'usoInstitucional' },
      { header: 'Uso por Aluno', key: 'usoPorAluno' },
      { header: 'Observações', key: 'observacoes' },
    ];
    for (const emp of emprestimos) {
      sheetEmp
        .addRow({
          tipoItem: emp.tipoItem,
          item: emp.exemplarLivro?.livro.titulo ?? (emp.equipamento ? `${emp.equipamento.modelo} (${emp.equipamento.patrimonio})` : null),
          usuario: emp.usuario?.nome ?? null,
          email: emp.usuario?.email ?? null,
          dataEmprestimo: emp.dataEmprestimo,
          dataPrevistaDevolucao: emp.dataPrevistaDevolucao,
          dataDevolucao: emp.dataDevolucao,
          status: emp.status,
          usoInstitucional: emp.usoInstitucional,
          usoPorAluno: emp.usoPorAluno,
          observacoes: emp.observacoes,
        })
        .commit();
    }
    sheetEmp.commit();

    await workbook.commit();
  }

  /**
   * Importação em lote do acervo de livros — cada linha da planilha é UM
   * exemplar físico (código de tombamento único); título+autor iguais
   * (case-insensitive) reaproveitam o mesmo `Livro`, senão criam um novo.
   * Substitui o processo manual de gerar SQL e rodar via `psql` na VPS
   * (ver playbook documentado no CLAUDE.md) por um upload direto na tela.
   * Reaproveita `LivroService.create`/`addExemplar` de propósito — mantém
   * as mesmas validações e auditoria já usadas no cadastro manual (ex.:
   * tombamento duplicado vira erro por linha, não trava o lote inteiro).
   */
  async importarLivros(linhas: LinhaImportarLivroDto[], usuarioId: string) {
    const resultado: { linha: number; titulo: string; codigoTombamento: string; status: 'ok' | 'erro'; mensagem?: string }[] = [];
    const cacheLivroId = new Map<string, string>();

    for (let i = 0; i < linhas.length; i++) {
      const linha = linhas[i];
      try {
        const chave = `${linha.titulo.trim().toLowerCase()}::${linha.autor.trim().toLowerCase()}`;
        let livroId = cacheLivroId.get(chave);
        if (!livroId) {
          const existente = await this.prisma.livro.findFirst({
            where: { titulo: { equals: linha.titulo.trim(), mode: 'insensitive' }, autor: { equals: linha.autor.trim(), mode: 'insensitive' } },
          });
          if (existente) {
            livroId = existente.id;
          } else {
            const novo = await this.livroService.create(
              {
                titulo: linha.titulo.trim(),
                autor: linha.autor.trim(),
                editora: linha.editora,
                isbn: linha.isbn,
                categoria: linha.categoria,
                anoPublicacao: linha.anoPublicacao,
                cdd: linha.cdd,
                cutter: linha.cutter,
                edicao: linha.edicao,
              },
              usuarioId,
            );
            livroId = novo.id;
          }
          cacheLivroId.set(chave, livroId);
        }

        await this.livroService.addExemplar(livroId, { codigoTombamento: linha.codigoTombamento.trim(), localizacao: linha.localizacao }, usuarioId);
        resultado.push({ linha: i + 2, titulo: linha.titulo, codigoTombamento: linha.codigoTombamento, status: 'ok' });
      } catch (e: any) {
        resultado.push({ linha: i + 2, titulo: linha.titulo, codigoTombamento: linha.codigoTombamento, status: 'erro', mensagem: e?.message ?? 'Erro desconhecido.' });
      }
    }

    await this.audit.log({
      usuarioId,
      acao: 'IMPORT',
      entidade: 'Livro',
      dadosDepois: { total: linhas.length, sucesso: resultado.filter(r => r.status === 'ok').length, erro: resultado.filter(r => r.status === 'erro').length },
    });

    return {
      total: linhas.length,
      sucesso: resultado.filter(r => r.status === 'ok').length,
      erro: resultado.filter(r => r.status === 'erro').length,
      detalhes: resultado,
    };
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
