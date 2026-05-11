import { IsOptional, IsString, MaxLength } from 'class-validator';

export class PingAuthDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  message?: string;
}
