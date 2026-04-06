-- =========================================================
-- Migration 003: Row Level Security Policies
-- =========================================================

-- تفعيل RLS على جميع الجداول
alter table public.profiles            enable row level security;
alter table public.workspaces          enable row level security;
alter table public.workspace_members   enable row level security;
alter table public.leads               enable row level security;
alter table public.lead_notes          enable row level security;
alter table public.lead_attachments    enable row level security;
alter table public.lead_status_history enable row level security;
alter table public.channels            enable row level security;
alter table public.statuses            enable row level security;
alter table public.labels              enable row level security;
alter table public.campaigns           enable row level security;
alter table public.sms_gateways        enable row level security;
alter table public.message_templates   enable row level security;
alter table public.automation_rules    enable row level security;
alter table public.invoices            enable row level security;

-- =========================================================
-- PROFILES
-- =========================================================
create policy "profiles_select_own" on profiles for select
  using (id = auth.uid());

create policy "profiles_update_own" on profiles for update
  using (id = auth.uid());

-- =========================================================
-- WORKSPACES
-- =========================================================
create policy "workspaces_select" on workspaces for select
  using (is_workspace_member(id) and deleted_at is null);

create policy "workspaces_insert" on workspaces for insert
  with check (true); -- يُنشأ عبر Server API بـ Service Role

create policy "workspaces_update" on workspaces for update
  using (has_role(id, array['owner', 'admin']::member_role[]));

-- =========================================================
-- WORKSPACE_MEMBERS
-- =========================================================
create policy "members_select" on workspace_members for select
  using (is_workspace_member(workspace_id));

create policy "members_insert" on workspace_members for insert
  with check (has_role(workspace_id, array['owner', 'admin']::member_role[]));

create policy "members_update" on workspace_members for update
  using (has_role(workspace_id, array['owner', 'admin']::member_role[]));

create policy "members_delete" on workspace_members for delete
  using (has_role(workspace_id, array['owner']::member_role[]));

-- =========================================================
-- LEADS
-- =========================================================
-- عرض: جميع الأعضاء يرون الـ Leads النشطة في مساحتهم
create policy "leads_select" on leads for select
  using (is_workspace_member(workspace_id) and deleted_at is null);

-- إنشاء: جميع الأعضاء
create policy "leads_insert" on leads for insert
  with check (is_workspace_member(workspace_id));

-- تعديل: Admin+ يعدل الكل، Agent يعدل المسندة له فقط
create policy "leads_update" on leads for update
  using (
    has_role(workspace_id, array['owner', 'admin']::member_role[]) or
    (
      has_role(workspace_id, array['agent', 'reservation_manager']::member_role[]) and
      assigned_to = auth.uid()
    )
  );

-- حذف ناعم (Soft Delete): Admin+ فقط
create policy "leads_delete" on leads for delete
  using (has_role(workspace_id, array['owner', 'admin']::member_role[]));

-- =========================================================
-- LEAD_NOTES
-- =========================================================
create policy "lead_notes_select" on lead_notes for select
  using (is_workspace_member(workspace_id));

create policy "lead_notes_insert" on lead_notes for insert
  with check (is_workspace_member(workspace_id));

create policy "lead_notes_delete" on lead_notes for delete
  using (created_by = auth.uid() or has_role(workspace_id, array['owner', 'admin']::member_role[]));

-- =========================================================
-- LEAD_ATTACHMENTS
-- =========================================================
create policy "attachments_select" on lead_attachments for select
  using (is_workspace_member(workspace_id));

create policy "attachments_insert" on lead_attachments for insert
  with check (is_workspace_member(workspace_id));

create policy "attachments_delete" on lead_attachments for delete
  using (uploaded_by = auth.uid() or has_role(workspace_id, array['owner', 'admin']::member_role[]));

-- =========================================================
-- LEAD_STATUS_HISTORY
-- =========================================================
create policy "status_history_select" on lead_status_history for select
  using (is_workspace_member(workspace_id));

-- =========================================================
-- CHANNELS / STATUSES / LABELS
-- =========================================================
create policy "channels_select" on channels for select
  using (is_workspace_member(workspace_id));

create policy "channels_write" on channels for all
  using (has_role(workspace_id, array['owner', 'admin']::member_role[]));

create policy "statuses_select" on statuses for select
  using (is_workspace_member(workspace_id));

create policy "statuses_write" on statuses for all
  using (has_role(workspace_id, array['owner', 'admin']::member_role[]));

create policy "labels_select" on labels for select
  using (is_workspace_member(workspace_id));

create policy "labels_write" on labels for all
  using (has_role(workspace_id, array['owner', 'admin']::member_role[]));

-- =========================================================
-- CAMPAIGNS
-- =========================================================
create policy "campaigns_select" on campaigns for select
  using (is_workspace_member(workspace_id) and deleted_at is null);

create policy "campaigns_write" on campaigns for all
  using (has_role(workspace_id, array['owner', 'admin']::member_role[]));

-- =========================================================
-- SMS_GATEWAYS
-- =========================================================
create policy "sms_gateways_select" on sms_gateways for select
  using (has_role(workspace_id, array['owner', 'admin']::member_role[]));

create policy "sms_gateways_write" on sms_gateways for all
  using (has_role(workspace_id, array['owner', 'admin']::member_role[]));

-- =========================================================
-- MESSAGE_TEMPLATES
-- =========================================================
create policy "templates_select" on message_templates for select
  using (is_workspace_member(workspace_id));

create policy "templates_write" on message_templates for all
  using (has_role(workspace_id, array['owner', 'admin']::member_role[]));

-- =========================================================
-- AUTOMATION_RULES
-- =========================================================
create policy "automations_select" on automation_rules for select
  using (is_workspace_member(workspace_id));

create policy "automations_write" on automation_rules for all
  using (has_role(workspace_id, array['owner', 'admin']::member_role[]));

-- =========================================================
-- INVOICES
-- =========================================================
create policy "invoices_select" on invoices for select
  using (
    has_role(workspace_id, array['owner', 'admin', 'reservation_manager']::member_role[]) and
    deleted_at is null
  );

create policy "invoices_write" on invoices for all
  using (has_role(workspace_id, array['owner', 'admin', 'reservation_manager']::member_role[]));
