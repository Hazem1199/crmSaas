<template>
  <DataTable
    :columns="columns"
    :rows="leads"
    :loading="loading"
    :total="total"
    :current-page="currentPage"
    :page-size="pageSize"
    row-key="id"
    @search="$emit('search', $event)"
    @row-click="$emit('row-click', $event as Lead)"
    @page-change="$emit('page-change', $event)"
  >
    <template #actions>
      <slot name="actions" />
    </template>

    <!-- Table rows -->
    <template #default="{ row }">
      <td class="px-4 py-3">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
            <span class="text-sm font-semibold text-primary-700">
              {{ (row as Lead).full_name.charAt(0) }}
            </span>
          </div>
          <div>
            <p class="text-sm font-medium text-gray-900">{{ (row as Lead).full_name }}</p>
            <p v-if="(row as Lead).email" class="text-xs text-gray-400">{{ (row as Lead).email }}</p>
          </div>
        </div>
      </td>
      <td class="px-4 py-3 text-sm text-gray-600">{{ (row as Lead).phone ?? '—' }}</td>
      <td class="px-4 py-3">
        <LeadStatusBadge :status="(row as Lead).status" />
      </td>
      <td class="px-4 py-3 text-sm text-gray-500">
        {{ (row as Lead).channel?.name ?? '—' }}
      </td>
      <td class="px-4 py-3 text-sm text-gray-500">
        {{ (row as Lead).assigned_agent?.full_name ?? '—' }}
      </td>
      <td class="px-4 py-3 text-sm text-gray-400 whitespace-nowrap">
        {{ formatDate((row as Lead).created_at) }}
      </td>
      <td class="px-4 py-3" @click.stop>
        <slot name="row-actions" :row="row as Lead" />
      </td>
    </template>
  </DataTable>
</template>

<script setup lang="ts">
import type { Lead } from '~/types'

defineProps<{
  leads: Lead[]
  loading?: boolean
  total?: number
  currentPage?: number
  pageSize?: number
}>()

defineEmits<{
  search: [q: string]
  'row-click': [lead: Lead]
  'page-change': [page: number]
}>()

const columns = [
  { key: 'name',    label: 'العميل' },
  { key: 'phone',   label: 'الهاتف' },
  { key: 'status',  label: 'الحالة' },
  { key: 'channel', label: 'القناة' },
  { key: 'agent',   label: 'المسؤول' },
  { key: 'date',    label: 'تاريخ الإضافة' },
  { key: 'actions', label: '', class: 'w-16' },
]

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('ar-SA', { day: '2-digit', month: '2-digit', year: 'numeric' })
</script>
