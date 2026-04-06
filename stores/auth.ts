import { defineStore } from 'pinia'
import type { Profile } from '~/types'

export const useAuthStore = defineStore('auth', () => {
  const user = useSupabaseUser()
  const supabase = useSupabaseClient()

  const profile = ref<Profile | null>(null)
  const loading = ref(false)

  const fetchProfile = async () => {
    if (!user.value) return
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.value.id)
        .single()

      if (!error && data) {
        profile.value = data as Profile
      }
    } finally {
      loading.value = false
    }
  }

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user.value) return
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.value.id)
      .select()
      .single()

    if (!error && data) {
      profile.value = data as Profile
    }
    return { error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    profile.value = null
    await navigateTo('/auth/login')
  }

  // Auto-fetch profile when user changes
  watch(user, (newUser) => {
    if (newUser) fetchProfile()
    else profile.value = null
  }, { immediate: true })

  return {
    user,
    profile,
    loading,
    fetchProfile,
    updateProfile,
    signOut,
  }
})
