// POST /api/[workspace]/roles — إنشاء دور مخصص
import { requireWorkspacePermission } from '../../../utils/workspace-request'

function slugifyRole(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48) || 'role'
}

export default defineEventHandler(async (event) => {
  const { workspaceId } = await requireWorkspacePermission(event, 'roles.manage')
  const body = await readBody(event).catch(() => ({})) as {
    name?: string
    permission_keys?: string[]
    is_default_invite_role?: boolean
    distribute_customers_to_role?: boolean
  }

  const name = typeof body.name === 'string' ? body.name.trim() : ''
  if (!name) {
    throw createError({ statusCode: 400, message: 'اسم الدور مطلوب' })
  }

  const svc = useServiceRoleClient()
  const base = slugifyRole(name)
  const slug = `${base}-${crypto.randomUUID().slice(0, 8)}`

  const { data: created, error } = await svc
    .from('workspace_roles')
    .insert({
      workspace_id: workspaceId,
      name,
      slug,
      is_owner_role: false,
      is_default_invite_role: !!body.is_default_invite_role,
      distribute_customers_to_role: !!body.distribute_customers_to_role,
    })
    .select('id')
    .single()

  if (error || !created) {
    throw createError({ statusCode: 500, message: error?.message ?? 'فشل إنشاء الدور' })
  }

  if (body.is_default_invite_role) {
    await svc
      .from('workspace_roles')
      .update({ is_default_invite_role: false })
      .eq('workspace_id', workspaceId)
      .neq('id', created.id)
  }

  if (Array.isArray(body.permission_keys) && body.permission_keys.length) {
    const keys = [...new Set(body.permission_keys.filter((k) => typeof k === 'string' && k))]
    const rows = keys.map((permission_key) => ({
      workspace_role_id: created.id,
      permission_key,
      granted: true,
    }))
    await svc.from('workspace_role_permissions').insert(rows)
  }

  return { data: { id: created.id, slug } }
})
