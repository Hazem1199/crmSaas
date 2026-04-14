// =========================================================
// Global TypeScript Types for CRM SaaS
// =========================================================

/** قيم slug للأدوار المعرّفة افتراضياً (تطابق workspace_roles.slug) */
export type MemberRole = 'owner' | 'admin' | 'agent' | 'reservation_manager'
export type InvoiceStatus = 'pending' | 'partial' | 'paid' | 'overdue'
export type MessageType = 'sms' | 'email'
export type ActionType = 'send_sms' | 'send_email'

export interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
  phone: string | null
  created_at: string
  updated_at: string
}

export interface Workspace {
  id: string
  name: string
  slug: string
  logo_url: string | null
  settings: Record<string, unknown>
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface WorkspaceRole {
  id: string
  workspace_id: string
  name: string
  slug: string
  is_owner_role: boolean
  is_default_invite_role: boolean
  distribute_customers_to_role: boolean
  created_at: string
  /** مُعبأ من قائمة الأدوار فقط */
  member_count?: number
}

export interface WorkspaceMember {
  id: string
  workspace_id: string
  user_id: string
  workspace_role_id: string
  is_active: boolean
  invited_by: string | null
  joined_at: string
  /** مُعبأ من join workspace_roles */
  workspace_roles?: Pick<WorkspaceRole, 'id' | 'name' | 'slug' | 'is_owner_role'>
  profile?: Profile
}

/** صف دعوة من API قائمة الدعوات */
export interface WorkspaceInvitationRow {
  id: string
  invitee_email: string
  status: 'pending' | 'accepted' | 'expired' | 'cancelled'
  created_at: string
  expires_at: string
  accepted_at: string | null
  role?: Pick<WorkspaceRole, 'id' | 'name' | 'slug'> | null
}

export interface Channel {
  id: string
  workspace_id: string
  name: string
  type: string
  is_active: boolean
  created_at: string
}

export interface Status {
  id: string
  workspace_id: string
  name: string
  color: string
  sort_order: number
  is_active: boolean
  created_at: string
}

export interface Label {
  id: string
  workspace_id: string
  name: string
  color: string
  created_at: string
}

export interface CampaignSalesAssignment {
  id: string
  workspace_id: string
  campaign_id: string
  user_id: string
  created_at: string
  profile?: Profile | null
}

/** عيّنة للعرض في جدول الحملات (أول تصنيفات مربوطة) */
export interface CampaignLabelPreview {
  id: string
  name: string
  color: string
}

export interface Campaign {
  id: string
  workspace_id: string
  name: string
  description: string | null
  is_active: boolean
  starts_at: string | null
  ends_at: string | null
  /** يُعبأ بعد تطبيق migration 004 */
  landing_page_url?: string | null
  customer_service_script?: string | null
  created_at: string
  deleted_at: string | null
  /** مُعبأ من الـ API عند قائمة الحملات */
  assignments?: CampaignSalesAssignment[]
  /** عدد العملاء المحتملين النشطين المرتبطين بالحملة */
  lead_count?: number
  /** عدد التصنيفات المربوطة بهذه الحملة (من جدول الربط) */
  label_count?: number
  /** حتى 3 تصنيفات للعرض كشارات في الجدول */
  labels_preview?: CampaignLabelPreview[]
}

export interface SmsGateway {
  id: string
  workspace_id: string
  provider_name: string
  sender_name: string | null
  is_active: boolean
  created_at: string
}

export interface Lead {
  id: string
  workspace_id: string
  full_name: string
  email: string | null
  phone: string | null
  notes: string | null
  status_id: string | null
  channel_id: string | null
  campaign_id: string | null
  assigned_to: string | null
  source_metadata: Record<string, unknown>
  created_by: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  // Joined relations
  status?: Status | null
  channel?: Channel | null
  campaign?: Campaign | null
  assigned_agent?: Profile | null
}

export interface LeadNote {
  id: string
  lead_id: string
  workspace_id: string
  content: string
  created_by: string | null
  created_at: string
  profile?: Profile | null
}

export interface LeadAttachment {
  id: string
  lead_id: string
  workspace_id: string
  file_name: string
  file_url: string
  file_size: number | null
  mime_type: string | null
  uploaded_by: string | null
  created_at: string
}

export interface LeadStatusHistory {
  id: string
  lead_id: string
  workspace_id: string
  old_status_id: string | null
  new_status_id: string | null
  changed_by: string | null
  changed_at: string
  old_status?: Status | null
  new_status?: Status | null
  changed_by_profile?: Profile | null
}

export interface MessageTemplate {
  id: string
  workspace_id: string
  name: string
  type: MessageType
  subject: string | null
  body: string
  created_at: string
}

export interface AutomationRule {
  id: string
  workspace_id: string
  name: string
  trigger_type: string
  trigger_status_id: string | null
  action_type: ActionType
  template_id: string | null
  gateway_id: string | null
  is_active: boolean
  created_at: string
  trigger_status?: Status | null
  template?: MessageTemplate | null
}

export interface Invoice {
  id: string
  workspace_id: string
  lead_id: string | null
  total_amount: number
  discount: number
  due_amount: number
  paid_amount: number
  due_date: string | null
  status: InvoiceStatus
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  lead?: Lead | null
}

// API Response helpers
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}

export interface NavItem {
  label: string
  icon: string
  /** للعناصر الفرعية فقط؛ المجموعات قد لا تحتاج رابطًا */
  to?: string
  permission: string | null
  badge?: number | string
  children?: NavItem[]
}
