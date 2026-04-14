import { computed } from 'vue'
import { useWorkspaceStore } from '~/stores/workspace'

/**
 * أسماء الصلاحيات في الواجهة (القديمة) → مفاتيح permission_definitions
 */
const LEGACY_PERMISSION_MAP: Record<string, string> = {
  manage_settings: 'workspace.manage_settings',
  manage_team: 'team.manage',
  manage_automations: 'automations.manage',
  manage_campaigns: 'campaigns.manage',
  delete_lead: 'leads.delete',
  view_reports: 'reports.view',
  view_invoices: 'invoices.view',
  manage_invoices: 'invoices.manage',
  edit_any_lead: 'leads.edit_any',
  edit_own_lead: 'leads.edit_assigned',
}

export const usePermissions = () => {
  const store = useWorkspaceStore()

  const can = (permission: string | null): boolean => {
    if (!permission) return true
    if (!store.myMembership) return false
    if (store.myMembership.is_active === false) return false

    /** دور المالك (فاتح المساحة): كل الصلاحيات في الواجهة بغض النظر عن تحميل /permissions/me */
    if (store.myMembership.workspace_roles?.is_owner_role === true) {
      return true
    }

    if (permission === 'create_lead') {
      return true
    }

    const key = LEGACY_PERMISSION_MAP[permission] ?? permission
    return store.myPermissions.has(key)
  }

  const hasRole = (role: string | string[]): boolean => {
    if (store.myMembership?.is_active === false) return false
    const wr = store.myMembership?.workspace_roles
    const slug = wr?.is_owner_role === true ? 'owner' : wr?.slug
    if (!slug) return false
    const roles = Array.isArray(role) ? role : [role]
    return roles.includes(slug)
  }

  const myRole = computed(() => store.myRole)

  return { can, hasRole, myRole }
}
