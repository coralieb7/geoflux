<template>
  <div class="flex flex-col gap-1.5">
    <input
      type="range"
      :min="MIN_YEAR"
      :max="MAX_YEAR"
      step="1"
      :value="modelValue"
      @input="$emit('update:modelValue', +($event.target as HTMLInputElement).value)"
      class="w-full accent-[#3b82f6] h-1"
    />
    <div class="flex justify-between text-[10px] text-[#93c5fd]/50">
      <span>{{ MIN_YEAR }}</span>
      <span class="font-bold text-[#93c5fd]">{{ modelValue }}</span>
      <span>{{ MAX_YEAR }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { YEARS } from '~/utils/dummyData'

defineProps<{ modelValue: number }>()
defineEmits<{ (e: 'update:modelValue', v: number): void }>()

const MIN_YEAR = YEARS[0]
const MAX_YEAR = YEARS[YEARS.length - 1]
</script>
