<template>
  <div
    :class="[
      'rounded-xl flex flex-col transition-colors border border-[#2d6bb5]/20',
      compact ? 'p-2 gap-1' : 'p-3 gap-1.5',
      clickable ? 'bg-[#071828] cursor-pointer hover:bg-[#1a3a5c]' : 'bg-[#071828]',
    ]"
    @click="clickable ? toggle() : undefined"
  >
    <!-- Title row -->
    <div class="flex items-center justify-between">
      <h3 :class="['font-semibold text-[#93c5fd]/55 uppercase tracking-wide leading-none', compact ? 'text-[10px]' : 'text-xs']">{{ title }}</h3>
      <div class="flex items-center gap-1">
        <slot name="badge" />
        <UIcon
          v-if="expandable"
          :name="expanded ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="size-3.5 text-[#93c5fd]/55"
        />
      </div>
    </div>

    <!-- Primary value -->
    <div v-if="value" :class="['font-bold leading-tight', compact ? 'text-base' : 'text-xl', colorClass]">{{ value }}</div>

    <!-- Subtitle — clickable if subtitleClick is provided -->
    <component
      :is="subtitleClick ? 'button' : 'p'"
      v-if="subtitle"
      :class="['text-xs text-[#93c5fd]/50 leading-none text-left', subtitleClick ? 'hover:text-[#93c5fd] transition-colors' : '']"
      @click.stop="subtitleClick?.()"
    >{{ subtitle }}</component>

    <!-- Always-visible body -->
    <slot name="body" />

    <!-- Expanded content -->
    <Transition name="expand">
      <div v-if="expanded || !expandable">
        <slot />
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  title: string
  value?: string
  subtitle?: string
  subtitleClick?: () => void
  color?: 'blue' | 'orange' | 'green' | 'red' | 'default'
  expandable?: boolean
  clickable?: boolean
  compact?: boolean
}>()

const expanded = ref(false)
function toggle() {
  if (props.expandable) expanded.value = !expanded.value
}

const colorClass = computed(() => {
  switch (props.color) {
    case 'blue':   return 'text-blue-300'
    case 'orange': return 'text-orange-300'
    case 'green':  return 'text-green-400'
    case 'red':    return 'text-red-400'
    default:       return 'text-white/85'
  }
})
</script>

<style scoped>
.expand-enter-active,
.expand-leave-active {
  transition: max-height 0.25s ease, opacity 0.25s ease;
  max-height: 200px;
  overflow: hidden;
}
.expand-enter-from,
.expand-leave-to {
  max-height: 0;
  opacity: 0;
}
</style>
