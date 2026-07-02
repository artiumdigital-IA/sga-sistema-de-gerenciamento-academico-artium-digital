import { PartialType } from '@nestjs/swagger';
import { CreateCategoriaReceitaDto } from './create-categoria-receita.dto';

export class UpdateCategoriaReceitaDto extends PartialType(CreateCategoriaReceitaDto) {}
