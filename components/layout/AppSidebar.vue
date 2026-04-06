<template>
  <aside
    class="flex flex-col bg-gray-900 text-white shrink-0 transition-all duration-300 ease-in-out"
    :class="collapsed ? 'w-16' : 'w-64'"
  >
    <!-- Logo / Workspace Name -->
    <div class="flex items-center gap-3 px-4 h-16 border-b border-gray-700 overflow-hidden">
      <div class="flex items-center justify-center w-8 h-8 bg-primary-600 rounded-lg shrink-0">
        <span class="text-xs font-black text-white">CRM</span>
      </div>
      <Transition
        enter-active-class="transition duration-150"
        enter-from-class="opacity-0 -translate-x-2"
        enter-to-class="opacity-100 translate-x-0"
        leave-active-class="transition duration-100"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <span v-if="!collapsed" class="font-bold text-sm truncate leading-tight">
          {{ workspace?.name ?? 'CRM SaaS' }}
        </span>
      </Transition>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 py-3 overflow-y-auto overflow-x-hidden space-y-0.5">
      <template v-for="item in filteredNavItems" :key="item.to">
        <SidebarItem :item="item" :collapsed="collapsed" />
      </template>

      <!-- Divider before Settings -->
      <div class="mx-4 my-2 border-t border-gray-700" />

      <SidebarItem
        v-if="can('manage_settings')"
        :item="settingsItem"
        :collapsed="collapsed"
      />
    </nav>

    <!-- User Profile -->
    <div class="border-t border-gray-700 p-3">
      <div class="flex items-center gap-3 overflow-hidden">
        <img
          :src="authStore.profile?.avatar_url ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(authStore.profile?.full_name ?? 'U')}&background=0ea5e9&color=fff`"
          :alt="authStore.profile?.full_name ?? ''"
          class="w-9 h-9 rounded-full object-cover shrink-0 border-2 border-gray-600"
        />
        <Transition
          enter-active-class="transition duration-150"
          enter-from-class="opacity-0"
          enter-to-class="opacity-100"
        >
          <div v-if="!collapsed" class="flex-1 min-w-0">
            <p class="text-sm font-medium text-white truncate">
              {{ authStore.profile?.full_name ?? 'المستخدم' }}
            </p>
            <p class="text-xs text-gray-400 truncate">{{ roleLabel }}</p>
          </div>
        </Transition>
        <button
          v-if="!collapsed"
          class="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 transition-colors shrink-0"
          title="تسجيل الخروج"
          @click="authStore.signOut()"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import type { NavItem } from '~/types'

defineProps<{ collapsed: boolean }>()

const { workspace, myRole } = useWorkspace()
const { can } = usePermissions()
const authStore = useAuthStore()

const mainNavItems: NavItem[] = [
  { label: 'لوحة التحكم',       icon: 'home',          to: 'dashboard',  permission: null },
  { label: 'العملاء المحتملون', icon: 'users',          to: 'leads',      permission: null },
  { label: 'الحملات الإعلانية', icon: 'megaphone',    to: 'campaigns',  permission: null },
  { label: 'التقارير',          icon: 'chart-bar',      to: 'reports',    permission: 'view_reports' },
  { label: 'الفواتير',          icon: 'document-text',  to: 'invoices',   permission: 'view_invoices' },
]

const settingsItem: NavItem = {
  label: 'الإعدادات', icon: 'cog', to: 'settings', permission: 'manage_settings',
}

const filteredNavItems = computed(() =>
  mainNavItems.filter(item => can(item.permission))
)

const roleLabels: Record<string, string> = {
  owner:                'مالك',
  admin:                'مدير',
  agent:                'وكيل مبيعات',
  reservation_manager:  'مدير حجوزات',
}

const roleLabel = computed(() =>
  myRole.value ? (roleLabels[myRole.value] ?? myRole.value) : ''
)
</script>
