import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "@clinic/db";

export const doctorsPublicRouter = Router();

// GET /api/doctors
// Returns a public list of doctors, their specialties, and online status.
doctorsPublicRouter.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doctors = await prisma.doctor.findMany({
      where: {
        deletedAt: null,
      },
      select: {
        id: true,
        specialty: true,
        isOnline: true,
        yearsExperience: true,
        consultationFee: true,
        languages: true,
        profile: {
          select: {
            name: true,
            avatarUrl: true,
          }
        },
        clinic: {
          select: {
            name: true,
          }
        }
      },
      orderBy: {
        profile: {
          name: "asc",
        }
      }
    });

    res.json({ ok: true, data: doctors });
  } catch (error) {
    next(error);
  }
});

// GET /api/doctors/:id
// Returns detailed public profile for a specific doctor.
doctorsPublicRouter.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doctorId = req.params.id;
    const doctor = await prisma.doctor.findUnique({
      where: {
        id: doctorId,
        deletedAt: null,
      },
      select: {
        id: true,
        specialty: true,
        isOnline: true,
        bio: true,
        qualifications: true,
        yearsExperience: true,
        languages: true,
        consultationFee: true,
        profile: {
          select: {
            name: true,
            avatarUrl: true,
          }
        },
        clinic: {
          select: {
            name: true,
          }
        },
        availabilities: {
          select: {
            weekday: true,
            startTime: true,
            endTime: true,
          }
        }
      }
    });

    if (!doctor) {
      res.status(404).json({ ok: false, error: "Doctor not found" });
      return;
    }

    res.json({ ok: true, data: doctor });
  } catch (error) {
    next(error);
  }
});
