import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { ResetSenhaDto } from './dto/reset-senha.dto';
import { MinhaSenhaDto } from './dto/minha-senha.dto';
import { UpdateMeuPerfilDto } from './dto/update-meu-perfil.dto';

const SAFE_SELECT = {
  id: true,
  email: true,
  perfil: true,
  status: true,
  mfaAtivo: true,
  nome: true,
  telefone: true,
  fotoUrl: true,
  alunoId: true,
  professorId: true,
  criadoEm: true,
  atualizadoEm: true,
  // senhaHash e mfaSegredo NUNCA expostos
};

@Injectable()
export class UsuariosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(dto: CreateUsuarioDto, operadorId?: string) {
    const existe = await this.prisma.usuario.findUnique({ where: { email: dto.email } });
    if (existe) throw new ConflictException(`E-mail ${dto.email} ja esta em uso.`);

    if (dto.alunoId && dto.perfil !== 'ALUNO') {
      throw new BadRequestException('alunoId so pode ser usado com perfil ALUNO.');
    }
    if (dto.professorId && dto.perfil !== 'PROFESSOR') {
      throw new BadRequestException('professorId so pode ser usado com perfil PROFESSOR.');
    }

    const senhaHash = await bcrypt.hash(dto.senha, 12);

    const usuario = await this.prisma.usuario.create({
      data: {
        email: dto.email,
        senhaHash,
        perfil: dto.perfil,
        alunoId: dto.alunoId,
        professorId: dto.professorId,
      },
      select: SAFE_SELECT,
    });

    await this.audit.log({
      usuarioId: operadorId,
      acao: 'CREATE',
      entidade: 'Usuario',
      entidadeId: usuario.id,
      dadosDepois: { email: usuario.email, perfil: usuario.perfil },
    });

    return usuario;
  }

  async findAll() {
    return this.prisma.usuario.findMany({
      select: {
        ...SAFE_SELECT,
        aluno: { select: { id: true, ra: true, nome: true } },
        professor: { select: { id: true, nome: true } },
      },
      orderBy: { criadoEm: 'desc' },
    });
  }

  async findOne(id: string) {
    const u = await this.prisma.usuario.findUnique({
      where: { id },
      select: {
        ...SAFE_SELECT,
        aluno: { select: { id: true, ra: true, nome: true, curso: { select: { nome: true } } } },
        professor: { select: { id: true, nome: true } },
      },
    });
    if (!u) throw new NotFoundException(`Usuario ${id} nao encontrado.`);
    return u;
  }

  async update(id: string, dto: UpdateUsuarioDto, operadorId?: string) {
    const antes = await this.findOne(id);

    const usuario = await this.prisma.usuario.update({
      where: { id },
      data: {
        perfil: dto.perfil,
        status: dto.status,
        alunoId: dto.alunoId,
        professorId: dto.professorId,
      },
      select: SAFE_SELECT,
    });

    await this.audit.log({
      usuarioId: operadorId,
      acao: 'UPDATE',
      entidade: 'Usuario',
      entidadeId: id,
      dadosAntes: { perfil: antes.perfil, status: antes.status },
      dadosDepois: { perfil: usuario.perfil, status: usuario.status },
    });

    return usuario;
  }

  async bloquear(id: string, operadorId?: string) {
    return this.update(id, { status: 'BLOQUEADO' }, operadorId);
  }

  async ativar(id: string, operadorId?: string) {
    return this.update(id, { status: 'ATIVO' }, operadorId);
  }

  async resetarSenha(id: string, dto: ResetSenhaDto, operadorId?: string) {
    await this.findOne(id); // garante existencia
    const senhaHash = await bcrypt.hash(dto.novaSenha, 12);

    await this.prisma.usuario.update({
      where: { id },
      data: { senhaHash },
    });

    await this.audit.log({
      usuarioId: operadorId,
      acao: 'RESET_SENHA',
      entidade: 'Usuario',
      entidadeId: id,
    });

    return { message: 'Senha redefinida com sucesso.' };
  }

  async meuPerfil(usuarioId: string) {
    return this.findOne(usuarioId);
  }

  async atualizarMeuPerfil(usuarioId: string, dto: UpdateMeuPerfilDto) {
    const antes = await this.findOne(usuarioId);

    const usuario = await this.prisma.usuario.update({
      where: { id: usuarioId },
      data: {
        nome: dto.nome,
        telefone: dto.telefone,
      },
      select: SAFE_SELECT,
    });

    await this.audit.log({
      usuarioId,
      acao: 'UPDATE',
      entidade: 'Usuario',
      entidadeId: usuarioId,
      dadosAntes: { nome: antes.nome, telefone: antes.telefone },
      dadosDepois: { nome: usuario.nome, telefone: usuario.telefone },
    });

    return usuario;
  }

  async atualizarMinhaFoto(usuarioId: string, fotoUrl: string) {
    const usuario = await this.prisma.usuario.update({
      where: { id: usuarioId },
      data: { fotoUrl },
      select: SAFE_SELECT,
    });

    await this.audit.log({
      usuarioId,
      acao: 'UPDATE',
      entidade: 'Usuario',
      entidadeId: usuarioId,
      dadosDepois: { fotoUrl },
    });

    return usuario;
  }

  async alterarMinhaSenha(usuarioId: string, dto: MinhaSenhaDto) {
    const u = await this.prisma.usuario.findUnique({ where: { id: usuarioId } });
    if (!u) throw new NotFoundException('Usuario nao encontrado.');

    const valido = await bcrypt.compare(dto.senhaAtual, u.senhaHash);
    if (!valido) throw new UnauthorizedException('Senha atual incorreta.');

    const senhaHash = await bcrypt.hash(dto.novaSenha, 12);
    await this.prisma.usuario.update({ where: { id: usuarioId }, data: { senhaHash } });

    await this.audit.log({
      usuarioId,
      acao: 'ALTERAR_SENHA',
      entidade: 'Usuario',
      entidadeId: usuarioId,
    });

    return { message: 'Senha alterada com sucesso.' };
  }
}
