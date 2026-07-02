import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddPrerequisitoDto {
  @ApiProperty({ example: 'uuid-da-disciplina-pre-requisito' })
  @IsUUID()
  prerequisitoId: string;
}
