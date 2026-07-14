import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class DevolverEmprestimoDto {
  @ApiPropertyOptional() @IsOptional() @IsString() observacoes?: string;
  @ApiPropertyOptional({ default: false, description: 'Marca o item como extraviado em vez de devolvido' })
  @IsOptional() @IsBoolean() perdido?: boolean;
}
