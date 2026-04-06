import type { Workspace, MemberRole, WorkspaceMember } from '~/types'

export const useWorkspace = () => {
  const store = useWorkspaceStore()

  return {
    workspace: computed<Workspace | null>(() => store.currentWorkspace),
    myRole: computed<MemberRole | null>(() => store.myRole),
    membership: computed<WorkspaceMember | null>(() => store.myMembership),
    isOwnerOrAdmin: computed<boolean>(() => store.isOwnerOrAdmin),
    loading: computed<boolean>(() => store.loading),
  }
}
