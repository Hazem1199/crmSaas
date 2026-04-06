<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <!-- الاسم الكامل -->
    <BaseInput
      v-model="form.full_name"
      label="الاسم الكامل"
      placeholder="أدخل الاسم الكامل"
      required
      :error="errors.full_name"
    />

    <!-- البريد الإلكتروني والهاتف -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <BaseInput
        v-model="form.email"
        label="البريد الإلكتروني"
        type="email"
        placeholder="example@email.com"
        :error="errors.email"
      />
      <BaseInput
        v-model="form.phone"
        label="رقم الهاتف"
        type="tel"
        placeholder="05xxxxxxxx"
        :error="errors.phone"
      />
    </div>

    <!-- الحالة والقناة -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">الحالة</label>
        <select v-model="form.status_id" class="input-base">
          <option value="">-- اختر حالة --</option>
          <option v-for="s in statuses" :key="s.id" :value="s.id">{{ s.name }}</option>
        </select>
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">قناة الجلب</label>
        <select v-model="form.channel_id" class="input-base">
          <option value="">-- اختر قناة --</option>
          <option v-for="c in channels" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
      </div>
    </div>

    <!-- الحملة والتصنيف -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">الحملة</label>
        <select v-model="form.campaign_id" class="input-base">
          <option value="">-- اختر حملة --</option>
          <option v-for="c in campaigns" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">المسؤول</label>
        <select v-model="form.assigned_to" class="input-base">
          <option value="">-- غير محدد --</option>
          <option v-for="m in members" :key="m.user_id" :value="m.user_id">
            {{ m.profile?.full_name ?? m.user_id }}
          </option>
        </select>
      </div>
    </div>

    <!-- الملاحظات -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">ملاحظات</label>
      <textarea
        v-model="form.notes"
        rows="3"
        placeholder="أضف ملاحظاتك هنا..."
        class="input-base resize-none"
      />
    </div>

    <!-- Actions -->
    <div class="flex items-center justify-end gap-3 pt-2">
      <BaseButton variant="secondary" type="button" @click="$emit('cancel')">
        إلغاء
      </BaseButton>
      <BaseButton type="submit" :loading="loading">
        {{ isEdit ? 'حفظ التغييرات' : 'إضافة العميل' }}
      </BaseButton>
    </div>
  </form>
</template>

<script setup lang="ts">
import type { Lead, Status, Channel, Campaign, WorkspaceMember } from '~/types'

const props = defineProps<{
  lead?: Lead | null
  statuses: Status[]
  channels: Channel[]
  campaigns: Campaign[]
  members: WorkspaceMember[]
  loading?: boolean
}>()

const emit = defineEmits<{
  submit: [data: Partial<Lead>]
  cancel: []
}>()

const isEdit = computed(() => !!props.lead?.id)

const form = reactive({
  full_name:   props.lead?.full_name ?? '',
  email:       props.lead?.email ?? '',
  phone:       props.lead?.phone ?? '',
  notes:       props.lead?.notes ?? '',
  status_id:   props.lead?.status_id ?? '',
  channel_id:  props.lead?.channel_id ?? '',
  campaign_id: props.lead?.campaign_id ?? '',
  assigned_to: props.lead?.assigned_to ?? '',
})

const errors = reactive<Record<string, string>>({})

const handleSubmit = () => {
  errors.full_name = ''
  if (!form.full_name.trim()) {
    errors.full_name = 'الاسم الكامل مطلوب'
    return
  }

  emit('submit', {
    ...form,
    status_id:   form.status_id || null,
    channel_id:  form.channel_id || null,
    campaign_id: form.campaign_id || null,
    assigned_to: form.assigned_to || null,
  })
}
</script>
