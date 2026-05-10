import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { configureApp } from '../src/bootstrap/configure-app';
import { AppModule } from '../src/app.module';

describe('HTTP API (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET / returns 404 when no root controller is registered', () => {
    return request(app.getHttpServer()).get('/').expect(404);
  });

  it('GET /git-repos rejects requests missing required query params (ValidationPipe)', () => {
    return request(app.getHttpServer()).get('/git-repos').expect(400);
  });

  it('GET /git-repos rejects invalid changedAfter (calendar date)', () => {
    return request(app.getHttpServer())
      .get('/git-repos')
      .query({ language: 'typescript', changedAfter: 'not-a-date' })
      .expect(400);
  });

  it('GET /git-repos rejects language values that could alter GitHub query semantics', () => {
    return request(app.getHttpServer())
      .get('/git-repos')
      .query({
        language: 'typescript repo:evil/evil',
        changedAfter: '2026-05-01',
      })
      .expect(400);
  });

  it('GET /git-repos rejects languages outside the supported enum', () => {
    return request(app.getHttpServer())
      .get('/git-repos')
      .query({ language: 'zig', changedAfter: '2026-05-01' })
      .expect(400);
  });

  it('GET /swagger-json exposes OpenAPI document', () => {
    return request(app.getHttpServer()).get('/swagger-json').expect(200);
  });
});
