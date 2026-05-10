import {
  PingAuthDto,
  PingAuthResponseDto,
  PingUserDto,
  PingUserResponseDto,
} from '@app/dto';
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

  @Post('user/ping')
  pingUser(@Body() body: PingUserDto): Promise<PingUserResponseDto> {
    return this.apiGatewayService.pingUser(body);
  }
}
