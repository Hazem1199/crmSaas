import { createClient } from '@supabase/supabase-js'

/**
 * Service Role Client - يتجاوز RLS للعمليات الخادمية الموثوقة
 */
export const useServiceRoleClient = () => {
  const config = useRuntimeConfig()

  return createClient(
    config.public.supabaseUrl as string,
    config.supabaseServiceKey as string,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}

/**
 * استخراج workspace_id من الـ slug
 */
export const getWorkspaceIdBySlug = async (slug: string): Promise<string> => {
  const supabase = useServiceRoleClient()

  const { data, error } = await supabase
    .from('workspaces')
    .select('id')
    .eq('slug', slug)
    .is('deleted_at', null)
    .single()

  if (error || !data) {
    throw createError({ statusCode: 404, message: `Workspace '${slug}' not found` })
  }

  return data.id
}
