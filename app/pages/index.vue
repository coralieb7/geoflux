<template>
  <div class="relative w-full h-full">
    
    <div class="absolute top-5 left-1/2 transform -translate-x-1/2 flex items-start gap-2 z-30 pointer-events-auto">
      
      <div class="w-[80vw] md:w-96 transition-all duration-300">
        <UCommandPalette 
          v-model:query="searchQuery"
          :groups="filteredGroups" 
          placeholder="Search countries, categories, or years..." 
          @update:model-value="onSelect"
          :fuse="{ fuseOptions: { threshold: 0.3, keys: ['label'] } }"
          class="rounded-xl shadow-md bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm border border-zinc-300 dark:border-zinc-600 overflow-hidden"
        >
          <template #empty-state>
            <div v-if="searchQuery" class="flex items-center justify-center py-6 text-sm text-zinc-500 dark:text-zinc-400">
              No results found.
            </div>
          </template>
        </UCommandPalette>
      </div>

      <button @click="router.push('/global')"
        class="flex items-center justify-center px-4 h-[44px] rounded-xl shadow-sm border border-zinc-300 hover:border-zinc-500 dark:border-zinc-600 hover:dark:border-zinc-400 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm text-zinc-700 dark:text-zinc-200 font-medium transition-all whitespace-nowrap">
        <UIcon name="i-heroicons-chart-bar" class="size-5 mr-2" />
        Global Stats
      </button>
    </div>

    <div class="absolute left-5 top-1/2 transform -translate-y-1/2 flex flex-col gap-3 z-20 w-48 pointer-events-auto">
      <button @click="showImports = !showImports"
        :class="['px-4 py-2 rounded-lg shadow-sm border font-medium transition-all text-left flex justify-between items-center', showImports ? 'bg-blue-100 dark:bg-blue-900 border-blue-400 text-blue-800 dark:text-blue-100' : 'bg-white/90 dark:bg-zinc-900/90 border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 backdrop-blur-sm']">
        Imports
        <UIcon v-if="showImports" name="i-heroicons-check-circle" class="size-5" />
      </button>

      <button @click="showExports = !showExports"
        :class="['px-4 py-2 rounded-lg shadow-sm border font-medium transition-all text-left flex justify-between items-center', showExports ? 'bg-orange-100 dark:bg-orange-900 border-orange-400 text-orange-800 dark:text-orange-100' : 'bg-white/90 dark:bg-zinc-900/90 border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 backdrop-blur-sm']">
        Exports
        <UIcon v-if="showExports" name="i-heroicons-check-circle" class="size-5" />
      </button>

      <div class="flex rounded-lg shadow-sm border border-zinc-300 dark:border-zinc-600 overflow-hidden backdrop-blur-sm bg-white/90 dark:bg-zinc-900/90">
        <button @click="metric = 'usd'" :class="['flex-1 py-2 text-sm font-medium transition-all', metric === 'usd' ? 'bg-zinc-200 dark:bg-zinc-700 text-black dark:text-white' : 'text-zinc-500 dark:text-zinc-400']">
          USD
        </button>
        <button @click="metric = 'weight'" :class="['flex-1 py-2 text-sm font-medium transition-all border-l border-zinc-300 dark:border-zinc-600', metric === 'weight' ? 'bg-zinc-200 dark:bg-zinc-700 text-black dark:text-white' : 'text-zinc-500 dark:text-zinc-400']">
          Weight
        </button>
      </div>

      <USelectMenu v-model="selectedCategory" :options="CATEGORIES" placeholder="All Categories" 
        class="w-full shadow-sm backdrop-blur-sm bg-white/90 dark:bg-zinc-900/90 rounded-md"
        clear-search-on-close>
      </USelectMenu>

      <button @click="showFlows = !showFlows"
        :class="['px-4 py-2 rounded-lg shadow-sm border font-medium transition-all text-left mt-4 flex justify-between items-center', showFlows ? 'bg-purple-100 dark:bg-purple-900 border-purple-400 text-purple-800 dark:text-purple-100' : 'bg-white/90 dark:bg-zinc-900/90 border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 backdrop-blur-sm']">
        Trade Flows
        <UIcon name="i-heroicons-arrows-right-left" class="size-5" />
      </button>
    </div>

    <!-- <UModal v-model="open" class="w-[90%] md:w-[50%] h-auto rounded-xl pointer-events-auto" :overlay="true">
      <UCommandPalette 
        :groups="searchGroups" 
        placeholder="Search countries, categories, or years..." 
        @update:model-value="onSelect"
        :fuse="{ fuseOptions: { threshold: 0.3, keys: ['label'] } }"
      />
    </UModal> -->
  </div>
</template>

<script setup lang="ts">
import { SEARCH_ITEMS, CATEGORIES } from '~/utils/dummyData'

definePageMeta({ layout: 'canvas' })

const router = useRouter()
const { showImports, showExports, metric, selectedCategory, showFlows } = useTradeState()

const searchQuery = ref('') // Tracks what you type in the bar

// Define your groups as a static array first
const allGroups = [
  {
    id: 'countries',
    label: 'Countries',
    commands: SEARCH_ITEMS.filter(i => i.type === 'country').map(i => ({ id: i.path, label: i.label, path: i.path, icon: 'i-heroicons-globe-alt' }))
  },
  {
    id: 'categories',
    label: 'Categories',
    commands: SEARCH_ITEMS.filter(i => i.type === 'category').map(i => ({ id: i.path, label: i.label, path: i.path, icon: 'i-heroicons-tag' }))
  },
  {
    id: 'years',
    label: 'Years',
    commands: SEARCH_ITEMS.filter(i => i.type === 'year').map(i => ({ id: i.path, label: i.label, path: i.path, icon: 'i-heroicons-calendar' }))
  }
]

// Only show the list if the user has typed something
const filteredGroups = computed(() => {
  if (!searchQuery.value) return []
  return allGroups
})

// Handle what happens when an item is clicked/selected
const onSelect = (item: any) => {
  if (item && item.path) {
    router.push(item.path)
    searchQuery.value = '' // Clear the input field to collapse the menu
    
    // Unfocus the input so the mobile keyboard goes away
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
  }
}

// Keep the Cmd+K shortcut, but use it to focus our new merged input
defineShortcuts({
  meta_k: () => {
    const input = document.querySelector('input[placeholder="Search countries, categories, or years..."]') as HTMLInputElement
    if (input) input.focus()
  }
})
</script>