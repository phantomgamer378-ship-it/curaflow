import { prisma } from "@clinic/db";

/**
 * Appointment integration hooks — safe, read-heavy wrappers around Prisma
 * that agent tools call. These enforce clinic scoping on every query.
 */

export async function getDoctorAvailability(clinicId: string, doctorId: string, date: string) {
  const doctor = await prisma.doctor.findFirst({
    where: { id: doctorId, clinicId, deletedAt: null },
    include: {
      availabilities: true,
      leaves: { where: { date: new Date(date) } },
    },
  });

  if (!doctor) return null;

  const dayOfWeek = new Date(date).getDay();
  const slots = doctor.availabilities.filter((a) => a.weekday === dayOfWeek);
  const isOnLeave = doctor.leaves.length > 0;

  return {
    doctor_id: doctor.id,
    date,
    is_on_leave: isOnLeave,
    available_slots: isOnLeave ? [] : slots.map((s) => ({
      start_time: s.startTime,
      end_time: s.endTime,
    })),
    slot_duration_min: doctor.slotDurationMin,
    max_patients_per_slot: doctor.maxPatientsPerSlot,
  };
}

export async function searchAvailableSlots(clinicId: string, specialty?: string, dateRange?: { from: string; to: string }) {
  const doctors = await prisma.doctor.findMany({
    where: {
      clinicId,
      deletedAt: null,
      ...(specialty ? { specialty } : {}),
    },
    include: {
      profile: { select: { name: true } as any },
      availabilities: true,
    },
  });

  return doctors.map((doc) => ({
    doctor_id: doc.id,
    doctor_name: (doc.profile as any)?.name ?? "Unknown",
    specialty: doc.specialty || "General",
    slot_duration_min: doc.slotDurationMin,
    weekly_availability: doc.availabilities.map((a) => ({
      weekday: a.weekday,
      start_time: a.startTime,
      end_time: a.endTime,
    })),
  }));
}

export async function getPatientUpcomingAppointments(patientId: string, clinicId: string) {
  const appointments = await prisma.appointment.findMany({
    where: {
      patientId,
      clinicId,
      slotTime: { gte: new Date() },
      status: { notIn: ["cancelled", "no_show", "completed"] },
    },
    include: {
      doctor: {
        include: { profile: { select: { name: true } as any } },
      },
    },
    orderBy: { slotTime: "asc" },
  });

  return appointments.map((a) => ({
    appointment_id: a.id,
    doctor_name: (a.doctor.profile as any)?.name ?? "Unknown",
    slot_time: a.slotTime.toISOString(),
    token_no: a.tokenNo,
    status: a.status,
  }));
}

export async function listClinicDoctors(clinicId: string) {
  const doctors = await prisma.doctor.findMany({
    where: { clinicId, deletedAt: null },
    include: {
      profile: { select: { name: true, email: true } as any },
    },
  });

  return doctors.map((d) => ({
    doctor_id: d.id,
    name: (d.profile as any)?.name ?? "Unknown",
    specialty: d.specialty || "General",
    slot_duration_min: d.slotDurationMin,
  }));
}

export async function validateBookingRequest(
  patientId: string,
  doctorId: string,
  clinicId: string,
  slotTime: string
): Promise<{ valid: boolean; reason?: string }> {
  // Check doctor exists in clinic
  const doctor = await prisma.doctor.findFirst({
    where: { id: doctorId, clinicId, deletedAt: null },
  });
  if (!doctor) return { valid: false, reason: "Doctor not found in this clinic." };

  // Check slot conflict
  const conflict = await prisma.appointment.findFirst({
    where: {
      doctorId,
      slotTime: new Date(slotTime),
      status: { notIn: ["cancelled", "no_show"] },
    },
  });
  if (conflict) return { valid: false, reason: "This slot is already booked." };

  // Check if patient already has an appointment at this time
  const patientConflict = await prisma.appointment.findFirst({
    where: {
      patientId,
      slotTime: new Date(slotTime),
      status: { notIn: ["cancelled", "no_show"] },
    },
  });
  if (patientConflict) return { valid: false, reason: "You already have an appointment at this time." };

  return { valid: true };
}
