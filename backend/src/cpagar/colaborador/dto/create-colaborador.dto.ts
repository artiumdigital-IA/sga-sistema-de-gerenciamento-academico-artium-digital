import { IsString, IsOptional, IsEnum, IsNumber, IsBoolean, IsDateString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TipoVinculo } from '@prisma/client';

export { TipoVinculo };

export class CreateColaboradorDto {
  @ApiProperty() @IsString() nome: string;
  @ApiProperty() @IsString() cpf: string;
  @ApiPropertyOptional() @IsOptional() @IsString() email?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() telefone?: string;
  @ApiProperty({ enum: TipoVinculo }) @IsEnum(TipoVinculo) tipoVinculo: TipoVinculo;
  @ApiPropertyOptional() @IsOptional() @IsString() cargo?: string;
  @ApiPropertyOptional({ description: 'Só relevante pra COLABORADOR — Prestador de Serviço usa valor por pagamento avulso' })
  @IsOptional() @IsNumber() @Min(0) salarioBase?: number;
  @ApiPropertyOptional({ default: 0 }) @IsOptional() @IsNumber() @Min(0) numeroDependentes?: number;
  @ApiProperty() @IsDateString() dataAdmissao: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() dataDemissao?: string;
  @ApiPropertyOptional({ default: true }) @IsOptional() @IsBoolean() ativo?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() banco?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() agencia?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() contaBancaria?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() observacoes?: string;
}
