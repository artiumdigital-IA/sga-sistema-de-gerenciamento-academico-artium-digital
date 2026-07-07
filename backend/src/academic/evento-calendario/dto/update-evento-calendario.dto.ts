import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateEventoCalendarioDto } from './create-evento-calendario.dto';

export class UpdateEventoCalendarioDto extends PartialType(
  OmitType(CreateEventoCalendarioDto, ['periodoLetivoId'] as const),
) {}
