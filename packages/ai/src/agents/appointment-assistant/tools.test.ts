import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { createAppointmentAssistantTools } from "./tools";
import {
  getPatientUpcomingAppointments,
  listClinicDoctors,
  validateBookingRequest,
} from "../../integration/appointment-hooks";

vi.mock("../../integration/appointment-hooks", () => ({
  getDoctorAvailability: vi.fn(),
  searchAvailableSlots: vi.fn(),
  getPatientUpcomingAppointments: vi.fn(),
  listClinicDoctors: vi.fn(),
  validateBookingRequest: vi.fn(),
}));

function findTool(name: string) {
  const tools = createAppointmentAssistantTools({
    clinic_id: "trusted-clinic",
    patient_id: "trusted-patient",
  });
  const matched = tools.find((tool) => tool.name === name);
  if (!matched) throw new Error(`Tool not found: ${name}`);
  return matched;
}

describe("appointment assistant tools", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses authenticated patient and clinic scope for appointment lookups", async () => {
    (getPatientUpcomingAppointments as unknown as Mock).mockResolvedValue([{ appointment_id: "appt-1" }]);

    const result = await findTool("get_my_appointments").invoke({
      patient_id: "attacker-patient",
      clinic_id: "attacker-clinic",
    });

    expect(getPatientUpcomingAppointments).toHaveBeenCalledWith("trusted-patient", "trusted-clinic");
    expect(JSON.parse(result as string)).toEqual([{ appointment_id: "appt-1" }]);
  });

  it("uses authenticated scope when validating booking requests", async () => {
    (validateBookingRequest as unknown as Mock).mockResolvedValue({ valid: true });

    await findTool("validate_booking").invoke({
      patient_id: "attacker-patient",
      clinic_id: "attacker-clinic",
      doctor_id: "doctor-1",
      slot_time: "2026-07-12T10:00:00.000Z",
    });

    expect(validateBookingRequest).toHaveBeenCalledWith(
      "trusted-patient",
      "doctor-1",
      "trusted-clinic",
      "2026-07-12T10:00:00.000Z"
    );
  });

  it("uses authenticated clinic scope when listing doctors", async () => {
    (listClinicDoctors as unknown as Mock).mockResolvedValue([{ doctor_id: "doctor-1" }]);

    await findTool("list_clinic_doctors").invoke({ clinic_id: "attacker-clinic" });

    expect(listClinicDoctors).toHaveBeenCalledWith("trusted-clinic");
  });
});
