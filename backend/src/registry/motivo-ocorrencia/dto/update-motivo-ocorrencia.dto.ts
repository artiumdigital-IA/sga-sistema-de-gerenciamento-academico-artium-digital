import { PartialType } from '@nestjs/swagger';
import { CreateMotivoOcorrenciaDto } from './create-motivo-ocorrencia.dto';

export class UpdateMotivoOcorrenciaDto extends PartialType(CreateMotivoOcorrenciaDto) {}
