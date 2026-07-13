import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { createQueueIntelligenceTools } from "./tools";
import {
  getCurrentQueueSnapshot,
  getQueuePositionForPatient,
} from "../../integration/queue-hooks";

vi.mock("../../integration/queue-hooks", () => ({
  getCurrentQueueSnapshot: vi.fn(),
  getAverageWaitTime: vi.fn(),
  getQueuePositionForPatient: vi.fn(),
}));

function findTool(name: string, role: "patient" | "doctor" | "admin" = "patient") {
  const tools = createQueueIntelligenceTools({
    clinic_id: "trusted-clinic",
    role,
    patient_id: role === "patient" ? "trusted-patient" : undefined,
  });
  const matched = tools.find((tool) => tool.name === name);
  if (!matched) throw new Error(`Tool not found: ${name}`);
  return matched;
}

describe("queue intelligence tools", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses authenticated clinic scope for queue snapshots", async () => {
    (getCurrentQueueSnapshot as unknown as Mock).mockResolvedValue([{ doctor_id: "doctor-1" }]);

    await findTool("get_queue_snapshot").invoke({ clinic_id: "attacker-clinic" });

    expect(getCurrentQueueSnapshot).toHaveBeenCalledWith("trusted-clinic");
  });

  it("uses the authenticated patient id for patient queue position checks", async () => {
    (getQueuePositionForPatient as unknown as Mock).mockResolvedValue({ in_queue: true, position: 1 });

    await findTool("get_patient_position").invoke({
      clinic_id: "attacker-clinic",
      patient_id: "attacker-patient",
    });

    expect(getQueuePositionForPatient).toHaveBeenCalledWith("trusted-clinic", "trusted-patient");
  });

  it("allows doctor or admin scoped lookups while keeping clinic scope trusted", async () => {
    (getQueuePositionForPatient as unknown as Mock).mockResolvedValue({ in_queue: true, position: 2 });

    await findTool("get_patient_position", "admin").invoke({
      clinic_id: "attacker-clinic",
      patient_id: "patient-in-clinic",
    });

    expect(getQueuePositionForPatient).toHaveBeenCalledWith("trusted-clinic", "patient-in-clinic");
  });
});
