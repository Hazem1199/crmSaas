// GET /api/[workspace]/labels — كل تصنيفات المساحة
import { requireWorkspaceMember } from '../../../utils/workspace-request'

export default defineEventHandler(async (event) => {
  const { workspaceId } = await requireWorkspaceMember(event)
  const svc = useServiceRoleClient()

  const { data, error } = await svc
    .from('labels')
    .select('id, workspace_id, name, color, created_at')
    .eq('workspace_id', workspaceId)
    .order('name')

  if (error) throw createError({ statusCode: 500, message: error.message })
  return { data: data ?? [] }
})
