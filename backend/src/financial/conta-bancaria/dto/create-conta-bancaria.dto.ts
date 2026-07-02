import { IsString, IsOptional, IsEnum, IsNumber, IsBoolean, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TipoContaBancaria } from '@prisma/client';

export { TipoContaBancaria };

export class CreateContaBancariaDto {
  @ApiProperty() @IsString() banco: string;
  @ApiProperty() @IsString() agencia: string;
  @ApiProperty() @IsString() numeroConta: string;
  @ApiPropertyOptional({ enum: TipoContaBancaria, default: 'CORRENTE' })
  @IsOptional() @IsEnum(TipoContaBancaria) tipoConta?: TipoContaBancaria;
  @ApiProperty() @IsString() titular: string;
  @ApiPropertyOptional() @IsOptional() @IsString() cnpjCpfTitular?: string;
  @ApiPropertyOptional({ default: 0 }) @IsOptional() @IsNumber() @Min(0) saldoInicial?: number;
  @ApiPropertyOptional({ default: true }) @IsOptional() @IsBoolean() ativa?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() observacoes?: string;
}
