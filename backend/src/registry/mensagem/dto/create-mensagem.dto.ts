import { IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMensagemDto {
  @ApiProperty()
  @IsUUID()
  destinatarioId: string;

  // Opcional: mensagens de conversa (chat) nao precisam de assunto. A tela de
  // "Compor Mensagens" (broadcast, nao-conversa) continua podendo informar.
  @ApiPropertyOptional({ example: 'Pendência de documentação' })
  @IsOptional()
  @IsString()
  assunto?: string;

  @ApiProperty()
  @IsString()
  corpo: string;
}
