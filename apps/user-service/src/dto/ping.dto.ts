import { IsOptional, IsString, MaxLength } from 'class-validator';

export class PingUserDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  message?: string;
}
