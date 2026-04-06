<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-xl font-bold text-gray-900">التقارير</h1>
        <p class="text-sm text-gray-500 mt-0.5">تحليل شامل لأداء المبيعات</p>
      </div>
    </div>

    <!-- Filters -->
    <div class="card p-4 mb-6">
      <div class="flex flex-wrap items-end gap-3">
        <div>
          <label class="block text-xs font-medium text-gray-500 mb-1">من تاريخ</label>
          <input v-model="filters.date_from" type="date" class="input-base text-sm w-40" />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-500 mb-1">إلى تاريخ</label>
          <input v-model="filters.date_to" type="date" class="input-base text-sm w-40" />
        </div>
        <BaseButton size="sm" :loading="loading" @click="loadReport">تطبيق</BaseButton>
        <BaseButton variant="secondary" size="sm" @click="clearFilters">إعادة تعيين</BaseButton>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <div class="card p-5 text-center">
        <p class="text-3xl font-black text-gray-900">{{ report?.total ?? 0 }}</p>
        <p class="text-sm text-gray-500 mt-1">إجمالي العملاء</p>
      </div>
    </div>

    <!-- Charts Placeholder -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="card p-5">
        <h3 class="font-semibold text-gray-900 mb-4">توزيع الحالات</h3>
        <div v-if="report" class="space-y-2">
          <div v-for="(count, statusId) in report.byStatus" :key="statusId" class="flex items-center gap-3">
            <div class="flex-1 bg-gray-100 rounded-full h-2">
              <div
                class="bg-primary-500 h-2 rounded-full"
                :style="{ width: `${(count / report.total) * 100}%` }"
              />
            </div>
            <span class="text-sm text-gray-600 w-8 text-left">{{ count }}</span>
          </div>
        </div>
      </div>
      <div class="card p-5">
        <h3 class="font-semibold text-gray-900 mb-4">توزيع القنوات</h3>
        <div v-if="report" class="space-y-2">
          <div v-for="(count, channelId) in report.byChannel" :key="channelId" class="flex items-center gap-3">
            <div class="flex-1 bg-gray-100 rounded-full h-2">
              <div
                class="bg-green-500 h-2 rounded-full"
                :style="{ width: `${(count / report.total) * 100}%` }"
              />
            </div>
            <span class="text-sm text-gray-600 w-8 text-left">{{ count }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default', middleware: ['auth', 'workspace'] })

const route = useRoute()
const workspaceSlug = computed(() => route.params.workspace as string)

const loading = ref(false)
const report = ref<{ total: number; byStatus: Record<string, number>; byChannel: Record<string, number> } | null>(null)

const filters = reactive({ date_from: '', date_to: '' })

const loadReport = async () => {
  loading.value = true
  try {
    report.value = await $fetch(`/api/${workspaceSlug.value}/reports`, { query: filters })
  } finally {
    loading.value = false
  }
}

const clearFilters = () => {
  filters.date_from = ''
  filters.date_to = ''
  loadReport()
}

onMounted(loadReport)
</script>
