import { PartialType } from '@nestjs/swagger';
import { CreateTipoRequerimentoDto } from './create-tipo-requerimento.dto';

export class UpdateTipoRequerimentoDto extends PartialType(CreateTipoRequerimentoDto) {}
