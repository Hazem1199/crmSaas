<template>
  <div class="space-y-0.5">
    <button
      v-if="collapsed"
      type="button"
      class="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg mx-2 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
      :title="item.label"
      @click="navigateToTeam"
    >
      <component :is="iconMap[item.icon]" class="w-5 h-5 shrink-0" />
    </button>

    <template v-else>
      <button
        type="button"
        class="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg mx-2 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors text-sm font-medium"
        @click="expanded = !expanded"
      >
        <component :is="iconMap[item.icon]" class="w-5 h-5 shrink-0" />
        <span class="flex-1 text-right truncate">{{ item.label }}</span>
        <svg
          class="w-4 h-4 shrink-0 transition-transform duration-150"
          :class="expanded ? 'rotate-180' : ''"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div v-show="expanded" class="mr-2 border-r border-gray-700/80 pr-2 space-y-0.5">
        <SidebarItem
          v-for="ch in visibleChildren"
          :key="ch.to"
          :item="ch"
          :collapsed="false"
        />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import {
  HomeIcon, UsersIcon, ChartBarIcon,
  DocumentTextIcon, Cog6ToothIcon,
  MegaphoneIcon, UserGroupIcon, LockClosedIcon,
} from '@heroicons/vue/24/outline'
import type { NavItem } from '~/types'

const props = defineProps<{
  item: NavItem & { children: NavItem[] }
  collapsed: boolean
}>()

const { can } = usePermissions()
const route = useRoute()
const workspaceSlug = computed(() => route.params.workspace as string)

const expanded = ref(
  route.path.includes(`/${workspaceSlug.value}/team`) || route.path.includes(`/${workspaceSlug.value}/roles`),
)

watch(
  () => route.path,
  (p) => {
    if (p.includes('/team') || p.includes('/roles'))
      expanded.value = true
  },
)

const visibleChildren = computed(() =>
  (props.item.children ?? []).filter((ch) => !ch.permission || can(ch.permission)),
)

const iconMap: Record<string, unknown> = {
  'home': HomeIcon,
  'users': UsersIcon,
  'chart-bar': ChartBarIcon,
  'document-text': DocumentTextIcon,
  'cog': Cog6ToothIcon,
  'megaphone': MegaphoneIcon,
  'user-group': UserGroupIcon,
  'lock': LockClosedIcon,
}

function navigateToTeam() {
  navigateTo(`/${workspaceSlug.value}/team`)
}
</script>
