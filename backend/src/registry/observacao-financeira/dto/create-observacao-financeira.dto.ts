import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateObservacaoFinanceiraDto {
  @ApiProperty({ example: 'Aluno solicitou renegociação da 3ª parcela.' })
  @IsString()
  observacao: string;
}
