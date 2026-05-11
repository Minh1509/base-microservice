import { appConfig } from '@app/config';
import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication): void {
  const { serviceName } = appConfig();
  const config = new DocumentBuilder()
    .setTitle(`${serviceName} API`)
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, document, {
    explorer: true,
    swaggerOptions: {
      customSiteTitle: `${serviceName} API Documentation`,
      persistAuthorization: true,
      displayRequestDuration: true,
      docExpansion: 'list',
    },
  });
}
