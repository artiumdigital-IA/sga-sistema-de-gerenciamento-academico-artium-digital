import { PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { CursoStatus } from '@prisma/client';
import { CreateCursoDto } from './create-curso.dto';

export class UpdateCursoDto extends PartialType(CreateCursoDto) {
  @IsOptional()
  @IsEnum(CursoStatus)
  status?: CursoStatus;
}
