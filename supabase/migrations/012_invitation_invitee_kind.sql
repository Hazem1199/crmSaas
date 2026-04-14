-- تمييز المستخدم الموجود وقت إنشاء الدعوة (قبل القبول) لواجهات قبول مختلفة
alter table public.workspace_invitations
  add column if not exists invitee_was_registered boolean not null default false;

comment on column public.workspace_invitations.invitee_was_registered is
  'true إذا كان البريد مسجّلاً في auth قبل إرسال هذه الدعوة (مسار قبول بالجلسة)';
