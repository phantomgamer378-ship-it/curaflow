import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../../middleware/auth";
import { prisma } from "../../config/db";

export async function updatePatientProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const patient = await prisma.patient.findUnique({
      where: { profileId: req.user?.id },
      include: { profile: true },
    });

    if (!patient) {
      return res.status(404).json({ ok: false, error: "Patient profile not found" });
    }

    const { name, phone, avatarUrl, gender, bloodGroup, allergies, emergencyContactName, emergencyContactPhone } = req.body;

    // Update Profile
    const profileUpdate: any = {};
    if (name !== undefined) profileUpdate.name = name;
    if (phone !== undefined) profileUpdate.phone = phone;
    if (avatarUrl !== undefined) profileUpdate.avatarUrl = avatarUrl;

    if (Object.keys(profileUpdate).length > 0) {
      await prisma.profile.update({
        where: { id: patient.profileId },
        data: profileUpdate,
      });
    }

    // Update Patient
    const patientUpdate: any = {};
    if (gender !== undefined) patientUpdate.gender = gender;
    if (bloodGroup !== undefined) patientUpdate.bloodGroup = bloodGroup;
    if (allergies !== undefined) patientUpdate.allergies = allergies;
    if (emergencyContactName !== undefined) patientUpdate.emergencyContactName = emergencyContactName;
    if (emergencyContactPhone !== undefined) patientUpdate.emergencyContactPhone = emergencyContactPhone;

    let updatedPatient = patient;
    if (Object.keys(patientUpdate).length > 0) {
      updatedPatient = await prisma.patient.update({
        where: { id: patient.id },
        data: patientUpdate,
        include: { profile: true } as any,
      });
    } else {
      updatedPatient = await prisma.patient.findUnique({
        where: { id: patient.id },
        include: { profile: true } as any,
      }) as any;
    }

    return res.json({ ok: true, data: updatedPatient });
  } catch (error) {
    next(error);
  }
}
