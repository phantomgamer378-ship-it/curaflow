import { config } from "dotenv";
config();

import { prisma } from "@clinic/db";
import {
  invokeAppointmentAssistant,
  invokeQueueIntelligence,
  invokeDoctorNoteAssistant,
  invokeReminderAgent,
  invokeAdminInsights,
  isAIConfigured
} from "@clinic/ai";

async function main() {
  console.log("Checking AI Configuration:", isAIConfigured());
  if (!isAIConfigured()) {
    console.error("AI is not configured. Missing GROQ_API_KEY.");
    process.exit(1);
  }

  // Get some basic data
  const clinic = await prisma.clinic.findFirst();
  const adminProfile = await prisma.profile.findFirst({ where: { role: "admin" } });
  const doctorProfile = await prisma.profile.findFirst({ where: { role: "doctor" } });
  const patientProfile = await prisma.profile.findFirst({ where: { role: "patient" } });
  
  if (!clinic || !adminProfile || !doctorProfile || !patientProfile) {
    console.error("Missing seed data (clinic, admin, doctor, patient). Please seed the DB.");
    process.exit(1);
  }

  const thread_id = "test-thread-" + Date.now();

  try {
    console.log("\n--- Testing Appointment Assistant ---");
    const res1 = await invokeAppointmentAssistant({
      clinic_id: clinic.id,
      user_id: patientProfile.id,
      role: "patient",
      message: "I want to book an appointment with a general doctor.",
      thread_id
    });
    console.log("✅ Success:", JSON.stringify(res1, null, 2).substring(0, 300) + "...");
  } catch (err: any) {
    console.error("❌ Failed Appointment Assistant:", err.message);
  }

  try {
    console.log("\n--- Testing Queue Intelligence ---");
    const res2 = await invokeQueueIntelligence({
      clinic_id: clinic.id,
      user_id: patientProfile.id,
      role: "patient",
      message: "How long is the wait right now?",
      thread_id
    });
    console.log("✅ Success:", JSON.stringify(res2, null, 2).substring(0, 300) + "...");
  } catch (err: any) {
    console.error("❌ Failed Queue Intelligence:", err.message);
  }

  try {
    console.log("\n--- Testing Doctor Note Assistant ---");
    const res3 = await invokeDoctorNoteAssistant({
      clinic_id: clinic.id,
      user_id: doctorProfile.id,
      role: "doctor",
      message: "Patient complains of headache and slight fever since yesterday.",
      raw_note: "Patient complains of headache and slight fever since yesterday.",
      thread_id
    });
    console.log("✅ Success:", JSON.stringify(res3, null, 2).substring(0, 300) + "...");
  } catch (err: any) {
    console.error("❌ Failed Doctor Note Assistant:", err.message);
  }

  try {
    console.log("\n--- Testing Admin Insights ---");
    const res4 = await invokeAdminInsights({
      clinic_id: clinic.id,
      user_id: adminProfile.id,
      role: "admin",
      message: "What are the recent booking trends?",
      thread_id
    });
    console.log("✅ Success:", JSON.stringify(res4, null, 2).substring(0, 300) + "...");
  } catch (err: any) {
    console.error("❌ Failed Admin Insights:", err.message);
  }

  try {
    console.log("\n--- Testing Reminder Agent ---");
    const res5 = await invokeReminderAgent({
      clinic_id: clinic.id,
      user_id: adminProfile.id,
      role: "admin",
      message: "Draft a reminder for all patients tomorrow.",
      thread_id
    });
    console.log("✅ Success:", JSON.stringify(res5, null, 2).substring(0, 300) + "...");
  } catch (err: any) {
    console.error("❌ Failed Reminder Agent:", err.message);
  }

  console.log("\nAll tests completed.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
