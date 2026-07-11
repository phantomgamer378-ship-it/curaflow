-- Phase 1 checkpoint helper: verify patient A cannot read patient B.
--
-- Run this in Supabase SQL editor after replacing the UUIDs with two real
-- auth.users IDs that both have patient profiles.
--
-- Expected:
--   patient_a_own_rows = 1
--   patient_a_visible_patient_b_rows = 0

begin;

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select count(*) as patient_a_own_rows
from public.patients
where profile_id = auth.uid();

select count(*) as patient_a_visible_patient_b_rows
from public.patients
where profile_id = '00000000-0000-0000-0000-000000000002';

rollback;
