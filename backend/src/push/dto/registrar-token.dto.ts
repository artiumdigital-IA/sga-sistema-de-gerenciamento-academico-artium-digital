import { IsIn, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegistrarTokenDto {
  @ApiProperty({ description: 'Expo push token do dispositivo (obtido via expo-notifications)' })
  @IsString()
  token: string;

  @ApiPropertyOptional({ enum: ['ios', 'android'] })
  @IsOptional()
  @IsIn(['ios', 'android'])
  plataforma?: string;
}
