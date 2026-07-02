import { IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMensagemDto {
  @ApiProperty()
  @IsUUID()
  destinatarioId: string;

  @ApiProperty({ example: 'Pendência de documentação' })
  @IsString()
  assunto: string;

  @ApiProperty()
  @IsString()
  corpo: string;
}
