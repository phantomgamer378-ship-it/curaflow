import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Default test password
  const passwordHash = bcrypt.hashSync("password123", 10);

  // 1. Create a Clinic
  const clinic = await prisma.clinic.create({
    data: {
      name: "Test Clinic",
      openTime: "09:00",
      closeTime: "17:00",
    },
  });
  console.log(`Clinic created: ${clinic.id}`);

  // 2. Create Admin
  const adminProfile = await prisma.profile.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      passwordHash,
      role: "admin",
      name: "Test Admin",
    },
  });
  console.log(`Admin created: ${adminProfile.email}`);

  // 3. Create Doctor
  // Upsert profile first
  const docProfile = await prisma.profile.upsert({
    where: { email: "doctor@example.com" },
    update: {},
    create: {
      email: "doctor@example.com",
      passwordHash,
      role: "doctor",
      name: "Dr. Test Doctor",
    },
  });
  
  // Then create doctor record
  const doctor = await prisma.doctor.findUnique({
    where: { profileId: docProfile.id }
  });
  if (!doctor) {
    await prisma.doctor.create({
      data: {
        profileId: docProfile.id,
        clinicId: clinic.id,
        specialty: "General Practice",
      },
    });
  }
  console.log(`Doctor created: ${docProfile.email}`);

  // 4. Create Patient
  // Upsert profile
  const patProfile = await prisma.profile.upsert({
    where: { email: "example@gmail.com" },
    update: {},
    create: {
      email: "example@gmail.com",
      passwordHash,
      role: "patient",
      name: "Test Patient",
    },
  });

  // Then create patient record
  const patient = await prisma.patient.findUnique({
    where: { profileId: patProfile.id }
  });
  if (!patient) {
    await prisma.patient.create({
      data: {
        profileId: patProfile.id,
        dob: new Date("1990-01-01"),
      },
    });
  }
  console.log(`Patient created: ${patProfile.email}`);

  console.log("Database seeding completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
