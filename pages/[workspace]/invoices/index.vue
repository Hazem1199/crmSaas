<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-xl font-bold text-gray-900">الفواتير</h1>
      <BaseButton size="sm" @click="showModal = true">إضافة فاتورة</BaseButton>
    </div>

    <DataTable
      :columns="columns"
      :rows="invoices"
      :loading="loading"
      :total="total"
      :current-page="page"
      :page-size="20"
      row-key="id"
      @page-change="page = $event; load()"
    >
      <template #default="{ row }">
        <td class="px-4 py-3 text-sm text-gray-900">{{ (row as Invoice).lead?.full_name ?? '—' }}</td>
        <td class="px-4 py-3 text-sm font-semibold">{{ formatAmount((row as Invoice).total_amount) }}</td>
        <td class="px-4 py-3 text-sm text-green-600">{{ formatAmount((row as Invoice).paid_amount) }}</td>
        <td class="px-4 py-3 text-sm text-red-600">{{ formatAmount((row as Invoice).due_amount - (row as Invoice).paid_amount) }}</td>
        <td class="px-4 py-3">
          <span class="px-2 py-1 rounded-full text-xs font-semibold"
            :class="statusClass[(row as Invoice).status]">
            {{ statusLabel[(row as Invoice).status] }}
          </span>
        </td>
        <td class="px-4 py-3 text-sm text-gray-400">{{ (row as Invoice).due_date ?? '—' }}</td>
      </template>
    </DataTable>
  </div>
</template>

<script setup lang="ts">
import type { Invoice } from '~/types'

definePageMeta({ layout: 'default', middleware: ['auth', 'workspace'] })

const route = useRoute()
const workspaceSlug = computed(() => route.params.workspace as string)

const invoices = ref<Invoice[]>([])
const loading = ref(true)
const total = ref(0)
const page = ref(1)
const showModal = ref(false)

const columns = [
  { key: 'lead',     label: 'العميل' },
  { key: 'total',    label: 'الإجمالي' },
  { key: 'paid',     label: 'المدفوع' },
  { key: 'due',      label: 'المتبقي' },
  { key: 'status',   label: 'الحالة' },
  { key: 'due_date', label: 'تاريخ الاستحقاق' },
]

const statusLabel: Record<string, string> = {
  pending: 'معلّق', partial: 'جزئي', paid: 'مدفوع', overdue: 'متأخر',
}

const statusClass: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  partial: 'bg-blue-100 text-blue-700',
  paid:    'bg-green-100 text-green-700',
  overdue: 'bg-red-100 text-red-700',
}

const formatAmount = (n: number) =>
  new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR' }).format(n)

const load = async () => {
  loading.value = true
  try {
    // TODO: implement invoices API endpoint
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>
