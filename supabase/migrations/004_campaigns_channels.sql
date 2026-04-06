-- =========================================================
-- Migration 004: Campaigns (landing URL, CS script) + sales assignments
--                 Channels default type for name-only inserts
-- =========================================================

-- Campaigns: صفحة جمع البيانات + سكريبت خدمة العملاء
alter table public.campaigns
  add column if not exists landing_page_url text,
  add column if not exists customer_service_script text;

-- ربط موظفي المبيعات بالحملة (many-to-many)
create table if not exists public.campaign_sales_assignments (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references workspaces(id) on delete cascade,
  campaign_id   uuid not null references campaigns(id) on delete cascade,
  user_id       uuid not null references profiles(id) on delete cascade,
  created_at    timestamptz default now(),
  unique (campaign_id, user_id)
);

create index if not exists idx_campaign_assignments_campaign
  on public.campaign_sales_assignments(campaign_id);
create index if not exists idx_campaign_assignments_workspace
  on public.campaign_sales_assignments(workspace_id);

alter table public.campaign_sales_assignments enable row level security;

drop policy if exists "campaign_assignments_select" on public.campaign_sales_assignments;
create policy "campaign_assignments_select" on public.campaign_sales_assignments
  for select using (is_workspace_member(workspace_id));

drop policy if exists "campaign_assignments_write" on public.campaign_sales_assignments;
create policy "campaign_assignments_write" on public.campaign_sales_assignments
  for all using (has_role(workspace_id, array['owner', 'admin']::member_role[]));

-- قنوات: نوع افتراضي عند الإدخال بالاسم فقط (العمود اسمه type فيُقتبس)
alter table public.channels
  alter column "type" set default 'custom';
