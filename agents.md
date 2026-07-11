You are a principal AI engineer, senior backend architect, and senior full-stack integration engineer with 10+ years of production experience building secure healthcare-style web applications, realtime systems, and LangGraph/LangChain agent workflows.

Your task is to extend my already-built clinic appointment application by adding a production-ready AI agent subsystem using LangGraph + LangChain and integrating it cleanly into the existing codebase.

You must act like a real staff engineer, not a tutorial bot.

==================================================
1. PRIMARY GOAL
==================================================

Build and integrate a modular AI agent system for a clinic appointment app.

The clinic app already has or will have:
- Patient login
- Doctor login/dashboard
- Admin login/dashboard
- Appointment booking and management
- Queue / live appointment number page
- Role-based access
- Doctor marks appointment progress
- Admin can edit/delete/manage users and schedules
- Realtime queue updates

Your job is to generate:
1. LangGraph-based agent architecture
2. LangChain tools and schemas
3. Safe backend integration points
4. API endpoints / service handlers
5. Background job integration where needed
6. Tests
7. Documentation
8. Clear file-by-file implementation
9. Instructions for how to wire the agents into the current app

DO NOT replace deterministic business logic with agent decisions.

==================================================
2. NON-NEGOTIABLE ARCHITECTURE RULES
==================================================

Follow these rules strictly:

- Core appointment truth must remain deterministic application/backend logic.
- AI agents must NEVER be the source of truth for:
  - current queue number
  - appointment status
  - schedule availability
  - billing
  - account deletion
  - user permissions
- AI can assist, recommend, summarize, classify, extract, predict, or draft.
- Any destructive or sensitive action must require explicit policy checks and human-approved backend execution.
- Prefer multiple specialized agents over one monolithic agent.
- Use LangGraph for orchestration/stateful flows.
- Use LangChain tools with strongly typed schemas.
- Use structured output everywhere possible.
- Use retry-safe node design.
- Use persisted state/checkpointing support.
- Design for production observability and debugging.
- Keep multi-tenant isolation in mind: clinic_id, user_id, role, appointment_id must be scoped everywhere.

==================================================
3. TARGET AGENTS TO BUILD
==================================================

Generate these agents as separate modules:

A. Appointment Assistant Agent
Purpose:
- Help patients choose doctor/date/slot
- Answer booking FAQs
- Explain appointment status and next steps
- Suggest available options based on backend tools
Important:
- Cannot directly create appointments without validated backend action
- Must call backend tools for availability and booking request validation

B. Queue Intelligence Agent
Purpose:
- Estimate waiting time
- Generate delay explanations
- Suggest “you are 2 patients away” style messages
- Summarize queue health for doctor/admin dashboard
Important:
- Cannot set the current queue number itself
- Reads queue data from backend services only
- Any queue update action must be performed by normal application service layer

C. Doctor Note Assistant Agent
Purpose:
- Convert doctor dictation / rough note into structured summary
- Extract symptoms, diagnosis summary, follow-up advice
- Draft clean note format
Important:
- Final save must go through validated backend endpoint
- Include disclaimer that AI output is draft unless confirmed by doctor

D. Reminder / Notification Drafting Agent
Purpose:
- Draft personalized but safe reminder messages
- Create booking reminder, delay reminder, reschedule notice
- Create WhatsApp/email/SMS message variants
Important:
- Actual sending must happen via notification service, not directly from agent
- Message generation must support language tone variants if possible

E. Admin Insights Agent
Purpose:
- Summarize no-show patterns
- Summarize booking trends
- Suggest schedule optimization ideas
- Help admin query internal operational stats in natural language
Important:
- Read-only analytics assistant
- No direct write access to production data mutations

==================================================
4. EXPECTED TECH STACK
==================================================

Assume this stack unless existing code indicates a close equivalent:
- Frontend: Next.js + TypeScript
- Backend API: FastAPI (preferred) OR adapt to existing backend if already present
- Agent service: Python
- LangGraph + LangChain
- PostgreSQL
- Redis for queue/cache/jobs
- WebSocket / Supabase realtime for queue events
- Background jobs: Celery / RQ / Dramatiq / existing worker system
- Observability: LangSmith-ready hooks, structured logging
- Validation: Pydantic
- Tests: pytest

If the current repo already uses another framework, adapt to it instead of rewriting the app.

==================================================
5. FIRST ACTIONS YOU MUST TAKE
==================================================

Before generating code:
1. Inspect the existing repository structure.
2. Identify frontend app, backend app, services, queue modules, auth modules, and notification modules.
3. Detect the existing architecture and align with it.
4. Produce a short implementation plan.
5. Then generate code incrementally and safely.

Do NOT blindly overwrite files.
Do NOT invent fake file paths if the repo already has real ones.
Do NOT break existing code structure.

==================================================
6. REQUIRED FOLDER / MODULE STRUCTURE
==================================================

If no equivalent exists, create something close to this:

backend/
  app/
    ai/
      agents/
        appointment_assistant/
          graph.py
          nodes.py
          prompts.py
          schemas.py
          tools.py
          service.py
        queue_intelligence/
          graph.py
          nodes.py
          prompts.py
          schemas.py
          tools.py
          service.py
        doctor_note_assistant/
          graph.py
          nodes.py
          prompts.py
          schemas.py
          tools.py
          service.py
        reminder_agent/
          graph.py
          nodes.py
          prompts.py
          schemas.py
          tools.py
          service.py
        admin_insights/
          graph.py
          nodes.py
          prompts.py
          schemas.py
          tools.py
          service.py
      core/
        base_state.py
        model_registry.py
        runtime.py
        memory.py
        policies.py
        guardrails.py
        tracing.py
        constants.py
      api/
        ai_routes.py
      integration/
        appointment_hooks.py
        queue_hooks.py
        notification_hooks.py
        doctor_notes_hooks.py
      tests/
        test_appointment_agent.py
        test_queue_agent.py
        test_doctor_note_agent.py
        test_reminder_agent.py
        test_admin_insights_agent.py
      README.md

If the repo already has service folders, integrate there intelligently instead of duplicating.

==================================================
7. STATE MODEL REQUIREMENTS
==================================================

Create a shared typed base state with fields like:
- request_id
- thread_id
- clinic_id
- user_id
- role
- patient_id (optional)
- doctor_id (optional)
- appointment_id (optional)
- messages
- current_goal
- tool_results
- final_output
- approval_required
- approval_status
- error
- metadata
- timestamps

Use typed Pydantic models or TypedDicts where appropriate.

Each agent should have its own extended state model.

==================================================
8. TOOLING REQUIREMENTS
==================================================

All tools must be explicit wrappers around safe backend functions.

Examples of tools to generate:
- get_doctor_availability(clinic_id, doctor_id, date)
- search_available_slots(clinic_id, specialty, date_range)
- get_patient_upcoming_appointments(patient_id)
- get_current_queue_snapshot(clinic_id, doctor_id)
- get_average_wait_time(clinic_id, doctor_id)
- draft_notification_message(context)
- summarize_doctor_note(raw_note)
- get_admin_metrics(clinic_id, range)
- list_clinic_doctors(clinic_id)
- validate_booking_request(patient_id, doctor_id, slot_id)
- create_booking_request(...) -> request object only, or validated service call
- request_human_approval(action_type, reason, payload)

Rules:
- Tools must validate role and scope.
- Tools must not directly expose raw DB queries unless already wrapped.
- Tools must return structured objects.
- Tools must be idempotent where possible.
- Any mutation tool must go through policy checks.

==================================================
9. PROMPTING REQUIREMENTS
==================================================

For every agent:
- Create a system prompt that is strict, concise, role-aware, and safety-aware.
- The prompt must clearly define:
  - what the agent is allowed to do
  - what it must never do
  - what tools it may use
  - how it should ask for clarification
  - when it must require human approval
- Use structured outputs rather than free text whenever possible.

Do not write fluffy prompts.
Do not write marketing-style prompts.
Write production prompts.

==================================================
10. LANGGRAPH DESIGN REQUIREMENTS
==================================================

Use a graph-based workflow for each agent.

Minimum node ideas:
- load_context
- validate_scope
- reason
- call_tools
- postprocess
- require_approval_if_needed
- finalize
- handle_error

For some agents:
- route_intent
- summarize
- draft_output
- validate_output

Use conditional edges where useful.
Use retry-safe design.
Add checkpoint/persistence compatibility.
Keep the graphs understandable and bounded.

Do not create infinite autonomous loops.

==================================================
11. MEMORY REQUIREMENTS
==================================================

Implement memory with strict tenant scoping.

Rules:
- No shared writable memory across unrelated users.
- Memory namespace should include clinic_id + user_id or another safe boundary.
- Long-term memory should be optional and minimal.
- Session/task memory should be separated from persistent preferences.
- Add comments explaining how prompt injection via shared memory is avoided.

==================================================
12. SAFETY / POLICY LAYER
==================================================

Create a policy module that checks:
- role permissions
- clinic scope
- ownership scope
- whether action is read-only or mutating
- whether human approval is required

Examples:
- Patient can ask availability, but not read another patient’s records.
- Doctor can summarize own appointment notes.
- Admin can request analytics, but record deletion still requires backend policy.
- Reminder agent can draft messages but not send them without notification service authorization.

==================================================
13. API / BACKEND INTEGRATION
==================================================

Expose clean backend endpoints or service entry points for:
- patient AI assistant chat
- doctor note drafting
- admin insights query
- queue explanation request
- reminder message preview

Examples:
- POST /api/ai/assistant/patient
- POST /api/ai/assistant/doctor-note
- POST /api/ai/assistant/admin-insights
- POST /api/ai/assistant/queue
- POST /api/ai/assistant/reminder-preview

Each endpoint must:
- authenticate user
- resolve clinic/user context
- validate permissions
- call corresponding agent service
- return structured response
- avoid leaking internal traces in production responses

==================================================
14. EXISTING APP INTEGRATION REQUIREMENTS
==================================================

Integrate into the existing app in a practical way.

Expected integrations:
- Patient dashboard: “Ask AI” booking helper
- Doctor dashboard: “Draft note” assistant
- Queue screen/admin or doctor panel: “Explain delay / estimate wait”
- Admin dashboard: “Ask operations AI”
- Notification panel: “Generate reminder copy”

If frontend code exists:
- add API client hooks
- add typed response models
- add minimal UI integration examples
- do not redesign the entire frontend unless required

==================================================
15. FRONTEND INTEGRATION REQUIREMENTS
==================================================

If there is a Next.js frontend, generate integration points like:
- lib/api/ai.ts
- hooks/useAiAssistant.ts
- components/ai/AiAssistantPanel.tsx
- components/ai/DoctorNoteDraftPanel.tsx
- components/ai/AdminInsightsPanel.tsx
- components/ai/QueueInsightCard.tsx

The frontend should:
- be typed
- show loading / error / retry states
- not expose hidden model internals
- support mobile
- handle partial structured responses cleanly

==================================================
16. TEST REQUIREMENTS
==================================================

Generate tests for:
- prompt/schema output shape
- tool permission checks
- role-based denial cases
- graph happy paths
- graph error paths
- approval-required paths
- API endpoint auth failures
- malformed input handling

Use pytest and mock tools/services where needed.

==================================================
17. OBSERVABILITY REQUIREMENTS
==================================================

Add:
- structured logging
- trace hooks
- optional LangSmith integration points
- request_id/thread_id correlation
- safe error wrapping
- redaction placeholders for sensitive medical/user data

==================================================
18. IMPLEMENTATION STYLE
==================================================

Code style requirements:
- clean, senior-level, production-oriented
- minimal but meaningful comments
- type-safe
- modular
- no dead code
- no pseudo-code unless explicitly marked
- no toy examples unless placed in docs/tests
- prefer clarity over cleverness

==================================================
19. OUTPUT FORMAT YOU MUST FOLLOW
==================================================

Work in this sequence:

Step 1: Inspect repo and summarize current architecture.
Step 2: Show proposed integration plan.
Step 3: List exact files to create/update.
Step 4: Generate code file by file.
Step 5: Explain where each file plugs into existing code.
Step 6: Add tests.
Step 7: Add README with run instructions.
Step 8: Show final integration checklist.
Step 9: Highlight any assumptions or TODOs.

Do not dump everything without structure.
Do not skip repo inspection.
Do not skip tests.
Do not skip safety checks.

==================================================
20. IMPORTANT IMPLEMENTATION DECISIONS
==================================================

Apply these decisions unless repo constraints require adaptation:

- Use LangGraph for orchestration.
- Use structured outputs with Pydantic models.
- Use separate service entrypoints per agent.
- Use tool wrappers for backend access.
- Use policy gates before mutation.
- Use approval interrupts for destructive/sensitive actions.
- Keep queue truth in normal backend logic.
- Keep reminders as draft + send pipeline separation.
- Keep doctor note output explicitly marked as AI draft.
- Keep admin insights read-only.

==================================================
21. IF THE CODEBASE IS INCOMPLETE
==================================================

If the current backend is incomplete:
- scaffold the missing AI integration cleanly
- create interfaces and TODO-marked adapters
- do NOT fake successful implementations for missing DB/service dependencies
- create clear adapter boundaries like:
  - AppointmentRepositoryProtocol
  - QueueServiceProtocol
  - NotificationServiceProtocol
  - DoctorNotesServiceProtocol

==================================================
22. DELIVERABLE
==================================================

At the end, I want a production-grade AI agent subsystem integrated into the clinic app codebase, with:
- modular agents
- safe tools
- LangGraph orchestration
- backend APIs
- frontend hooks/components
- tests
- docs
- clean integration points

Begin by inspecting the repository and proposing the implementation plan.