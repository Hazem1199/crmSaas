-- =========================================================
-- Migration 002: RLS Helper Functions
-- =========================================================

-- تحديد دور المستخدم في مساحة العمل
create or replace function public.get_my_role(ws_id uuid)
returns member_role
language sql stable security definer
set search_path = public
as $$
  select role
  from workspace_members
  where workspace_id = ws_id
    and user_id = auth.uid()
    and is_active = true
  limit 1;
$$;

-- التحقق من عضوية المستخدم في مساحة العمل
create or replace function public.is_workspace_member(ws_id uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from workspace_members
    where workspace_id = ws_id
      and user_id = auth.uid()
      and is_active = true
  );
$$;

-- التحقق من أن المستخدم لديه دور معين أو أعلى
create or replace function public.has_role(ws_id uuid, required_roles member_role[])
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from workspace_members
    where workspace_id = ws_id
      and user_id = auth.uid()
      and is_active = true
      and role = any(required_roles)
  );
$$;
