import { PartialType } from '@nestjs/swagger';
import { CreateTabelaIrrfDto } from './create-tabela-irrf.dto';

export class UpdateTabelaIrrfDto extends PartialType(CreateTabelaIrrfDto) {}
