import { PartialType } from '@nestjs/swagger';
import { CreateMotivoTransferenciaDto } from './create-motivo-transferencia.dto';

export class UpdateMotivoTransferenciaDto extends PartialType(CreateMotivoTransferenciaDto) {}
