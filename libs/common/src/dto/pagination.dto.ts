import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, Max, Min } from 'class-validator';

export class PaginationQueryDto {
  @ApiPropertyOptional({
    type: Number,
    example: 1,
    description: 'This field is used for normal pagination',
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  page: number;

  @ApiProperty({
    type: Number,
    example: 100,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  @Max(100)
  pageSize: number;
}

@Exclude()
export class PaginationMetadataResponseDto {
  @Expose()
  @ApiProperty()
  page: number;

  @Expose()
  @ApiProperty()
  pageSize: number;

  @Expose()
  @ApiProperty()
  totalPages: number;

  @Expose()
  @ApiProperty()
  total: number;
}

@Exclude()
export class PaginationResponseDto<T> {
  @Expose()
  @ApiProperty()
  data: T[];

  @Expose()
  @ApiProperty({
    type: PaginationMetadataResponseDto,
  })
  pagination: PaginationMetadataResponseDto;
}
