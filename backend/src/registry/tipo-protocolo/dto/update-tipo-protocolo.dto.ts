import { PartialType } from '@nestjs/swagger';
import { CreateTipoProtocoloDto } from './create-tipo-protocolo.dto';

export class UpdateTipoProtocoloDto extends PartialType(CreateTipoProtocoloDto) {}
