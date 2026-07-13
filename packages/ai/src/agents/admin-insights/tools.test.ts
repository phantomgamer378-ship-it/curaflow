import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { prisma } from "@clinic/db";
import { createAdminInsightsTools } from "./tools";

vi.mock("@clinic/db", () => ({
  prisma: {
    appointment: { count: vi.fn() },
    doctor: { findMany: vi.fn() },
    patient: { count: vi.fn() },
  },
}));

function findTool(name: string) {
  const tools = createAdminInsightsTools({ clinic_id: "trusted-clinic" });
  const matched = tools.find((tool) => tool.name === name);
  if (!matched) throw new Error(`Tool not found: ${name}`);
  return matched;
}

describe("admin insights tools", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("counts patients through appointments scoped to the authenticated clinic", async () => {
    (prisma.patient.count as unknown as Mock).mockResolvedValue(7);

    const result = await findTool("get_patient_count").invoke({ clinic_id: "attacker-clinic" });

    expect(prisma.patient.count).toHaveBeenCalledWith({
      where: {
        appointments: {
          some: { clinicId: "trusted-clinic" },
        },
      },
    });
    expect(JSON.parse(result as string)).toEqual({
      total_patients_with_clinic_appointments: 7,
    });
  });
});
