# API specification

All API handlers follow the same envelope:

1. Parse input with Zod.
2. Establish an authenticated user where required.
3. Enforce role and resource ownership.
4. Execute a use-case handler.
5. Validate and return the output schema.

Phase 0 exposes only `GET /api/health`. The complete route contract from the
master brief is reserved for Phases 1–6 so no placeholder endpoint can be
mistaken for a working or secure implementation.

Public queue responses are strictly limited to:

```json
{
  "current_token": 18,
  "waiting_count": 6
}
```
