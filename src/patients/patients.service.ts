import { Injectable, Logger } from '@nestjs/common';
import { PrismaRlsService } from '../database/prisma-rls.service';
import { TenantContextService } from '../common/context/tenant-context.service';
import { CreatePatientDto } from './patients.controller';

@Injectable()
export class PatientsService {
  private readonly logger = new Logger(PatientsService.name);

  constructor(
    private readonly prismaRls: PrismaRlsService,
    private readonly tenantContext: TenantContextService,
  ) {}

  async findAll() {
    // Note: No WHERE tenantId clause needed in application code!
    // PostgreSQL RLS automatically restricts rows based on the active session context.
    return this.prismaRls.withTenantContext(async (tx) => {
      return tx.patientRecord.findMany({
        orderBy: { createdAt: 'desc' },
      });
    });
  }

  async create(dto: CreatePatientDto) {
    const tenantId = this.tenantContext.getTenantId();

    return this.prismaRls.withTenantContext(async (tx) => {
      return tx.patientRecord.create({
        data: {
          tenantId,
          patientName: dto.patientName,
          diagnosis: dto.diagnosis,
          treatment: dto.treatment,
        },
      });
    });
  }
}
