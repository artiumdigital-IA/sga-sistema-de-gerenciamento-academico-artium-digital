import { PartialType } from '@nestjs/swagger';
import { CreateTipoChamadoManutencaoDto } from './create-tipo-chamado-manutencao.dto';

export class UpdateTipoChamadoManutencaoDto extends PartialType(CreateTipoChamadoManutencaoDto) {}
