// POST /api/[workspace]/settings/channels — إضافة قناة (اسم فقط؛ النوع custom)
import { requireWorkspaceAdmin } from '../../../utils/workspace-request'

export default defineEventHandler(async (event) => {
  const { workspaceId } = await requireWorkspaceAdmin(event)
  const body = await readBody(event).catch(() => ({})) as { name?: string }
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  if (!name) {
    throw createError({ statusCode: 400, message: 'اسم القناة مطلوب' })
  }

  const svc = useServiceRoleClient()
  const { data, error } = await svc
    .from('channels')
    .insert({
      workspace_id: workspaceId,
      name,
      type: 'custom',
    })
    .select('*')
    .single()

  if (error) throw createError({ statusCode: 500, message: error.message })
  return { data }
})
