<template>
  <div class="card overflow-hidden">
    <!-- Header: search + actions -->
    <div v-if="$slots.actions || searchable" class="flex items-center justify-between gap-3 p-4 border-b border-gray-100">
      <div v-if="searchable" class="relative w-64">
        <svg class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="بحث..."
          class="input-base pr-10 text-sm"
          @input="$emit('search', searchQuery)"
        />
      </div>
      <div class="flex items-center gap-2 mr-auto">
        <slot name="actions" />
      </div>
    </div>

    <!-- Table -->
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-100">
        <thead class="bg-gray-50">
          <tr>
            <th
              v-for="col in columns"
              :key="col.key"
              class="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide"
              :class="col.class"
            >
              {{ col.label }}
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-100">
          <!-- Loading -->
          <tr v-if="loading">
            <td :colspan="columns.length" class="text-center py-12">
              <div class="inline-flex items-center gap-2 text-gray-400 text-sm">
                <svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                جاري التحميل...
              </div>
            </td>
          </tr>
          <!-- Empty -->
          <tr v-else-if="!rows.length">
            <td :colspan="columns.length" class="text-center py-12 text-gray-400 text-sm">
              {{ emptyText }}
            </td>
          </tr>
          <!-- Rows -->
          <tr
            v-else
            v-for="(row, i) in rows"
            :key="rowKey ? (row as Record<string, unknown>)[rowKey] as string : i"
            class="hover:bg-gray-50 transition-colors cursor-pointer"
            @click="$emit('row-click', row)"
          >
            <slot :row="row" :index="i" />
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="total > pageSize" class="flex items-center justify-between px-4 py-3 border-t border-gray-100">
      <p class="text-sm text-gray-500">
        عرض {{ from + 1 }} – {{ Math.min(from + pageSize, total) }} من {{ total }} نتيجة
      </p>
      <div class="flex items-center gap-1">
        <button
          class="btn-secondary px-3 py-1.5 text-sm"
          :disabled="currentPage <= 1"
          @click="$emit('page-change', currentPage - 1)"
        >السابق</button>
        <button
          class="btn-secondary px-3 py-1.5 text-sm"
          :disabled="from + pageSize >= total"
          @click="$emit('page-change', currentPage + 1)"
        >التالي</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'DataTable' })

interface Column { key: string; label: string; class?: string }

const props = withDefaults(defineProps<{
  columns: Column[]
  rows: unknown[]
  loading?: boolean
  total?: number
  currentPage?: number
  pageSize?: number
  rowKey?: string
  searchable?: boolean
  emptyText?: string
}>(), {
  loading: false,
  total: 0,
  currentPage: 1,
  pageSize: 20,
  searchable: true,
  emptyText: 'لا توجد بيانات',
})

defineEmits<{
  search: [q: string]
  'row-click': [row: unknown]
  'page-change': [page: number]
}>()

const searchQuery = ref('')
const from = computed(() => (props.currentPage - 1) * props.pageSize)
</script>
