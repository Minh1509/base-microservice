import { BaseResponseDto } from '@app/common';

export class PingAuthResponseDto extends BaseResponseDto {
  service!: string;
  env!: string;
  echo!: unknown;
  ts!: string;
}
