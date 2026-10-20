import {
  Injectable,
  NestMiddleware,
  BadRequestException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantContextService } from '../context/tenant-context.service';

@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  constructor(private readonly tenantContext: TenantContextService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const tenantId = req.headers['x-tenant-id'] as string;

    if (!tenantId || tenantId.trim() === '') {
      throw new BadRequestException(
        'Missing required header: X-Tenant-Id is mandatory for multi-tenant access.',
      );
    }

    this.tenantContext.run(tenantId, () => {
      next();
    });
  }
}
