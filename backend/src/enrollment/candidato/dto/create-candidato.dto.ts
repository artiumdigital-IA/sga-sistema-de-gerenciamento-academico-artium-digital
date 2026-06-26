import { IsString, IsEmail, IsDateString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCandidatoDto {
  @ApiProperty() @IsString() nome: string;
  @ApiProperty() @IsString() cpf: string;
  @ApiProperty() @IsEmail() email: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() telefone?: string;
  @ApiProperty() @IsDateString() dataNascimento: string;
  @ApiProperty() @IsString() sexo: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() corRaca?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() nacionalidade?: string;
}
