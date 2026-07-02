import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class EnviarConversaDto {
  @ApiProperty({ example: 'Bom dia! A reunião é às 18h na sala 12.' })
  @IsString()
  @MinLength(1)
  corpo: string;
}
