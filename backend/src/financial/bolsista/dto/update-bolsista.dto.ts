import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateBolsistaDto } from './create-bolsista.dto';

export class UpdateBolsistaDto extends PartialType(OmitType(CreateBolsistaDto, ['alunoId'] as const)) {}
