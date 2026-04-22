<template>
  <div class="absolute inset-0 z-40 p-4 md:p-12 pointer-events-none flex justify-center items-center">
    <div class="w-full h-full max-w-[1400px] bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl pointer-events-auto flex flex-col border border-zinc-200 dark:border-zinc-700 overflow-hidden">

      <!-- Header -->
      <div class="flex items-center justify-between p-5 border-b border-zinc-100 dark:border-zinc-800 shrink-0">

        <!-- Breadcrumb + title -->
        <div class="flex items-center gap-1.5 min-w-0 overflow-hidden">
          <template v-for="(entry, i) in stack" :key="i">
            <button
              @click="jumpTo(i)"
              class="shrink-0 text-sm text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors truncate max-w-32.5"
            >{{ entry.label }}</button>
            <span class="shrink-0 text-zinc-300 dark:text-zinc-600 select-none">›</span>
          </template>
          <h1 class="text-xl font-bold text-zinc-800 dark:text-zinc-100 truncate">{{ title }}</h1>
        </div>

        <!-- Close -->
        <button
          @click="onClose"
          class="shrink-0 ml-4 p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-500"
        >
          <UIcon name="i-heroicons-x-mark" class="size-6" />
        </button>
      </div>

      <!-- Scrollable content -->
      <div class="flex-1 overflow-y-auto p-5">
        <slot />
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { useNavHistory } from '~/composables/useNavHistory'

defineProps<{ title: string }>()

const router = useRouter()
const { stack, jumpTo, clear } = useNavHistory()

function onClose() {
  clear()
  router.push('/')
}
</script>
