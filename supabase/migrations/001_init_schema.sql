-- =========================================================
-- Migration 001: Schema Initialization
-- CRM SaaS Multi-Tenant System
-- =========================================================

-- ---- Extensions ----
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ---- Enum Types ----
create type public.member_role as enum (
  'owner', 'admin', 'agent', 'reservation_manager'
);

-- =========================================================
-- TABLE: profiles
-- =========================================================
create table public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  full_name  text,
  avatar_url text,
  phone      text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =========================================================
-- TABLE: workspaces (Multi-Tenant root)
-- =========================================================
create table public.workspaces (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       text unique not null,
  logo_url   text,
  settings   jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

-- =========================================================
-- TABLE: workspace_members (RBAC)
-- =========================================================
create table public.workspace_members (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id      uuid not null references profiles(id) on delete cascade,
  role         member_role not null default 'agent',
  is_active    boolean default true,
  invited_by   uuid references profiles(id),
  joined_at    timestamptz default now(),
  unique(workspace_id, user_id)
);

-- =========================================================
-- TABLE: channels (قنوات الجلب)
-- =========================================================
create table public.channels (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  name         text not null,
  type         text not null,
  is_active    boolean default true,
  created_at   timestamptz default now()
);

-- =========================================================
-- TABLE: statuses (حالات العميل)
-- =========================================================
create table public.statuses (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  name         text not null,
  color        text default '#6B7280',
  sort_order   int default 0,
  is_active    boolean default true,
  created_at   timestamptz default now()
);

-- =========================================================
-- TABLE: labels (التصنيفات)
-- =========================================================
create table public.labels (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  name         text not null,
  color        text default '#6B7280',
  created_at   timestamptz default now()
);

-- =========================================================
-- TABLE: campaigns (الحملات)
-- =========================================================
create table public.campaigns (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  name         text not null,
  description  text,
  is_active    boolean default true,
  starts_at    timestamptz,
  ends_at      timestamptz,
  created_at   timestamptz default now(),
  deleted_at   timestamptz
);

-- =========================================================
-- TABLE: sms_gateways (إعدادات SMS)
-- =========================================================
create table public.sms_gateways (
  id                uuid primary key default gen_random_uuid(),
  workspace_id      uuid not null references workspaces(id) on delete cascade,
  provider_name     text not null,
  api_key_encrypted text,
  sender_name       text,
  is_active         boolean default true,
  created_at        timestamptz default now()
);

-- =========================================================
-- TABLE: leads (العملاء المحتملون - Core)
-- =========================================================
create table public.leads (
  id              uuid primary key default gen_random_uuid(),
  workspace_id    uuid not null references workspaces(id) on delete cascade,
  full_name       text not null,
  email           text,
  phone           text,
  notes           text,
  status_id       uuid references statuses(id) on delete set null,
  channel_id      uuid references channels(id) on delete set null,
  campaign_id     uuid references campaigns(id) on delete set null,
  label_id        uuid references labels(id) on delete set null,
  assigned_to     uuid references profiles(id) on delete set null,
  source_metadata jsonb default '{}',
  created_by      uuid references profiles(id),
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  deleted_at      timestamptz
);

-- =========================================================
-- TABLE: lead_notes
-- =========================================================
create table public.lead_notes (
  id           uuid primary key default gen_random_uuid(),
  lead_id      uuid not null references leads(id) on delete cascade,
  workspace_id uuid not null references workspaces(id) on delete cascade,
  content      text not null,
  created_by   uuid references profiles(id),
  created_at   timestamptz default now()
);

-- =========================================================
-- TABLE: lead_attachments
-- =========================================================
create table public.lead_attachments (
  id           uuid primary key default gen_random_uuid(),
  lead_id      uuid not null references leads(id) on delete cascade,
  workspace_id uuid not null references workspaces(id) on delete cascade,
  file_name    text not null,
  file_url     text not null,
  file_size    int,
  mime_type    text,
  uploaded_by  uuid references profiles(id),
  created_at   timestamptz default now()
);

-- =========================================================
-- TABLE: lead_status_history
-- =========================================================
create table public.lead_status_history (
  id            uuid primary key default gen_random_uuid(),
  lead_id       uuid not null references leads(id) on delete cascade,
  workspace_id  uuid not null references workspaces(id) on delete cascade,
  old_status_id uuid references statuses(id) on delete set null,
  new_status_id uuid references statuses(id) on delete set null,
  changed_by    uuid references profiles(id),
  changed_at    timestamptz default now()
);

-- =========================================================
-- TABLE: message_templates (قوالب الرسائل)
-- =========================================================
create table public.message_templates (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  name         text not null,
  type         text not null check (type in ('sms', 'email')),
  subject      text,
  body         text not null,
  created_at   timestamptz default now()
);

-- =========================================================
-- TABLE: automation_rules (قواعد الأتمتة)
-- =========================================================
create table public.automation_rules (
  id                uuid primary key default gen_random_uuid(),
  workspace_id      uuid not null references workspaces(id) on delete cascade,
  name              text not null,
  trigger_type      text not null default 'status_change',
  trigger_status_id uuid references statuses(id) on delete cascade,
  action_type       text not null check (action_type in ('send_sms', 'send_email')),
  template_id       uuid references message_templates(id) on delete cascade,
  gateway_id        uuid references sms_gateways(id) on delete set null,
  is_active         boolean default true,
  created_at        timestamptz default now()
);

-- =========================================================
-- TABLE: invoices (الفوترة)
-- =========================================================
create table public.invoices (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  lead_id      uuid references leads(id) on delete set null,
  total_amount decimal(12,2) not null default 0,
  discount     decimal(12,2) default 0,
  due_amount   decimal(12,2) generated always as (total_amount - discount) stored,
  paid_amount  decimal(12,2) default 0,
  due_date     date,
  status       text default 'pending' check (status in ('pending','partial','paid','overdue')),
  notes        text,
  created_by   uuid references profiles(id),
  created_at   timestamptz default now(),
  updated_at   timestamptz default now(),
  deleted_at   timestamptz
);

-- =========================================================
-- INDEXES للأداء
-- =========================================================
create index idx_leads_workspace   on leads(workspace_id) where deleted_at is null;
create index idx_leads_status      on leads(status_id);
create index idx_leads_assigned    on leads(assigned_to);
create index idx_leads_created     on leads(created_at desc);
create index idx_leads_channel     on leads(channel_id);
create index idx_leads_campaign    on leads(campaign_id);
create index idx_members_ws_user   on workspace_members(workspace_id, user_id);
create index idx_status_hist_lead  on lead_status_history(lead_id, changed_at desc);
create index idx_invoices_ws       on invoices(workspace_id) where deleted_at is null;
create index idx_notes_lead        on lead_notes(lead_id);
create index idx_attachments_lead  on lead_attachments(lead_id);

-- =========================================================
-- TRIGGERS: updated_at auto-update
-- =========================================================
create or replace function public.fn_update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_leads_updated
  before update on leads
  for each row execute function fn_update_updated_at();

create trigger trg_workspaces_updated
  before update on workspaces
  for each row execute function fn_update_updated_at();

create trigger trg_invoices_updated
  before update on invoices
  for each row execute function fn_update_updated_at();

create trigger trg_profiles_updated
  before update on profiles
  for each row execute function fn_update_updated_at();

-- =========================================================
-- FUNCTION: Auto-create profile on user signup
-- =========================================================
create or replace function public.fn_handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function fn_handle_new_user();

-- =========================================================
-- FUNCTION: Auto-log status changes
-- =========================================================
create or replace function public.fn_log_lead_status_change()
returns trigger language plpgsql as $$
begin
  if old.status_id is distinct from new.status_id then
    insert into lead_status_history (lead_id, workspace_id, old_status_id, new_status_id, changed_by)
    values (new.id, new.workspace_id, old.status_id, new.status_id, auth.uid());
  end if;
  return new;
end;
$$;

create trigger trg_lead_status_log
  after update on leads
  for each row execute function fn_log_lead_status_change();
