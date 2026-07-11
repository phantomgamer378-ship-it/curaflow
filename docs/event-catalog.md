# Domain event catalog

Events are immutable records emitted after a successful deterministic state
transition.

- Auth: `USER_REGISTERED`, `EMAIL_VERIFIED`, `PASSWORD_RESET_REQUESTED`,
  `PASSWORD_RESET_COMPLETED`, `GOOGLE_LOGIN_COMPLETED`
- Appointments: `APPOINTMENT_CREATED`, `APPOINTMENT_CANCELLED`,
  `APPOINTMENT_RESCHEDULED`
- Queue: `PATIENT_CHECKED_IN`, `DOCTOR_STARTED_CONSULTATION`,
  `PATIENT_COMPLETED`, `QUEUE_ADVANCED`, `NO_SHOW_MARKED`, `DAY_CLOSED`
- Admin: `ADMIN_USER_UPDATED`, `ADMIN_USER_DELETED`, `ROLE_CHANGED`,
  `QUEUE_OVERRIDE_USED`

Event payloads must contain identifiers and operational context, never secrets.
Realtime queue broadcasts contain no patient information.
