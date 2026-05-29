<template>
  <Transition name="legend">
    <div
      v-if="visible"
      class="absolute bottom-6 left-6 z-20 flex flex-col gap-1.5 rounded-xl border border-[#2d6bb5]/35 bg-[#0d2545]/90 px-4 py-3 backdrop-blur-md pointer-events-none"
    >
      <div v-for="item in LEGEND_ITEMS" :key="item.label" class="flex items-center gap-2.5">
        <span class="h-2.5 w-2.5 rounded-full flex-shrink-0" :style="{ background: item.color }" />
        <span class="text-xs text-white/80">{{ item.label }}</span>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
defineProps<{ visible: boolean }>()

const LEGEND_ITEMS = [
  { color: '#f97316', label: 'Top 3 export destination' },
  { color: '#3b82f6', label: 'Top 3 import source' },
  { color: '#a855f7', label: 'Both' },
]
</script>

<style scoped>
.legend-enter-active,
.legend-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.legend-enter-from,
.legend-leave-to     { opacity: 0; transform: translateY(6px); }
</style>
