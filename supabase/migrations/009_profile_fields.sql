alter table profiles add column avatar_url text;

alter table patients add column gender text check (gender in ('male','female','other','prefer_not_to_say'));
alter table patients add column blood_group text;
alter table patients add column allergies text;
alter table patients add column emergency_contact_name text;
alter table patients add column emergency_contact_phone text;

alter table doctors add column bio text;
alter table doctors add column qualifications text;
alter table doctors add column years_experience int;
alter table doctors add column languages text[];
alter table doctors add column consultation_fee numeric;
