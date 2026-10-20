import { Global, Module } from '@nestjs/common';
import { PrismaRlsService } from './prisma-rls.service';

@Global()
@Module({
  providers: [PrismaRlsService],
  exports: [PrismaRlsService],
})
export class DatabaseModule {}
