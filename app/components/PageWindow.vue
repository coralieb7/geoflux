<template>
  <div class="absolute inset-0 z-40 p-5 md:p-10 pointer-events-none flex justify-center items-center">
    <div class="relative w-full h-full max-w-[1400px]">

      <!-- Phase 1: SVG border trace — only shown on first open (when !alreadyOpen) -->
      <svg
        v-if="!alreadyOpen"
        class="absolute inset-0 w-full h-full pointer-events-none"
        style="overflow: visible"
        aria-hidden="true"
      >
        <rect
          class="page-trace"
          x="1" y="1"
          width="99.8%" height="99.8%"
          rx="15" ry="15"
          fill="none"
          stroke="#2d6bb5"
          stroke-width="1.5"
          pathLength="1"
          stroke-dasharray="1"
          stroke-dashoffset="1"
        />
      </svg>

      <!-- Phase 2: Dark content box -->
      <Transition name="window-in">
        <div
          v-if="showWindow"
          class="absolute inset-0 bg-[#0d2545] rounded-2xl shadow-2xl pointer-events-auto flex flex-col border border-[#2d6bb5] overflow-hidden"
        >
          <!-- Header -->
          <div class="flex items-center justify-between px-4 py-2 border-b border-[#2d6bb5]/25 shrink-0">
            <div class="flex items-center gap-1 min-w-0 overflow-hidden">
              <template v-for="(entry, i) in stack" :key="i">
                <button
                  @click="jumpTo(i)"
                  class="shrink-0 text-xs text-[#93c5fd]/55 hover:text-[#93c5fd] transition-colors truncate max-w-28"
                >{{ entry.label }}</button>
                <span class="shrink-0 text-[#2d6bb5]/60 select-none text-xs">›</span>
              </template>
              <h1 class="text-sm font-semibold text-white/90 truncate">{{ title }}</h1>
            </div>
            <button
              @click="onClose"
              class="shrink-0 ml-3 p-1.5 rounded-full hover:bg-[#1a3a5c] transition-colors text-[#93c5fd]/70 hover:text-[#93c5fd]"
            >
              <UIcon name="i-heroicons-x-mark" class="size-5" />
            </button>
          </div>

          <!-- Content (no page-level scroll) -->
          <div class="flex-1 overflow-hidden p-3">
            <slot />
          </div>
        </div>
      </Transition>

    </div>
  </div>
</template>

<script setup lang="ts">
import { useNavHistory } from '~/composables/useNavHistory'

defineProps<{ title: string }>()

const router = useRouter()
const { stack, jumpTo, clear } = useNavHistory()

// Global flag: tracks whether a page window is currently open.
// Persists across route changes (navigating between pages), reset only on close.
const alreadyOpen = useState('pageWindowOpen', () => false)

// If the window was already open (e.g. navigating from country → imports),
// show content immediately with no animation.
const showWindow = ref(alreadyOpen.value)

onMounted(() => {
  if (alreadyOpen.value) {
    // Already transitioning between pages — skip animation
    showWindow.value = true
  } else {
    // First open from home — run the trace + fade-in sequence
    setTimeout(() => {
      showWindow.value = true
      alreadyOpen.value = true
    }, 950)
  }
})

// When leaving this page back to home, reset the flag so the next open animates
onBeforeRouteLeave((to) => {
  if (to.path === '/') {
    alreadyOpen.value = false
  }
})

function onClose() {
  alreadyOpen.value = false
  clear()
  router.push('/')
}
</script>

<style scoped>
/* Border trace: draws clockwise from top-left corner (only shown on first open) */
.page-trace {
  animation: trace-draw 0.9s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}
@keyframes trace-draw {
  from { stroke-dashoffset: 1; }
  to   { stroke-dashoffset: 0; }
}

/* Window fade + subtle scale-up */
.window-in-enter-active {
  transition: opacity 0.4s ease, transform 0.4s ease;
}
.window-in-enter-from {
  opacity: 0;
  transform: scale(0.985) translateY(6px);
}
</style>
