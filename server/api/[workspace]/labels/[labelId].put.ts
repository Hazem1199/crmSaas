// PUT /api/[workspace]/labels/:labelId
import { requireWorkspaceAdmin } from '../../../utils/workspace-request'

export default defineEventHandler(async (event) => {
  const { workspaceId } = await requireWorkspaceAdmin(event)
  const labelId = getRouterParam(event, 'labelId')!
  const svc = useServiceRoleClient()

  const { data: existing, error: exErr } = await svc
    .from('labels')
    .select('id')
    .eq('id', labelId)
    .eq('workspace_id', workspaceId)
    .maybeSingle()

  if (exErr) throw createError({ statusCode: 500, message: exErr.message })
  if (!existing) throw createError({ statusCode: 404, message: 'التصنيف غير موجود' })

  const body = await readBody(event).catch(() => ({})) as { name?: string; color?: string }
  const patch: Record<string, string> = {}
  if (typeof body.name === 'string') {
    const n = body.name.trim()
    if (!n) throw createError({ statusCode: 400, message: 'اسم التصنيف مطلوب' })
    patch.name = n
  }
  if (typeof body.color === 'string' && body.color.trim()) patch.color = body.color.trim()

  if (!Object.keys(patch).length) {
    throw createError({ statusCode: 400, message: 'لا يوجد حقول للتحديث' })
  }

  const { data, error } = await svc.from('labels').update(patch).eq('id', labelId).select().single()
  if (error) throw createError({ statusCode: 500, message: error.message })
  return { data }
})
