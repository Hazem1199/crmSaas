import { defineStore } from 'pinia'
import type { Workspace, WorkspaceMember, MemberRole } from '~/types'

export const useWorkspaceStore = defineStore('workspace', () => {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  const currentWorkspace = ref<Workspace | null>(null)
  const myMembership = ref<WorkspaceMember | null>(null)
  const myPermissions = ref<Set<string>>(new Set())
  const loading = ref(false)
  const error = ref<string | null>(null)

  const myRole = computed<MemberRole | string | null>(() => {
    const slug = myMembership.value?.workspace_roles?.slug
    return slug ?? null
  })

  const isOwnerOrAdmin = computed(() => {
    const slug = myMembership.value?.workspace_roles?.slug
    return slug === 'owner' || slug === 'admin'
  })

  const fetchWorkspace = async (slug: string): Promise<boolean> => {
    loading.value = true
    error.value = null

    try {
      const { data: ws, error: wsErr } = await supabase
        .from('workspaces')
        .select('*')
        .eq('slug', slug)
        .is('deleted_at', null)
        .single()

      if (wsErr || !ws) {
        error.value = 'مساحة العمل غير موجودة'
        return false
      }

      currentWorkspace.value = ws as Workspace

      if (user.value) {
        const { data: membership } = await supabase
          .from('workspace_members')
          .select(`
            *,
            workspace_roles ( id, name, slug, is_owner_role, is_default_invite_role, distribute_customers_to_role )
          `)
          .eq('workspace_id', ws.id)
          .eq('user_id', user.value.id)
          .maybeSingle()

        if (membership) {
          const m = membership as WorkspaceMember & { workspace_roles?: WorkspaceMember['workspace_roles'] | WorkspaceMember['workspace_roles'][] }
          const wr = m.workspace_roles
          m.workspace_roles = Array.isArray(wr) ? wr[0] : wr
          myMembership.value = m as WorkspaceMember
        }
        else {
          myMembership.value = null
        }

        if (myMembership.value?.is_active) {
          try {
            const res = await $fetch<{ permissions: string[] }>(`/api/${slug}/permissions/me`)
            myPermissions.value = new Set(res.permissions ?? [])
          }
          catch {
            myPermissions.value = new Set()
          }
        }
        else {
          myPermissions.value = new Set()
        }
      }

      return true
    }
    finally {
      loading.value = false
    }
  }

  const clearWorkspace = () => {
    currentWorkspace.value = null
    myMembership.value = null
    myPermissions.value = new Set()
  }

  return {
    currentWorkspace,
    myMembership,
    myPermissions,
    myRole,
    isOwnerOrAdmin,
    loading,
    error,
    fetchWorkspace,
    clearWorkspace,
  }
})
