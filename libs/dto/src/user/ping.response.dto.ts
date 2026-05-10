import { BaseResponseDto } from '@app/common';

export class PingUserResponseDto extends BaseResponseDto {
  service!: string;
  env!: string;
  echo!: unknown;
  ts!: string;
}
