import { PartialType, OmitType } from '@nestjs/swagger';
import { CreatePagamentoPrestadorDto } from './create-pagamento-prestador.dto';

export class UpdatePagamentoPrestadorDto extends PartialType(OmitType(CreatePagamentoPrestadorDto, ['colaboradorId'] as const)) {}
