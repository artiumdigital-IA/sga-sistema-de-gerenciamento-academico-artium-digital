import { PartialType } from '@nestjs/swagger';
import { CreateTabelaInssDto } from './create-tabela-inss.dto';

export class UpdateTabelaInssDto extends PartialType(CreateTabelaInssDto) {}
