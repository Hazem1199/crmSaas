// GET /api/[workspace]/permissions/definitions — قائمة كل مفاتيح الصلاحيات (لواجهة الشبكة)
import { requireWorkspaceMember } from '../../../utils/workspace-request'

export default defineEventHandler(async (event) => {
  await requireWorkspaceMember(event)
  const svc = useServiceRoleClient()

  const { data, error } = await svc
    .from('permission_definitions')
    .select('key, module, label_ar, sort_order')
    .order('sort_order', { ascending: true })

  if (error) throw createError({ statusCode: 500, message: error.message })

  return { data: data ?? [] }
})
