import { PartialType } from '@nestjs/swagger';
import { CreateRamalDto } from './create-ramal.dto';

export class UpdateRamalDto extends PartialType(CreateRamalDto) {}
