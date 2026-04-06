import { defineStore } from 'pinia'
import type { Workspace, WorkspaceMember, MemberRole } from '~/types'

export const useWorkspaceStore = defineStore('workspace', () => {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  const currentWorkspace = ref<Workspace | null>(null)
  const myMembership = ref<WorkspaceMember | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const myRole = computed<MemberRole | null>(() => myMembership.value?.role ?? null)

  const isOwnerOrAdmin = computed(() =>
    myRole.value === 'owner' || myRole.value === 'admin'
  )

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
          .select('*')
          .eq('workspace_id', ws.id)
          .eq('user_id', user.value.id)
          .eq('is_active', true)
          .single()

        myMembership.value = membership as WorkspaceMember | null
      }

      return true
    } finally {
      loading.value = false
    }
  }

  const clearWorkspace = () => {
    currentWorkspace.value = null
    myMembership.value = null
  }

  return {
    currentWorkspace,
    myMembership,
    myRole,
    isOwnerOrAdmin,
    loading,
    error,
    fetchWorkspace,
    clearWorkspace,
  }
})
