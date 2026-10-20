import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

export interface TenantStore {
  tenantId: string;
}

@Injectable()
export class TenantContextService {
  private readonly asyncLocalStorage = new AsyncLocalStorage<TenantStore>();

  run(tenantId: string, callback: () => void) {
    this.asyncLocalStorage.run({ tenantId }, callback);
  }

  getTenantId(): string {
    const store = this.asyncLocalStorage.getStore();
    if (!store || !store.tenantId) {
      throw new UnauthorizedException(
        'Tenant context missing: Unable to identify active tenant for this request.',
      );
    }
    return store.tenantId;
  }
}
