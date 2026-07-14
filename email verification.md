# EMAIL VERIFICATION + FORGOT/RESET PASSWORD — RESEND IMPLEMENTATION

## 0. DESIGN CHOICE
Built as **fully custom** (our own tokens, our own emails via Resend + the existing `notification-worker`), not Supabase's built-in reset flow. This keeps password reset consistent with every other notification in the app — same worker, same audit logging, same retry/backoff — rather than having one auth flow behave differently from the rest of the system. It also lets us hash tokens before storage (Section 2), which Supabase's built-in flow doesn't give you control over.

**Simpler alternative, if you'd rather not maintain custom token logic:** configure Resend as Supabase Auth's custom SMTP provider and use Supabase's built-in `resetPasswordForEmail()` — less code, but bypasses your notification-worker/audit pipeline for this one flow. Tell me if you'd rather go this route instead.

---

## 1. SCHEMA (`012_email_verification_reset.sql`)
```sql
alter table profiles add column email_verified_at timestamptz;

create table email_verification_tokens (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create table password_reset_tokens (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  ip text,
  created_at timestamptz not null default now()
);

alter table email_verification_tokens enable row level security;
alter table password_reset_tokens enable row level security;
-- zero client access, ever — server (service-role) only
create policy no_client_access_evt on email_verification_tokens for all using (false);
create policy no_client_access_prt on password_reset_tokens for all using (false);
```
**Why hash the token before storing it:** same principle as password storage. If the database is ever read by someone who shouldn't (backup leak, injection, misconfigured access), a stored *raw* token would let them reset any pending account directly. A hash is useless to an attacker without the original — only the emailed link contains the raw value.

---

## 2. TOKEN GENERATION (shared utility)
```ts
import { randomBytes, createHash } from 'crypto'

function generateToken() {
  const raw = randomBytes(32).toString('hex')
  const hash = createHash('sha256').update(raw).digest('hex')
  return { raw, hash } // raw goes in the email link, hash goes in the DB
}
```

---

## 3. SIGNUP → EMAIL VERIFICATION
1. `POST /api/auth/signup` creates the profile, generates a token (24h expiry), stores the hash, enqueues a `notification` (`template='email_verification'`) → `notification-worker` sends via Resend.
2. **Soft-gate, not hard-gate:** the user can log in immediately after signup. While `email_verified_at` is null, show a persistent "please verify your email" banner and block only sensitive actions (booking, profile edits) — don't lock them out of the app entirely. This matches modern SaaS UX better than a hard wall.
3. `GET /api/auth/verify-email?token=xxx` — hash the incoming token, look it up, check not expired/not already used, set `profiles.email_verified_at = now()`, mark token `used_at = now()`.
4. `POST /api/auth/resend-verification` — rate-limited, invalidates the previous unused token before issuing a new one.

---

## 4. FORGOT PASSWORD
1. `POST /api/auth/forgot-password {email}` — rate-limited 3/hour/IP (Section 5 of the master prompt).
2. Always return the **same neutral response** ("if an account exists, we've sent a reset link") regardless of whether the email was found — do this by always doing the same amount of work either way (generate a token and discard it if no user matches), not by short-circuiting early, so response timing doesn't leak whether the account exists either.
3. If found: generate a token (15-min expiry), **invalidate all previous unused tokens for that user first**, store the new hash, enqueue `notification(template='password_reset')` → Resend.

---

## 5. RESET PASSWORD
1. `/reset-password?token=xxx` — the frontend does **not** pre-validate the token on page load (a GET-time check would leave the token sitting in server/analytics logs longer than necessary). It just renders the new-password form.
2. `POST /api/auth/reset-password {token, newPassword}`:
   - Hash the incoming token, look it up, check not expired and not already used.
   - If valid: use the **service-role** client to call `supabase.auth.admin.updateUserById(profileId, {password: newPassword})`.
   - Mark the token `used_at = now()` (single-use, enforced at the DB level by checking this before every use).
   - **Revoke all other active sessions** for that user (security best practice on password change — matches Section 6 of the master prompt).
   - Enqueue a `notification(template='password_changed_confirmation')`.
   - Write an `audit_logs` entry.
3. Invalid/expired token → clear error state with a "request a new link" call-to-action, not a raw error message.

---

## 6. EMAIL TEMPLATES
| Trigger | Subject | Key content |
|---|---|---|
| Signup verification | "Verify your email to get started" | Verify button, 24h expiry note |
| Password reset request | "Reset your password" | Reset link, 15-minute expiry note, "if you didn't request this, you can ignore this email" |
| Password changed confirmation | "Your password was changed" | Security notice — "if this wasn't you, contact support immediately" |

---

## 7. RESEND SETUP NOTE
Resend sends *from* a domain you verify with them (e.g., `noreply@yourclinic.com`) — it does not send through Gmail's own infrastructure, it delivers *to* Gmail (and Outlook, Yahoo, etc.) as the recipient. For reliable inbox delivery rather than landing in spam, verify your sending domain's **SPF, DKIM, and DMARC** DNS records in the Resend dashboard before going live — this matters especially for password reset emails, where landing in spam is a real usability and security problem, not just an inconvenience.

---

## 8. API CONTRACT
| Method | Path | Body | Notes |
|---|---|---|---|
| POST | `/api/auth/signup` | `{email, password, name}` | Triggers verification email |
| GET | `/api/auth/verify-email` | `?token=` | Consumes token |
| POST | `/api/auth/resend-verification` | `{}` (session) | Rate-limited |
| POST | `/api/auth/forgot-password` | `{email}` | Always neutral response, rate-limited |
| POST | `/api/auth/reset-password` | `{token, newPassword}` | Consumes token, revokes other sessions |

---

## 9. CHECKPOINT
- [ ] Signup sends the verification email via Resend within seconds; user can log in immediately (soft-gate confirmed)
- [ ] Verification link works once; a second click on the same link fails cleanly, not silently
- [ ] Expired verification link shows a working "resend" option
- [ ] `forgot-password` returns the identical response for a real email vs. a fake one — verified by testing both directly
- [ ] Reset link works exactly once; reusing it fails cleanly
- [ ] Resetting the password revokes all other active sessions immediately (test: log in on two devices, reset from one, confirm the other is logged out)
- [ ] Password-changed confirmation email fires after a successful reset
- [ ] Inspect the database directly — `token_hash` columns contain hashes, never the raw token value, in either table
- [ ] Send a real test email to an actual Gmail address — confirm it lands in the inbox, not spam (this is the concrete test for the domain/SPF/DKIM setup in Section 7)