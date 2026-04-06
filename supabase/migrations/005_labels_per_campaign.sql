-- =========================================================
-- Migration 005: التصنيفات (labels) تابعة للحملة فقط — إزالة الربط بالعميل
-- =========================================================

-- 1) ربط التصنيف بالحملة
alter table public.labels
  add column if not exists campaign_id uuid references public.campaigns(id) on delete cascade;

-- 2) تعبئة campaign_id من أول حملة نشطة في نفس مساحة العمل (للبيانات القديمة)
update public.labels l
set campaign_id = (
  select c.id
  from public.campaigns c
  where c.workspace_id = l.workspace_id
    and c.deleted_at is null
  order by c.created_at asc
  limit 1
)
where l.campaign_id is null;

-- 3) حذف تصنيفات لا يمكن ربطها بحملة
delete from public.labels where campaign_id is null;

alter table public.labels
  alter column campaign_id set not null;

-- 4) إزالة سياسات RLS القديمة (كانت تعتمد على workspace_id)
drop policy if exists "labels_select" on public.labels;
drop policy if exists "labels_write" on public.labels;

-- 5) إزالة workspace_id من التصنيفات
alter table public.labels
  drop column if exists workspace_id;

-- 6) إزالة التصنيف من العميل
alter table public.leads
  drop column if exists label_id;

-- 7) RLS جديدة حسب مساحة عمل الحملة
create policy "labels_select" on public.labels
  for select using (
    exists (
      select 1 from public.campaigns c
      where c.id = labels.campaign_id
        and c.deleted_at is null
        and is_workspace_member(c.workspace_id)
    )
  );

create policy "labels_insert" on public.labels
  for insert with check (
    exists (
      select 1 from public.campaigns c
      where c.id = campaign_id
        and c.deleted_at is null
        and has_role(c.workspace_id, array['owner', 'admin']::member_role[])
    )
  );

create policy "labels_update" on public.labels
  for update using (
    exists (
      select 1 from public.campaigns c
      where c.id = labels.campaign_id
        and c.deleted_at is null
        and has_role(c.workspace_id, array['owner', 'admin']::member_role[])
    )
  )
  with check (
    exists (
      select 1 from public.campaigns c
      where c.id = campaign_id
        and c.deleted_at is null
        and has_role(c.workspace_id, array['owner', 'admin']::member_role[])
    )
  );

create policy "labels_delete" on public.labels
  for delete using (
    exists (
      select 1 from public.campaigns c
      where c.id = labels.campaign_id
        and c.deleted_at is null
        and has_role(c.workspace_id, array['owner', 'admin']::member_role[])
    )
  );

create index if not exists idx_labels_campaign on public.labels(campaign_id);
