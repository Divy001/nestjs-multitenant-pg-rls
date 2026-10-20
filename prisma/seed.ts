import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.patientRecord.deleteMany();
  await prisma.tenant.deleteMany();

  const apollo = await prisma.tenant.create({
    data: {
      name: 'Apollo Hospitals',
      slug: 'apollo',
      records: {
        create: [
          {
            patientName: 'Rahul Sharma',
            diagnosis: 'Type 2 Diabetes',
            treatment: 'Metformin 500mg',
          },
          {
            patientName: 'Priya Patel',
            diagnosis: 'Hypertension',
            treatment: 'Amlodipine 5mg',
          },
        ],
      },
    },
  });

  const max = await prisma.tenant.create({
    data: {
      name: 'Max Healthcare',
      slug: 'max',
      records: {
        create: [
          {
            patientName: 'Amit Verma',
            diagnosis: 'Acute Bronchitis',
            treatment: 'Azithromycin 500mg',
          },
        ],
      },
    },
  });

  console.log('--- SEED COMPLETED SUCCESSFULLY ---');
  console.log(`Apollo Tenant ID: ${apollo.id}`);
  console.log(`Max Healthcare Tenant ID: ${max.id}`);
  console.log('-----------------------------------');
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
