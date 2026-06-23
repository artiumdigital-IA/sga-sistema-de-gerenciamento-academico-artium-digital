import { PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { MatrizStatus } from '@prisma/client';
import { CreateMatrizDto } from './create-matriz.dto';

export class UpdateMatrizDto extends PartialType(CreateMatrizDto) {
  @IsOptional()
  @IsEnum(MatrizStatus)
  status?: MatrizStatus;
}
