-- =========================================================
-- Migration 010: دعوات الأعضاء + دالة بحث المستخدم بالبريد (للـ service role)
-- =========================================================

-- بحث عن user id في auth.users (للاستخدام من الخادم فقط)
create or replace function public.lookup_auth_user_id_by_email(p_email text)
returns uuid
language sql
stable
security definer
set search_path = auth
as $$
  select id
  from auth.users
  where email is not null
    and lower(trim(email)) = lower(trim(p_email))
  limit 1;
$$;

revoke all on function public.lookup_auth_user_id_by_email(text) from public;
grant execute on function public.lookup_auth_user_id_by_email(text) to service_role;

-- جدول الدعوات
create table if not exists public.workspace_invitations (
  id                    uuid primary key default gen_random_uuid(),
  workspace_id          uuid not null references public.workspaces(id) on delete cascade,
  workspace_role_id     uuid not null references public.workspace_roles(id) on delete cascade,
  invitee_email         text not null,
  token                 text not null unique,
  status                text not null default 'pending'
    check (status in ('pending', 'accepted', 'expired', 'cancelled')),
  invited_by            uuid references public.profiles(id) on delete set null,
  created_at            timestamptz not null default now(),
  expires_at            timestamptz not null default (now() + interval '7 days'),
  accepted_at           timestamptz,
  accepted_by           uuid references auth.users(id) on delete set null
);

create index if not exists idx_workspace_invitations_ws on public.workspace_invitations(workspace_id);
create index if not exists idx_workspace_invitations_email on public.workspace_invitations(lower(invitee_email));

create unique index if not exists workspace_invitations_one_pending_per_ws_email
  on public.workspace_invitations (workspace_id, lower(invitee_email))
  where status = 'pending';

alter table public.workspace_invitations enable row level security;

comment on table public.workspace_invitations is 'دعوات الانضمام لمساحة عمل؛ الوصول من التطبيق عبر Service Role';
