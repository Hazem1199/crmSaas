-- =========================================================
-- Migration 006: حملة افتراضية لكل مساحة عمل بلا حملات نشطة
-- (مساحات قديمة أُنشئت قبل إضافة الإنشاء التلقائي في onboarding)
-- =========================================================

insert into public.campaigns (workspace_id, name, description, is_active)
select w.id,
       'الحملة الرئيسية',
       'حملة افتراضية — يمكنك تعديل الاسم أو إضافة حملات أخرى.',
       true
from public.workspaces w
where w.deleted_at is null
  and not exists (
    select 1
    from public.campaigns c
    where c.workspace_id = w.id
      and c.deleted_at is null
  );
