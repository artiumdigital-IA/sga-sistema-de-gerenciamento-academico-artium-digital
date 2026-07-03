import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class UpdateBrandingDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  nomeInstituicao?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  nomeCompleto?: string;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'Cor deve estar no formato hexadecimal, ex: #1C3A6B.' })
  corPrimaria?: string;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'Cor deve estar no formato hexadecimal, ex: #1C3A6B.' })
  corSecundaria?: string;
}
