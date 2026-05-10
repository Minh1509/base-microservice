import { RpcException } from '@nestjs/microservices';
import { RpcErrorPayload } from './rpc-error';

export class DomainRpcException extends RpcException {
  constructor(payload: RpcErrorPayload) {
    super(payload);
  }

  getPayload(): RpcErrorPayload {
    return this.getError() as RpcErrorPayload;
  }
}
