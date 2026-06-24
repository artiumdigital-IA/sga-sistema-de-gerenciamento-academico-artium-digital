import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { MatriculaStatus } from '@prisma/client';

export class UpdateMatriculaDisciplinaDto {
  @ApiPropertyOptional({ enum: MatriculaStatus })
  @IsOptional()
  @IsEnum(MatriculaStatus)
  status?: MatriculaStatus;
}
