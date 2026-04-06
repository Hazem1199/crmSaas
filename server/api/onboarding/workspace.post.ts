// POST /api/onboarding/workspace
// إنشاء أول مساحة عمل للمستخدم الحالي + عضوية owner (يتجاوز RLS عبر Service Role)
import { serverSupabaseClient } from '#supabase/server'

function slugifyAscii(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function normalizeSlugInput(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && slug.length >= 2 && slug.length <= 64
}

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const { data: { user }, error: authErr } = await client.auth.getUser()

  if (authErr || !user) {
    throw createError({ statusCode: 401, message: 'يجب تسجيل الدخول' })
  }

  const body = await readBody(event).catch(() => ({})) as { name?: string; slug?: string }

  const name = typeof body.name === 'string' ? body.name.trim() : ''
  if (!name) {
    throw createError({ statusCode: 400, message: 'اسم مساحة العمل مطلوب' })
  }

  const rawSlug = typeof body.slug === 'string' ? body.slug.trim() : ''
  let slug = normalizeSlugInput(rawSlug)
  if (!slug) {
    slug = slugifyAscii(name)
  }
  if (!isValidSlug(slug)) {
    slug = `ws-${user.id.replace(/-/g, '').slice(0, 12)}`
  }

  const svc = useServiceRoleClient()

  // workspace_members.user_id يشير إلى profiles(id) — إن لم يُنشَأ البروفايل (مثلاً بدون trigger) نُنشئه هنا
  const { data: existingProfile } = await svc
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle()

  if (!existingProfile) {
    const meta = user.user_metadata as { full_name?: string; avatar_url?: string } | undefined
    const { error: profileErr } = await svc.from('profiles').insert({
      id: user.id,
      full_name: meta?.full_name ?? user.email ?? null,
      avatar_url: meta?.avatar_url ?? null,
    })
    if (profileErr) {
      throw createError({ statusCode: 500, message: profileErr.message })
    }
  }

  const { data: existingMember } = await svc
    .from('workspace_members')
    .select('id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle()

  if (existingMember) {
    throw createError({
      statusCode: 409,
      message: 'أنت مرتبط بمساحة عمل بالفعل',
    })
  }

  const { data: ws, error: wsErr } = await svc
    .from('workspaces')
    .insert({ name, slug })
    .select('id, slug')
    .single()

  if (wsErr) {
    if (wsErr.code === '23505') {
      throw createError({
        statusCode: 409,
        message: 'هذا المعرّف (slug) مستخدم بالفعل، اختر معرّفاً آخر',
      })
    }
    throw createError({ statusCode: 500, message: wsErr.message })
  }

  if (!ws) {
    throw createError({ statusCode: 500, message: 'فشل إنشاء مساحة العمل' })
  }

  const { error: memErr } = await svc
    .from('workspace_members')
    .insert({
      workspace_id: ws.id,
      user_id: user.id,
      role: 'owner',
      is_active: true,
    })

  if (memErr) {
    await svc.from('workspaces').delete().eq('id', ws.id)
    throw createError({ statusCode: 500, message: memErr.message })
  }

  const { error: campErr } = await svc.from('campaigns').insert({
    workspace_id: ws.id,
    name: 'الحملة الرئيسية',
    description: 'حملة افتراضية عند إنشاء مساحة العمل — يمكنك تعديلها أو إضافة حملات.',
    is_active: true,
  })

  if (campErr) {
    await svc.from('workspace_members').delete().eq('workspace_id', ws.id)
    await svc.from('workspaces').delete().eq('id', ws.id)
    throw createError({ statusCode: 500, message: campErr.message })
  }

  return { slug: ws.slug }
})
