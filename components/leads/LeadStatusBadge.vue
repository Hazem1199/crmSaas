<template>
  <span
    :style="{ backgroundColor: color + '22', color: color, borderColor: color + '44' }"
    class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border"
  >
    <span class="w-1.5 h-1.5 rounded-full" :style="{ backgroundColor: color }" />
    {{ name }}
  </span>
</template>

<script setup lang="ts">
import type { Status } from '~/types'

const props = withDefaults(defineProps<{
  status?: Status | null
  name?: string
  color?: string
}>(), {
  color: '#6B7280',
})

const name = computed(() => props.status?.name ?? props.name ?? '—')
const color = computed(() => props.status?.color ?? props.color)
</script>
