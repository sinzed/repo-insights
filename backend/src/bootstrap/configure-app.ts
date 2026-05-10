import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function configureApp(app: INestApplication): void {
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );
  app.enableCors({
    origin: ['http://localhost:4200', 'http://127.0.0.1:4200'],
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Repo Insights API')
    .setDescription('HTTP API for Git repo search and insights.')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('swagger', app, document);
}
