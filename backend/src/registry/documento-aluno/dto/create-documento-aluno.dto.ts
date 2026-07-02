import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDocumentoAlunoDto {
  @ApiProperty({ example: 'RG' })
  @IsString()
  tipo: string;
}
