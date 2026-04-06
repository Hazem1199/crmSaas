<template>
  <div
    class="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 flex items-center justify-center p-4"
    dir="rtl"
  >
    <div class="w-full max-w-md">
      <!-- Logo -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-lg mb-4">
          <span class="text-2xl font-black text-primary-700">CRM</span>
        </div>
        <h1 class="text-2xl font-bold text-white">نظام إدارة العملاء</h1>
        <p class="text-primary-200 text-sm mt-1">SaaS CRM Platform</p>
      </div>

      <!-- Card -->
      <div class="bg-white rounded-2xl shadow-2xl p-8">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'AuthLayout' })
</script>
