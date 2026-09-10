import { ApiProperty } from '@nestjs/swagger';

export class SuccessResponseDto {
  @ApiProperty()
  success: boolean;
}

export class IdSuccessResponseDto {
  @ApiProperty()
  id: string;
}
