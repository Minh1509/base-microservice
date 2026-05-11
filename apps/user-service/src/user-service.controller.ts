import { USER_PATTERNS } from '@app/common';
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { PingUserDto } from './dto';
import { UserServiceService } from './user-service.service';

@Controller()
export class UserServiceController {
  constructor(private readonly userServiceService: UserServiceService) {}

  @MessagePattern(USER_PATTERNS.PING)
  ping(@Payload() payload: PingUserDto) {
    return this.userServiceService.ping(payload);
  }
}
