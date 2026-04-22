<template>
  <div class="flex flex-col gap-2 pt-2">
    <input
      type="range"
      min="1988"
      max="2023"
      step="1"
      :value="modelValue"
      @input="$emit('update:modelValue', +($event.target as HTMLInputElement).value)"
      class="w-full accent-blue-500"
    />
    <div class="flex justify-between text-xs text-zinc-400">
      <span>1988</span>
      <span class="font-semibold text-zinc-600 dark:text-zinc-300">{{ modelValue }}</span>
      <span>2023</span>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ modelValue: number }>()
defineEmits<{ (e: 'update:modelValue', v: number): void }>()
</script>
