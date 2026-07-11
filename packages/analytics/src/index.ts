export type DailyClinicMetrics = {
  appointmentsBooked: number;
  appointmentsCompleted: number;
  noShowCount: number;
  cancellationCount: number;
  averageWaitMinutes: number | null;
};
