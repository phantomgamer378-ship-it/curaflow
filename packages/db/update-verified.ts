import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.profile.updateMany({
    data: {
      emailVerifiedAt: new Date(),
    },
  });
  console.log(`Updated ${result.count} profiles to be verified.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
