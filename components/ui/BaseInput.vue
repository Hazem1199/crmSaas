<template>
  <div>
    <label v-if="label" :for="inputId" class="block text-sm font-medium text-gray-700 mb-1">
      {{ label }}
      <span v-if="required" class="text-red-500 mr-0.5">*</span>
    </label>

    <div class="relative">
      <div v-if="$slots.prefix" class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
        <slot name="prefix" />
      </div>

      <input
        :id="inputId"
        v-bind="$attrs"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :required="required"
        :class="[
          'input-base',
          $slots.prefix ? 'pr-10' : '',
          $slots.suffix ? 'pl-10' : '',
          error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : '',
        ]"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        @blur="$emit('blur', $event)"
      />

      <div v-if="$slots.suffix" class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
        <slot name="suffix" />
      </div>
    </div>

    <p v-if="error" class="mt-1 text-xs text-red-600">{{ error }}</p>
    <p v-else-if="hint" class="mt-1 text-xs text-gray-500">{{ hint }}</p>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'BaseInput', inheritAttrs: false })

const props = withDefaults(defineProps<{
  modelValue?: string | number | null
  label?: string
  type?: string
  placeholder?: string
  disabled?: boolean
  required?: boolean
  error?: string
  hint?: string
}>(), {
  type: 'text',
  disabled: false,
  required: false,
})

defineEmits<{
  'update:modelValue': [value: string]
  blur: [e: FocusEvent]
}>()

const inputId = `input-${Math.random().toString(36).slice(2, 9)}`
</script>
