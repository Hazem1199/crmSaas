export const usePermissions = () => {
  const { myRole } = useWorkspace()

  // مصفوفة الصلاحيات: permission => الأدوار المسموح لها
  const permissionsMap: Record<string, string[]> = {
    manage_settings:    ['owner', 'admin'],
    manage_team:        ['owner', 'admin'],
    manage_automations: ['owner', 'admin'],
    manage_campaigns:   ['owner', 'admin'],
    delete_lead:        ['owner', 'admin'],
    view_reports:       ['owner', 'admin'],
    view_invoices:      ['owner', 'admin', 'reservation_manager'],
    manage_invoices:    ['owner', 'admin', 'reservation_manager'],
    create_lead:        ['owner', 'admin', 'agent', 'reservation_manager'],
    edit_any_lead:      ['owner', 'admin'],
    edit_own_lead:      ['owner', 'admin', 'agent', 'reservation_manager'],
  }

  /**
   * التحقق من صلاحية معينة بناءً على دور المستخدم
   */
  const can = (permission: string | null): boolean => {
    if (!permission) return true
    if (!myRole.value) return false
    return permissionsMap[permission]?.includes(myRole.value) ?? false
  }

  /**
   * التحقق من أن المستخدم لديه دور معين
   */
  const hasRole = (role: string | string[]): boolean => {
    if (!myRole.value) return false
    const roles = Array.isArray(role) ? role : [role]
    return roles.includes(myRole.value)
  }

  return { can, hasRole, myRole }
}
