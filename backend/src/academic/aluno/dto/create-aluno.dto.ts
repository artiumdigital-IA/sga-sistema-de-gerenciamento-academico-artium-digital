import { IsString, IsEmail, IsOptional, IsDateString, IsEnum, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Sexo, CorRaca, FormaIngresso, SituacaoVinculo } from '@prisma/client';

export { Sexo, CorRaca, FormaIngresso, SituacaoVinculo };

export class CreateAlunoDto {
  @ApiProperty() @IsUUID() cursoId: string;
  @ApiProperty() @IsUUID() matrizCurricularId: string;
  @ApiPropertyOptional() @IsOptional() @IsString() ra?: string;
  @ApiProperty() @IsString() nome: string;
  @ApiProperty() @IsString() cpf: string;
  @ApiProperty() @IsDateString() dataNascimento: string;
  @ApiProperty({ enum: Sexo }) @IsEnum(Sexo) sexo: Sexo;
  @ApiProperty({ enum: CorRaca }) @IsEnum(CorRaca) corRaca: CorRaca;
  @ApiPropertyOptional() @IsOptional() @IsString() nacionalidade?: string;
  @ApiProperty({ enum: FormaIngresso }) @IsEnum(FormaIngresso) formaIngresso: FormaIngresso;
  @ApiProperty() @IsDateString() dataIngresso: string;
  @ApiProperty({ enum: SituacaoVinculo }) @IsEnum(SituacaoVinculo) situacaoVinculo: SituacaoVinculo;
  @ApiProperty() @IsEmail() email: string;
  @ApiPropertyOptional() @IsOptional() @IsString() telefone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() cep?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() logradouro?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() numero?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() complemento?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() bairro?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() uf?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() municipio?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() usuarioId?: string;
}
