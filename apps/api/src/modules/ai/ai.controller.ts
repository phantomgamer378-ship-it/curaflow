import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../../middleware/auth";
import {
  AgentRequestSchema,
  invokeAppointmentAssistant,
  invokeQueueIntelligence,
  invokeDoctorNoteAssistant,
  invokeReminderAgent,
  invokeAdminInsights,
  isAIConfigured,
} from "@clinic/ai";
import { prisma } from "../../config/db";

/** Resolve clinic_id from the authenticated user. */
async function resolveClinicId(userId: string, role: string): Promise<string | null> {
  if (role === "doctor") {
    const doc = await prisma.doctor.findUnique({ where: { profileId: userId } });
    return doc?.clinicId || null;
  }
  if (role === "patient") {
    const patient = await prisma.patient.findUnique({ where: { profileId: userId } });
    if (!patient) return null;
    // Find any appointment's clinic, or the first clinic
    const appt = await prisma.appointment.findFirst({ where: { patientId: patient.id }, select: { clinicId: true } });
    if (appt) return appt.clinicId;
    const clinic = await prisma.clinic.findFirst();
    return clinic?.id || null;
  }
  if (role === "admin") {
    const clinic = await prisma.clinic.findFirst();
    return clinic?.id || null;
  }
  return null;
}

function guardAIConfigured(res: Response): boolean {
  if (!isAIConfigured()) {
    res.status(503).json({ ok: false, error: "AI service is not configured. Set GROQ_API_KEY in .env." });
    return false;
  }
  return true;
}

export async function patientAssistant(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!guardAIConfigured(res)) return;
    const clinicId = await resolveClinicId(req.user!.id, req.user!.role);
    if (!clinicId) return res.status(400).json({ ok: false, error: "Could not resolve clinic context." });

    const parsed = AgentRequestSchema.safeParse({
      clinic_id: clinicId,
      user_id: req.user!.id,
      role: req.user!.role,
      message: req.body.message,
      thread_id: req.body.thread_id,
      appointment_id: req.body.appointment_id,
    });
    if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.message });

    const result = await invokeAppointmentAssistant(parsed.data);
    return res.json(result);
  } catch (error) { next(error); }
}

export async function queueAssistant(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!guardAIConfigured(res)) return;
    const clinicId = await resolveClinicId(req.user!.id, req.user!.role);
    if (!clinicId) return res.status(400).json({ ok: false, error: "Could not resolve clinic context." });

    const parsed = AgentRequestSchema.safeParse({
      clinic_id: clinicId, user_id: req.user!.id, role: req.user!.role,
      message: req.body.message, thread_id: req.body.thread_id,
    });
    if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.message });

    const result = await invokeQueueIntelligence(parsed.data);
    return res.json(result);
  } catch (error) { next(error); }
}

export async function doctorNoteAssistant(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!guardAIConfigured(res)) return;
    const clinicId = await resolveClinicId(req.user!.id, req.user!.role);
    if (!clinicId) return res.status(400).json({ ok: false, error: "Could not resolve clinic context." });

    const parsed = AgentRequestSchema.safeParse({
      clinic_id: clinicId, user_id: req.user!.id, role: req.user!.role,
      message: req.body.message || req.body.raw_note, thread_id: req.body.thread_id,
      appointment_id: req.body.appointment_id,
    });
    if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.message });

    const result = await invokeDoctorNoteAssistant({ ...parsed.data, raw_note: req.body.raw_note });
    return res.json(result);
  } catch (error) { next(error); }
}

export async function adminInsightsAssistant(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!guardAIConfigured(res)) return;
    const clinicId = await resolveClinicId(req.user!.id, req.user!.role);
    if (!clinicId) return res.status(400).json({ ok: false, error: "Could not resolve clinic context." });

    const parsed = AgentRequestSchema.safeParse({
      clinic_id: clinicId, user_id: req.user!.id, role: req.user!.role,
      message: req.body.message, thread_id: req.body.thread_id,
    });
    if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.message });

    const result = await invokeAdminInsights(parsed.data);
    return res.json(result);
  } catch (error) { next(error); }
}

export async function reminderPreview(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!guardAIConfigured(res)) return;
    const clinicId = await resolveClinicId(req.user!.id, req.user!.role);
    if (!clinicId) return res.status(400).json({ ok: false, error: "Could not resolve clinic context." });

    const parsed = AgentRequestSchema.safeParse({
      clinic_id: clinicId, user_id: req.user!.id, role: req.user!.role,
      message: req.body.message, thread_id: req.body.thread_id,
    });
    if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.message });

    const result = await invokeReminderAgent(parsed.data);
    return res.json(result);
  } catch (error) { next(error); }
}
