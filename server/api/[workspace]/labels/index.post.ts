// POST /api/[workspace]/labels — إنشاء تصنيف في المساحة
import { requireWorkspaceAdmin } from '../../../utils/workspace-request'

export default defineEventHandler(async (event) => {
  const { workspaceId } = await requireWorkspaceAdmin(event)
  const body = await readBody(event).catch(() => ({})) as { name?: string; color?: string }
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  if (!name) throw createError({ statusCode: 400, message: 'اسم التصنيف مطلوب' })

  const color = typeof body.color === 'string' && body.color.trim() ? body.color.trim() : '#6B7280'

  const svc = useServiceRoleClient()
  const { data, error } = await svc
    .from('labels')
    .insert({ workspace_id: workspaceId, name, color })
    .select('id, workspace_id, name, color, created_at')
    .single()

  if (error) throw createError({ statusCode: 500, message: error.message })
  return { data }
})
