import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MinhaSenhaDto {
  @ApiProperty({ example: 'SenhaAtual@2026' })
  @IsString()
  senhaAtual: string;

  @ApiProperty({ example: 'NovaSenha@2026', minLength: 8 })
  @IsString()
  @MinLength(8)
  novaSenha: string;
}
