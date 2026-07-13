import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { prisma } from "@clinic/db";

interface AdminInsightsToolContext {
  clinic_id: string;
}

export function createAdminInsightsTools(ctx: AdminInsightsToolContext) {
  const getAppointmentStatsTool = tool(
    async (input: any) => {
      const days = input.days || 30;
      const since = new Date();
      since.setDate(since.getDate() - days);

      const [total, completed, noShow, cancelled] = await Promise.all([
        prisma.appointment.count({ where: { clinicId: ctx.clinic_id, createdAt: { gte: since } } }),
        prisma.appointment.count({ where: { clinicId: ctx.clinic_id, status: "completed", createdAt: { gte: since } } }),
        prisma.appointment.count({ where: { clinicId: ctx.clinic_id, status: "no_show", createdAt: { gte: since } } }),
        prisma.appointment.count({ where: { clinicId: ctx.clinic_id, status: "cancelled", createdAt: { gte: since } } }),
      ]);

      return JSON.stringify({
        period_days: days,
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
      description: "Get appointment statistics for the authenticated clinic over a period.",
      schema: z.object({
        days: z.number().nullable().optional().describe("Number of days to look back (default 30)"),
      }),
    }
  );

  const getDoctorUtilizationTool = tool(
    async () => {
      const doctors = await prisma.doctor.findMany({
        where: { clinicId: ctx.clinic_id, deletedAt: null },
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
      description: "Get utilization metrics for each doctor in the authenticated clinic.",
      schema: z.object({}),
    }
  );

  const getPatientCountTool = tool(
    async () => {
      const total = await prisma.patient.count({
        where: {
          appointments: {
            some: { clinicId: ctx.clinic_id },
          },
        },
      });

      return JSON.stringify({
        total_patients_with_clinic_appointments: total,
      });
    },
    {
      name: "get_patient_count",
      description: "Get the number of patients who have appointments in the authenticated clinic.",
      schema: z.object({}),
    }
  );

  return [getAppointmentStatsTool, getDoctorUtilizationTool, getPatientCountTool];
}
