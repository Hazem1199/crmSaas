-- =========================================================
-- Migration 009: استبدال has_role بـ has_permission في سياسات RLS
-- يُنفَّذ بعد 008_workspace_dynamic_roles.sql (دوال has_permission ووجود workspace_role_id)
-- =========================================================

-- ---- WORKSPACES ----
drop policy if exists "workspaces_update" on public.workspaces;
create policy "workspaces_update" on public.workspaces for update
  using (has_permission(id, 'workspace.manage_settings'));

-- ---- WORKSPACE_MEMBERS ----
drop policy if exists "members_insert" on public.workspace_members;
create policy "members_insert" on public.workspace_members for insert
  with check (has_permission(workspace_id, 'team.manage'));

drop policy if exists "members_update" on public.workspace_members;
create policy "members_update" on public.workspace_members for update
  using (has_permission(workspace_id, 'team.manage'));

drop policy if exists "members_delete" on public.workspace_members;
create policy "members_delete" on public.workspace_members for delete
  using (has_permission(workspace_id, 'team.remove_members'));

-- ---- LEADS ----
drop policy if exists "leads_update" on public.leads;
create policy "leads_update" on public.leads for update
  using (
    has_permission(workspace_id, 'leads.edit_any')
    or (
      has_permission(workspace_id, 'leads.edit_assigned')
      and assigned_to = auth.uid()
    )
  );

drop policy if exists "leads_delete" on public.leads;
create policy "leads_delete" on public.leads for delete
  using (has_permission(workspace_id, 'leads.delete'));

-- ---- LEAD_NOTES ----
drop policy if exists "lead_notes_delete" on public.lead_notes;
create policy "lead_notes_delete" on public.lead_notes for delete
  using (
    created_by = auth.uid()
    or has_permission(workspace_id, 'collaboration.notes_delete_any')
  );

-- ---- LEAD_ATTACHMENTS ----
drop policy if exists "attachments_delete" on public.lead_attachments;
create policy "attachments_delete" on public.lead_attachments for delete
  using (
    uploaded_by = auth.uid()
    or has_permission(workspace_id, 'collaboration.attachments_delete_any')
  );

-- ---- CHANNELS / STATUSES ----
drop policy if exists "channels_write" on public.channels;
create policy "channels_write" on public.channels for all
  using (has_permission(workspace_id, 'settings.edit_channels'));

drop policy if exists "statuses_write" on public.statuses;
create policy "statuses_write" on public.statuses for all
  using (has_permission(workspace_id, 'settings.edit_statuses'));

-- ---- LABELS (007) ----
drop policy if exists "labels_insert" on public.labels;
drop policy if exists "labels_update" on public.labels;
drop policy if exists "labels_delete" on public.labels;

create policy "labels_insert" on public.labels for insert
  with check (has_permission(workspace_id, 'labels.manage'));

create policy "labels_update" on public.labels for update
  using (has_permission(workspace_id, 'labels.manage'))
  with check (has_permission(workspace_id, 'labels.manage'));

create policy "labels_delete" on public.labels for delete
  using (has_permission(workspace_id, 'labels.manage'));

-- ---- CAMPAIGNS ----
drop policy if exists "campaigns_write" on public.campaigns;
create policy "campaigns_write" on public.campaigns for all
  using (has_permission(workspace_id, 'campaigns.manage'));

-- ---- CAMPAIGN_SALES_ASSIGNMENTS (004) ----
drop policy if exists "campaign_assignments_write" on public.campaign_sales_assignments;
create policy "campaign_assignments_write" on public.campaign_sales_assignments
  for all using (has_permission(workspace_id, 'campaigns.manage'));

-- ---- SMS / TEMPLATES / AUTOMATIONS ----
drop policy if exists "sms_gateways_select" on public.sms_gateways;
create policy "sms_gateways_select" on public.sms_gateways for select
  using (has_permission(workspace_id, 'sms.gateways_manage'));

drop policy if exists "sms_gateways_write" on public.sms_gateways;
create policy "sms_gateways_write" on public.sms_gateways for all
  using (has_permission(workspace_id, 'sms.gateways_manage'));

drop policy if exists "templates_write" on public.message_templates;
create policy "templates_write" on public.message_templates for all
  using (has_permission(workspace_id, 'templates.manage'));

drop policy if exists "automations_write" on public.automation_rules;
create policy "automations_write" on public.automation_rules for all
  using (has_permission(workspace_id, 'automations.manage'));

-- ---- INVOICES ----
drop policy if exists "invoices_select" on public.invoices;
create policy "invoices_select" on public.invoices for select
  using (
    has_permission(workspace_id, 'invoices.view')
    and deleted_at is null
  );

drop policy if exists "invoices_write" on public.invoices;
create policy "invoices_write" on public.invoices for all
  using (has_permission(workspace_id, 'invoices.manage'));

-- ---- CAMPAIGN_LABELS (007) ----
drop policy if exists "campaign_labels_insert" on public.campaign_labels;
drop policy if exists "campaign_labels_update" on public.campaign_labels;
drop policy if exists "campaign_labels_delete" on public.campaign_labels;

create policy "campaign_labels_insert" on public.campaign_labels for insert
  with check (
    exists (
      select 1 from public.campaigns c
      where c.id = campaign_id
        and c.deleted_at is null
        and has_permission(c.workspace_id, 'campaigns.manage')
    )
  );

create policy "campaign_labels_update" on public.campaign_labels for update
  using (
    exists (
      select 1 from public.campaigns c
      where c.id = campaign_labels.campaign_id
        and c.deleted_at is null
        and has_permission(c.workspace_id, 'campaigns.manage')
    )
  )
  with check (
    exists (
      select 1 from public.campaigns c
      where c.id = campaign_id
        and c.deleted_at is null
        and has_permission(c.workspace_id, 'campaigns.manage')
    )
  );

create policy "campaign_labels_delete" on public.campaign_labels for delete
  using (
    exists (
      select 1 from public.campaigns c
      where c.id = campaign_labels.campaign_id
        and c.deleted_at is null
        and has_permission(c.workspace_id, 'campaigns.manage')
    )
  );
