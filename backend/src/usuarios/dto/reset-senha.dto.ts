import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetSenhaDto {
  @ApiProperty({ example: 'NovaSenha@2026', minLength: 8 })
  @IsString()
  @MinLength(8)
  novaSenha: string;
}
