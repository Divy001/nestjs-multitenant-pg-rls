import { Controller, Get, Post, Body } from '@nestjs/common';
import { PatientsService } from './patients.service';

export class CreatePatientDto {
  patientName: string;
  diagnosis: string;
  treatment: string;
}

@Controller('api/v1/patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Get()
  async findAll() {
    return this.patientsService.findAll();
  }

  @Post()
  async create(@Body() dto: CreatePatientDto) {
    return this.patientsService.create(dto);
  }
}
