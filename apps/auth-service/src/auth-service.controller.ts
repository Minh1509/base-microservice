import { AUTH_PATTERNS } from '@app/shared';
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AuthServiceService } from './auth-service.service';
import { LoginDto, PingAuthDto } from './dto';

@Controller()
export class AuthServiceController {
  constructor(private readonly authServiceService: AuthServiceService) {}

  @MessagePattern(AUTH_PATTERNS.PING)
  ping(@Payload() payload: PingAuthDto) {
    return this.authServiceService.ping(payload);
  }

  @MessagePattern(AUTH_PATTERNS.LOGIN)
  login(@Payload() payload: LoginDto) {
    return this.authServiceService.login(payload);
  }
}
