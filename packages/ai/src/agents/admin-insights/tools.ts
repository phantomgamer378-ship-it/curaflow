import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { prisma } from "@clinic/db";

export const getAppointmentStatsTool = tool(
  async (input: any) => {
    const { clinic_id, days } = input;
    const since = new Date();
    since.setDate(since.getDate() - (days || 30));

    const [total, completed, noShow, cancelled] = await Promise.all([
      prisma.appointment.count({ where: { clinicId: clinic_id, createdAt: { gte: since } } }),
      prisma.appointment.count({ where: { clinicId: clinic_id, status: "completed", createdAt: { gte: since } } }),
      prisma.appointment.count({ where: { clinicId: clinic_id, status: "no_show", createdAt: { gte: since } } }),
      prisma.appointment.count({ where: { clinicId: clinic_id, status: "cancelled", createdAt: { gte: since } } }),
    ]);

    return JSON.stringify({
      period_days: days || 30,
      total_appointments: total,
      completed,
      no_shows: noShow,
      no_show_rate: total > 0 ? `${((noShow / total) * 100).toFixed(1)}%` : "0%",
      cancellations: cancelled,
      cancellation_rate: total > 0 ? `${((cancelled / total) * 100).toFixed(1)}%` : "0%",
      completion_rate: total > 0 ? `${((completed / total) * 100).toFixed(1)}%` : "0%",
    });
  },
  {
    name: "get_appointment_stats",
    description: "Get appointment statistics for a clinic over a period (total, completed, no-shows, cancellations).",
    schema: z.object({ clinic_id: z.string(), days: z.number().nullable().optional().describe("Number of days to look back (default 30)") }),
  }
);

export const getDoctorUtilizationTool = tool(
  async (input: any) => {
    const doctors = await prisma.doctor.findMany({
      where: { clinicId: input.clinic_id, deletedAt: null },
      include: {
        profile: { select: { name: true } as any },
        appointments: { where: { createdAt: { gte: new Date(Date.now() - 30 * 86400000) } } },
      },
    });

    return JSON.stringify(doctors.map((d) => ({
      doctor_name: (d.profile as any)?.name ?? "Unknown",
      total_appointments: d.appointments.length,
      completed: d.appointments.filter((a) => a.status === "completed").length,
      no_shows: d.appointments.filter((a) => a.status === "no_show").length,
    })));
  },
  {
    name: "get_doctor_utilization",
    description: "Get utilization metrics for each doctor in the clinic (appointments, completion rates).",
    schema: z.object({ clinic_id: z.string() }),
  }
);

export const getPatientCountTool = tool(
  async (input: any) => {
    const total = await prisma.patient.count();
    return JSON.stringify({ total_patients: total });
  },
  {
    name: "get_patient_count",
    description: "Get the total number of registered patients.",
    schema: z.object({ clinic_id: z.string() }),
  }
);

export const adminInsightsTools = [getAppointmentStatsTool, getDoctorUtilizationTool, getPatientCountTool];
