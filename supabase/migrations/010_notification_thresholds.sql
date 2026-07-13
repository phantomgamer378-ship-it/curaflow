-- 010_notification_thresholds.sql
alter table clinics add column getting_close_threshold int not null default 3;
