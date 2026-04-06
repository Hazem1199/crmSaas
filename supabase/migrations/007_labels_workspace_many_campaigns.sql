-- =========================================================
-- Migration 007: تصنيفات على مستوى المساحة + ربط many-to-many بالحملات
-- (يستبدل موديل campaign_id المباشر على labels بعد 005)
-- =========================================================

-- 1) إعادة workspace_id للتصنيفات وتعبئته من الحملة الحالية (إن وُجد campaign_id)
alter table public.labels
  add column if not exists workspace_id uuid references public.workspaces(id) on delete cascade;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'labels' and column_name = 'campaign_id'
  ) then
    update public.labels l
    set workspace_id = c.workspace_id
    from public.campaigns c
    where l.campaign_id is not null
      and c.id = l.campaign_id
      and l.workspace_id is null;
  end if;
end $$;

-- 2) جدول الربط
create table if not exists public.campaign_labels (
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  label_id    uuid not null references public.labels(id) on delete cascade,
  created_at  timestamptz default now(),
  primary key (campaign_id, label_id)
);

create index if not exists idx_campaign_labels_campaign on public.campaign_labels(campaign_id);
create index if not exists idx_campaign_labels_label on public.campaign_labels(label_id);

-- 3) ترحيل الروابط من الوضع القديم
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'labels' and column_name = 'campaign_id'
  ) then
    insert into public.campaign_labels (campaign_id, label_id)
    select l.campaign_id, l.id
    from public.labels l
    where l.campaign_id is not null
    on conflict (campaign_id, label_id) do nothing;
  end if;
end $$;

-- 4) إزالة سياسات labels القديمة أولاً (قد تعتمد على عمود campaign_id)
drop policy if exists "labels_select" on public.labels;
drop policy if exists "labels_insert" on public.labels;
drop policy if exists "labels_update" on public.labels;
drop policy if exists "labels_delete" on public.labels;
drop policy if exists "labels_write" on public.labels;

-- 5) إزالة عمود الحملة من التعريف
alter table public.labels drop constraint if exists labels_campaign_id_fkey;
alter table public.labels drop column if exists campaign_id;

alter table public.labels alter column workspace_id set not null;

-- 6) RLS للتصنيفات (مساحة العمل)
create policy "labels_select" on public.labels
  for select using (
    is_workspace_member(workspace_id)
  );

create policy "labels_insert" on public.labels
  for insert with check (
    has_role(workspace_id, array['owner', 'admin']::member_role[])
  );

create policy "labels_update" on public.labels
  for update using (
    has_role(workspace_id, array['owner', 'admin']::member_role[])
  )
  with check (
    has_role(workspace_id, array['owner', 'admin']::member_role[])
  );

create policy "labels_delete" on public.labels
  for delete using (
    has_role(workspace_id, array['owner', 'admin']::member_role[])
  );

-- 7) RLS لجدول الربط
alter table public.campaign_labels enable row level security;

drop policy if exists "campaign_labels_select" on public.campaign_labels;
drop policy if exists "campaign_labels_insert" on public.campaign_labels;
drop policy if exists "campaign_labels_update" on public.campaign_labels;
drop policy if exists "campaign_labels_delete" on public.campaign_labels;

create policy "campaign_labels_select" on public.campaign_labels
  for select using (
    exists (
      select 1 from public.campaigns c
      where c.id = campaign_labels.campaign_id
        and c.deleted_at is null
        and is_workspace_member(c.workspace_id)
    )
  );

create policy "campaign_labels_insert" on public.campaign_labels
  for insert with check (
    exists (
      select 1 from public.campaigns c
      where c.id = campaign_id
        and c.deleted_at is null
        and has_role(c.workspace_id, array['owner', 'admin']::member_role[])
    )
  );

create policy "campaign_labels_update" on public.campaign_labels
  for update using (
    exists (
      select 1 from public.campaigns c
      where c.id = campaign_labels.campaign_id
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

create policy "campaign_labels_delete" on public.campaign_labels
  for delete using (
    exists (
      select 1 from public.campaigns c
      where c.id = campaign_labels.campaign_id
        and c.deleted_at is null
        and has_role(c.workspace_id, array['owner', 'admin']::member_role[])
    )
  );
