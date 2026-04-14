-- =========================================================
-- Migration 008: أدوار ديناميكية لكل مساحة + صلاحيات تفصيلية
-- طبّق بعد 001–007. ثم طبّق 009_rls_has_permission.sql
-- =========================================================

-- ---- 1) جدول تعريفات الصلاحيات (عالمي) ----
create table if not exists public.permission_definitions (
  key        text primary key,
  module     text        not null,
  label_ar   text        not null,
  sort_order int         not null default 0
);

insert into public.permission_definitions (key, module, label_ar, sort_order) values
  ('workspace.manage_settings', 'workspace', 'تعديل إعدادات المساحة', 10),
  ('team.manage', 'team', 'دعوة وتعديل أعضاء الفريق', 20),
  ('team.remove_members', 'team', 'إزالة أعضاء من المساحة', 30),
  ('roles.manage', 'roles', 'إدارة الأدوار والصلاحيات', 40),
  ('facebook.connect', 'facebook', 'تفعيل حساب فيسبوك', 50),
  ('leads.edit_any', 'leads', 'تعديل بيانات أي عميل محتمل', 60),
  ('leads.edit_assigned', 'leads', 'تعديل العملاء المسندين لي', 70),
  ('leads.delete', 'leads', 'حذف عميل محتمل', 80),
  ('leads.assign_labels', 'leads', 'تخصيص تصنيف لعميل', 90),
  ('leads.update_status', 'leads', 'تحديث حالة العميل', 100),
  ('leads.view_history', 'leads', 'استعراض تاريخ العميل', 110),
  ('collaboration.notes_delete_any', 'leads', 'حذف ملاحظات أي عميل', 120),
  ('collaboration.attachments_delete_any', 'leads', 'حذف مرفقات أي عميل', 130),
  ('settings.edit_channels', 'settings', 'تعديل قنوات الجلب', 140),
  ('settings.edit_statuses', 'settings', 'تعديل حالات العملاء', 150),
  ('labels.manage', 'labels', 'إدارة التصنيفات وربطها بالحملات', 160),
  ('campaigns.manage', 'campaigns', 'إدارة الحملات والتعيينات', 170),
  ('sms.gateways_manage', 'sms', 'إدارة بوابات الرسائل', 180),
  ('templates.manage', 'templates', 'قوالب الرسائل', 190),
  ('automations.manage', 'automations', 'أتمتة المتابعة', 200),
  ('invoices.view', 'invoices', 'استعراض الفواتير', 210),
  ('invoices.manage', 'invoices', 'إدارة الفواتير', 220),
  ('reports.view', 'reports', 'استعراض التقارير', 230),
  ('sms.send', 'sms', 'إرسال رسالة نصية', 240)
on conflict (key) do nothing;

-- ---- 2) أدوار المساحة ----
create table if not exists public.workspace_roles (
  id                           uuid primary key default gen_random_uuid(),
  workspace_id                 uuid not null references public.workspaces(id) on delete cascade,
  name                         text not null,
  slug                         text not null,
  is_owner_role                boolean not null default false,
  is_default_invite_role       boolean not null default false,
  distribute_customers_to_role boolean not null default false,
  created_at                   timestamptz default now(),
  unique (workspace_id, slug)
);

create unique index if not exists workspace_roles_one_default_invite
  on public.workspace_roles (workspace_id)
  where is_default_invite_role;

create unique index if not exists workspace_roles_one_owner_flag
  on public.workspace_roles (workspace_id)
  where is_owner_role;

create index if not exists idx_workspace_roles_ws on public.workspace_roles(workspace_id);

-- ---- 3) صلاحيات الدور ----
create table if not exists public.workspace_role_permissions (
  workspace_role_id uuid not null references public.workspace_roles(id) on delete cascade,
  permission_key    text not null references public.permission_definitions(key) on delete cascade,
  granted             boolean not null default true,
  primary key (workspace_role_id, permission_key)
);

create index if not exists idx_wrp_role on public.workspace_role_permissions(workspace_role_id);

-- ---- 4) ربط الأعضاء بالدور الجديد ----
alter table public.workspace_members
  add column if not exists workspace_role_id uuid references public.workspace_roles(id);

-- ---- 5) دالة التحقق من صلاحية ----
create or replace function public.has_permission(ws_id uuid, perm text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members wm
    join public.workspace_roles wr on wr.id = wm.workspace_role_id
    where wm.workspace_id = ws_id
      and wm.user_id = auth.uid()
      and wm.is_active = true
      and (
        wr.is_owner_role = true
        or exists (
          select 1
          from public.workspace_role_permissions wrp
          where wrp.workspace_role_id = wr.id
            and wrp.permission_key = perm
            and wrp.granted = true
        )
      )
  );
$$;

-- ---- 6) بذور الأدوار لكل مساحة عمل ----
create or replace function public.seed_workspace_roles(p_workspace_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner   uuid;
  v_admin   uuid;
  v_agent   uuid;
  v_rm      uuid;
  v_perm    text;
begin
  if exists (select 1 from public.workspace_roles where workspace_id = p_workspace_id limit 1) then
    return;
  end if;

  insert into public.workspace_roles (workspace_id, name, slug, is_owner_role, is_default_invite_role, distribute_customers_to_role)
  values (p_workspace_id, 'مالك', 'owner', true, false, false)
  returning id into v_owner;

  insert into public.workspace_roles (workspace_id, name, slug, is_owner_role, is_default_invite_role, distribute_customers_to_role)
  values (p_workspace_id, 'مدير', 'admin', false, false, false)
  returning id into v_admin;

  insert into public.workspace_roles (workspace_id, name, slug, is_owner_role, is_default_invite_role, distribute_customers_to_role)
  values (p_workspace_id, 'وكيل مبيعات', 'agent', false, true, true)
  returning id into v_agent;

  insert into public.workspace_roles (workspace_id, name, slug, is_owner_role, is_default_invite_role, distribute_customers_to_role)
  values (p_workspace_id, 'مدير حجوزات', 'reservation_manager', false, false, false)
  returning id into v_rm;

  -- المدير: كل الصلاحيات ما عدا إزالة الأعضاء (للمالك فقط)
  for v_perm in
    select key from public.permission_definitions
    where key <> 'team.remove_members'
  loop
    insert into public.workspace_role_permissions (workspace_role_id, permission_key, granted)
    values (v_admin, v_perm, true);
  end loop;

  -- وكيل مبيعات (افتراضي للدعوات): مطابق تقريباً لصلاحيات Agent في السيستم القديم
  insert into public.workspace_role_permissions (workspace_role_id, permission_key, granted) values
    (v_agent, 'leads.edit_assigned', true),
    (v_agent, 'leads.assign_labels', true),
    (v_agent, 'leads.update_status', true),
    (v_agent, 'leads.view_history', true),
    (v_agent, 'reports.view', true),
    (v_agent, 'sms.send', true);

  -- مدير حجوزات: وكيل + فواتير
  insert into public.workspace_role_permissions (workspace_role_id, permission_key, granted)
  select v_rm, permission_key, true
  from public.workspace_role_permissions
  where workspace_role_id = v_agent
  on conflict do nothing;

  insert into public.workspace_role_permissions (workspace_role_id, permission_key, granted) values
    (v_rm, 'invoices.view', true),
    (v_rm, 'invoices.manage', true)
  on conflict do nothing;
end;
$$;

-- مساحات موجودة
do $$
declare
  r record;
begin
  for r in
    select id from public.workspaces where deleted_at is null
  loop
    perform public.seed_workspace_roles(r.id);
  end loop;
end $$;

-- ربط الأعضاء بالدور المناسب (من عمود role القديم)
update public.workspace_members wm
set workspace_role_id = wr.id
from public.workspace_roles wr
where wr.workspace_id = wm.workspace_id
  and wr.slug = wm.role::text
  and wm.workspace_role_id is null;

-- أي عضو بلا تطابق (احتياطي) → وكيل مبيعات
update public.workspace_members wm
set workspace_role_id = (
  select wr.id from public.workspace_roles wr
  where wr.workspace_id = wm.workspace_id and wr.slug = 'agent'
  limit 1
)
where wm.workspace_role_id is null;

alter table public.workspace_members
  alter column workspace_role_id set not null;

-- إسقاط عمود الدور القديم (enum)
alter table public.workspace_members drop column if exists role;

-- has_role: مطابقة slug الدور مع قيم enum القديمة
create or replace function public.has_role(ws_id uuid, required_roles member_role[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members wm
    join public.workspace_roles wr on wr.id = wm.workspace_role_id
    cross join unnest(required_roles) as u(enum_val)
    where wm.workspace_id = ws_id
      and wm.user_id = auth.uid()
      and wm.is_active = true
      and wr.slug = u.enum_val::text
  );
$$;

drop function if exists public.get_my_role(uuid);

create function public.get_my_role(ws_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select wr.slug
  from public.workspace_members wm
  join public.workspace_roles wr on wr.id = wm.workspace_role_id
  where wm.workspace_id = ws_id
    and wm.user_id = auth.uid()
    and wm.is_active = true
  limit 1;
$$;

-- ---- 7) RLS للجداول الجديدة ----
alter table public.permission_definitions enable row level security;
create policy "permission_definitions_read_all"
  on public.permission_definitions for select
  using (true);

alter table public.workspace_roles enable row level security;

drop policy if exists "workspace_roles_select" on public.workspace_roles;
drop policy if exists "workspace_roles_write" on public.workspace_roles;
drop policy if exists "workspace_roles_insert_owner_seed" on public.workspace_roles;
drop policy if exists "workspace_roles_owner_insert" on public.workspace_roles;
drop policy if exists "workspace_roles_insert" on public.workspace_roles;
drop policy if exists "workspace_roles_update" on public.workspace_roles;
drop policy if exists "workspace_roles_delete" on public.workspace_roles;

create policy "workspace_roles_select" on public.workspace_roles
  for select using (is_workspace_member(workspace_id));

create policy "workspace_roles_insert" on public.workspace_roles
  for insert with check (has_permission(workspace_id, 'roles.manage'));

create policy "workspace_roles_update" on public.workspace_roles
  for update using (
    has_permission(workspace_id, 'roles.manage')
    and not is_owner_role
  )
  with check (
    has_permission(workspace_id, 'roles.manage')
    and not is_owner_role
  );

create policy "workspace_roles_delete" on public.workspace_roles
  for delete using (
    has_permission(workspace_id, 'roles.manage')
    and not is_owner_role
  );

alter table public.workspace_role_permissions enable row level security;

drop policy if exists "wrp_select" on public.workspace_role_permissions;
create policy "wrp_select" on public.workspace_role_permissions
  for select using (
    exists (
      select 1 from public.workspace_roles wr
      where wr.id = workspace_role_permissions.workspace_role_id
        and is_workspace_member(wr.workspace_id)
    )
  );

drop policy if exists "wrp_insert" on public.workspace_role_permissions;
drop policy if exists "wrp_update" on public.workspace_role_permissions;
drop policy if exists "wrp_delete" on public.workspace_role_permissions;
drop policy if exists "wrp_write" on public.workspace_role_permissions;

create policy "wrp_insert" on public.workspace_role_permissions
  for insert with check (
    exists (
      select 1 from public.workspace_roles wr
      where wr.id = workspace_role_permissions.workspace_role_id
        and has_permission(wr.workspace_id, 'roles.manage')
        and not wr.is_owner_role
    )
  );

create policy "wrp_update" on public.workspace_role_permissions
  for update using (
    exists (
      select 1 from public.workspace_roles wr
      where wr.id = workspace_role_permissions.workspace_role_id
        and has_permission(wr.workspace_id, 'roles.manage')
        and not wr.is_owner_role
    )
  )
  with check (
    exists (
      select 1 from public.workspace_roles wr
      where wr.id = workspace_role_permissions.workspace_role_id
        and has_permission(wr.workspace_id, 'roles.manage')
        and not wr.is_owner_role
    )
  );

create policy "wrp_delete" on public.workspace_role_permissions
  for delete using (
    exists (
      select 1 from public.workspace_roles wr
      where wr.id = workspace_role_permissions.workspace_role_id
        and has_permission(wr.workspace_id, 'roles.manage')
        and not wr.is_owner_role
    )
  );

-- منع تعديل صلاحيات دور المالك عبر wrp: الدور المالك بلا صفوف في wrp
-- السياسة أعلاه تستثني is_owner_role للجدول wr — لكن wrp لا يربط بصفوف المالك عادة

comment on function public.has_permission(uuid, text) is 'تحقق من صلاحية للمستخدم الحالي في مساحة العمل';
comment on function public.seed_workspace_roles(uuid) is 'إنشاء أدوار افتراضية لمساحة عمل';

grant execute on function public.seed_workspace_roles(uuid) to service_role;
grant execute on function public.seed_workspace_roles(uuid) to postgres;
