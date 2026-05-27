<template>
  <div
    :class="[
      'rounded-xl p-3 flex flex-col gap-1.5 transition-colors',
      clickable ? 'bg-zinc-50 cursor-pointer hover:bg-zinc-100' : 'bg-zinc-50',
    ]"
    @click="clickable ? toggle() : undefined"
  >
    <!-- Title row -->
    <div class="flex items-center justify-between">
      <h3 class="text-xs font-semibold text-zinc-400 uppercase tracking-wide leading-none">{{ title }}</h3>
      <div class="flex items-center gap-1">
        <slot name="badge" />
        <UIcon
          v-if="expandable"
          :name="expanded ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="size-3.5 text-zinc-400"
        />
      </div>
    </div>

    <!-- Primary value -->
    <div v-if="value" :class="['text-xl font-bold leading-tight', colorClass]">{{ value }}</div>

    <!-- Subtitle -->
    <p v-if="subtitle" class="text-xs text-zinc-400 leading-none">{{ subtitle }}</p>

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
  color?: 'blue' | 'orange' | 'green' | 'red' | 'default'
  expandable?: boolean
  clickable?: boolean
}>()

const expanded = ref(false)
function toggle() {
  if (props.expandable) expanded.value = !expanded.value
}

const colorClass = computed(() => {
  switch (props.color) {
    case 'blue':   return 'text-blue-600'
    case 'orange': return 'text-orange-500'
    case 'green':  return 'text-green-600'
    case 'red':    return 'text-red-500'
    default:       return 'text-zinc-800'
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