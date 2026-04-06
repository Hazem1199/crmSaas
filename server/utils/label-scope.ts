import { useServiceRoleClient } from './supabase'

/** يتأكد أن كل معرفات التصنيفات تابعة لنفس مساحة العمل */
export async function assertLabelsBelongToWorkspace(
  labelIds: string[],
  workspaceId: string,
) {
  const unique = [...new Set(labelIds.filter(Boolean))]
  if (!unique.length) return

  const svc = useServiceRoleClient()
  const { data, error } = await svc
    .from('labels')
    .select('id')
    .eq('workspace_id', workspaceId)
    .in('id', unique)

  if (error) throw createError({ statusCode: 500, message: error.message })
  const found = new Set((data ?? []).map((r) => r.id))
  for (const id of unique) {
    if (!found.has(id)) {
      throw createError({ statusCode: 400, message: 'تصنيف غير صالح أو لا ينتمي لهذه المساحة' })
    }
  }
}
