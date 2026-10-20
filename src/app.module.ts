import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TenantContextModule } from './common/context/tenant-context.module';
import { TenantContextMiddleware } from './common/middleware/tenant-context.middleware';
import { DatabaseModule } from './database/database.module';
import { PatientsModule } from './patients/patients.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TenantContextModule,
    DatabaseModule,
    PatientsModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantContextMiddleware).forRoutes('*');
  }
}
