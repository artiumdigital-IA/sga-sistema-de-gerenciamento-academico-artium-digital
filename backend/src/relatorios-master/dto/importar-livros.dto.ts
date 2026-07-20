import { IsArray, IsString, IsOptional, IsInt, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class LinhaImportarLivroDto {
  @ApiProperty() @IsString() titulo: string;
  @ApiProperty() @IsString() autor: string;
  @ApiProperty() @IsString() codigoTombamento: string;
  @IsOptional() @IsString() editora?: string;
  @IsOptional() @IsString() isbn?: string;
  @IsOptional() @IsString() categoria?: string;
  @IsOptional() @IsInt() @Min(0) anoPublicacao?: number;
  @IsOptional() @IsString() cdd?: string;
  @IsOptional() @IsString() cutter?: string;
  @IsOptional() @IsString() edicao?: string;
  @IsOptional() @IsString() localizacao?: string;
}

export class ImportarLivrosDto {
  @ApiProperty({ type: [LinhaImportarLivroDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LinhaImportarLivroDto)
  linhas: LinhaImportarLivroDto[];
}
