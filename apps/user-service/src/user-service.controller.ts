import { USER_PATTERNS } from '@app/common';
import { PingUserDto } from '@app/dto';
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UserServiceService } from './user-service.service';

@Controller()
export class UserServiceController {
  constructor(private readonly userServiceService: UserServiceService) {}

  @MessagePattern(USER_PATTERNS.PING)
  ping(@Payload() payload: PingUserDto) {
    return this.userServiceService.ping(payload);
  }
}
