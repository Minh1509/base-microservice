import {
  LoginDto,
  LoginResponseDto,
  PingAuthDto,
  PingAuthResponseDto,
  PingUserDto,
  PingUserResponseDto,
} from '@app/shared';
import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiGatewayService } from './api-gateway.service';

@Controller()
export class ApiGatewayController {
  constructor(private readonly apiGatewayService: ApiGatewayService) {}

  @Get('health')
  health() {
    return { status: 'ok', service: 'api-gateway' };
  }

  @Post('auth/ping')
  pingAuth(@Body() body: PingAuthDto): Promise<PingAuthResponseDto> {
    return this.apiGatewayService.pingAuth(body);
  }

  @Post('auth/login')
  login(@Body() body: LoginDto): Promise<LoginResponseDto> {
    return this.apiGatewayService.login(body);
  }

  @Post('user/ping')
  pingUser(@Body() body: PingUserDto): Promise<PingUserResponseDto> {
    return this.apiGatewayService.pingUser(body);
  }
}
