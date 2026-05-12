import { HttpStatus, UnprocessableEntityException, ValidationPipe } from '@nestjs/common';
import { ValidationError } from 'class-validator';
import { HttpErrorResponse } from '../exception/http-error';

interface ValidationDetails {
  [key: string]: string | ValidationDetails;
}

const buildDetails = (errors: ValidationError[]): ValidationDetails => {
  const getDetails = (
    acc: ValidationDetails,
    val: ValidationError,
  ): ValidationDetails => {
    const { property, constraints, children } = val;
    if (constraints) {
      acc[property] = Object.values(constraints).join(', ');
    } else if (children?.length) {
      acc[property] = children.reduce(getDetails, {});
    }
    return acc;
  };
  return errors.reduce(getDetails, {});
};

export class PayloadValidationPipe extends ValidationPipe {
  constructor() {
    super({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
      errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      exceptionFactory: (errors: ValidationError[]) => {
        const fields = errors.map((e) => e.property).join(', ');
        const body: Partial<HttpErrorResponse> = {
          errorCode: 'VALIDATION_FAILED',
          message: `Validation failed: ${fields}`,
          details: buildDetails(errors),
        };
        return new UnprocessableEntityException(body);
      },
    });
  }
}
