import { PartialType } from '@nestjs/swagger';
import { CreateContaBancariaDto } from './create-conta-bancaria.dto';

export class UpdateContaBancariaDto extends PartialType(CreateContaBancariaDto) {}
