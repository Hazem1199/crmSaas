<template>
  <NuxtLink
    :to="`/${workspaceSlug}/${item.to}`"
    class="flex items-center gap-3 px-3 py-2.5 rounded-lg mx-2 transition-all duration-150 group"
    :class="[
      isActive
        ? 'bg-primary-600 text-white shadow-sm'
        : 'text-gray-300 hover:bg-gray-800 hover:text-white',
    ]"
    :title="collapsed ? item.label : undefined"
  >
    <!-- Icon -->
    <component :is="iconMap[item.icon]" class="w-5 h-5 shrink-0" />

    <!-- Label (hidden when collapsed) -->
    <span v-if="!collapsed" class="text-sm font-medium truncate">{{ item.label }}</span>

    <!-- Badge (e.g., notification count) -->
    <span
      v-if="!collapsed && item.badge"
      class="mr-auto text-xs font-semibold bg-primary-500 text-white rounded-full px-1.5 py-0.5"
    >
      {{ item.badge }}
    </span>
  </NuxtLink>
</template>

<script setup lang="ts">
import {
  HomeIcon, UsersIcon, ChartBarIcon,
  DocumentTextIcon, Cog6ToothIcon, TrashIcon,
  BellIcon, BuildingOffice2Icon, MegaphoneIcon,
} from '@heroicons/vue/24/outline'
import type { NavItem } from '~/types'

const props = defineProps<{
  item: NavItem
  collapsed: boolean
}>()

const route = useRoute()
const workspaceSlug = computed(() => route.params.workspace as string)

const isActive = computed(() =>
  route.path.includes(`/${workspaceSlug.value}/${props.item.to}`)
)

const iconMap: Record<string, unknown> = {
  'home': HomeIcon,
  'users': UsersIcon,
  'chart-bar': ChartBarIcon,
  'document-text': DocumentTextIcon,
  'cog': Cog6ToothIcon,
  'trash': TrashIcon,
  'bell': BellIcon,
  'building': BuildingOffice2Icon,
  'megaphone': MegaphoneIcon,
}
</script>
