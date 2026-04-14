-- =========================================================
-- Migration 011: دوال مساعدة للدعوات (تنظيف انتهاء الصلاحية)
-- =========================================================

create or replace function public.expire_old_workspace_invitations()
returns integer
language sql
security definer
set search_path = public
as $$
  with u as (
    update public.workspace_invitations
    set status = 'expired'
    where status = 'pending'
      and expires_at < now()
    returning id
  )
  select count(*)::int from u;
$$;

revoke all on function public.expire_old_workspace_invitations() from public;
grant execute on function public.expire_old_workspace_invitations() to service_role;
