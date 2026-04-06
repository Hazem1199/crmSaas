import type { Lead } from '~/types'

export const useLeads = () => {
  const route = useRoute()
  const workspaceSlug = computed(() => route.params.workspace as string)

  const leads = ref<Lead[]>([])
  const total = ref(0)
  const loading = ref(false)
  const page = ref(1)
  const pageSize = ref(20)

  interface LeadFilters {
    status_id?: string
    channel_id?: string
    campaign_id?: string
    assigned_to?: string
    search?: string
    date_from?: string
    date_to?: string
  }

  const fetchLeads = async (filters: LeadFilters = {}) => {
    loading.value = true
    try {
      const from = (page.value - 1) * pageSize.value
      const to = from + pageSize.value - 1

      const result = await $fetch<{ data: Lead[]; total: number }>(
        `/api/${workspaceSlug.value}/leads`,
        { query: { from, to, ...filters } }
      )

      leads.value = result.data ?? []
      total.value = result.total ?? 0
    } finally {
      loading.value = false
    }
  }

  const getLead = async (id: string): Promise<Lead | null> => {
    const result = await $fetch<{ data: Lead }>(
      `/api/${workspaceSlug.value}/leads/${id}`
    )
    return result.data ?? null
  }

  const createLead = async (payload: Partial<Lead>) => {
    return await $fetch<{ data: Lead }>(
      `/api/${workspaceSlug.value}/leads`,
      { method: 'POST', body: payload }
    )
  }

  const updateLead = async (id: string, payload: Partial<Lead>) => {
    return await $fetch<{ data: Lead }>(
      `/api/${workspaceSlug.value}/leads/${id}`,
      { method: 'PUT', body: payload }
    )
  }

  const softDeleteLead = async (id: string) => {
    return await $fetch(
      `/api/${workspaceSlug.value}/leads/${id}`,
      { method: 'DELETE' }
    )
  }

  const restoreLead = async (id: string) => {
    return await $fetch(
      `/api/${workspaceSlug.value}/leads/${id}/restore`,
      { method: 'PATCH' }
    )
  }

  return {
    leads,
    total,
    loading,
    page,
    pageSize,
    fetchLeads,
    getLead,
    createLead,
    updateLead,
    softDeleteLead,
    restoreLead,
  }
}
