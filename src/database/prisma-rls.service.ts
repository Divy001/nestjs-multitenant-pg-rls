import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { TenantContextService } from '../common/context/tenant-context.service';

@Injectable()
export class PrismaRlsService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaRlsService.name);

  constructor(private readonly tenantContext: TenantContextService) {
    super();
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('PostgreSQL connected with RLS enforcement active');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async withTenantContext<T>(
    callback: (tx: PrismaClient) => Promise<T>,
  ): Promise<T> {
    const tenantId = this.tenantContext.getTenantId();

    return this.$transaction(async (tx) => {
      // Set session variable scoped ONLY to current transaction (is_local = true)
      await tx.$executeRaw`SELECT set_config('app.current_tenant', ${tenantId}, true)`;

      return callback(tx as unknown as PrismaClient);
    });
  }
}
