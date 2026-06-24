import { PartialType } from '@nestjs/swagger';
import { CreateOfertaDto } from './create-oferta.dto';

export class UpdateOfertaDto extends PartialType(CreateOfertaDto) {}
