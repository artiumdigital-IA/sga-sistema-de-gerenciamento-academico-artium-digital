import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBoletoDto {
  @ApiProperty() @IsString() @IsNotEmpty() parcelaId: string;
  @ApiProperty() @IsString() @IsNotEmpty() contaBancariaId: string;
}
