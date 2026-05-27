<template>
  <div class="relative w-full h-full">
    
    <div class="absolute top-5 left-1/2 transform -translate-x-1/2 flex items-start gap-2 z-30 pointer-events-auto">
      
      <SearchBar ref="searchBar" />

      <button @click="router.push('/global')"
        class="flex items-center justify-center px-4 h-[44px] rounded-xl border border-white/15 bg-white/10 backdrop-blur-sm text-white/75 font-medium hover:bg-white/20 hover:text-white transition-all whitespace-nowrap">
        <UIcon name="i-heroicons-chart-bar" class="size-5 mr-2" />
        Global Stats
      </button>
    </div>

    <div class="absolute left-5 top-1/2 transform -translate-y-1/2 flex flex-col gap-3 z-20 w-48 pointer-events-auto">
      <button @click="showImports = !showImports"
        :class="['px-4 py-2 rounded-lg border font-medium transition-all text-left flex justify-between items-center',
          showImports
            ? 'bg-blue-500/20 border-blue-400/40 text-blue-200'
            : 'bg-white/10 border-white/15 text-white/60 hover:bg-white/20 hover:text-white/85']">
        Imports
        <UIcon v-if="showImports" name="i-heroicons-check-circle" class="size-5" />
      </button>

      <button @click="showExports = !showExports"
        :class="['px-4 py-2 rounded-lg border font-medium transition-all text-left flex justify-between items-center',
          showExports
            ? 'bg-orange-500/20 border-orange-400/40 text-orange-200'
            : 'bg-white/10 border-white/15 text-white/60 hover:bg-white/20 hover:text-white/85']">
        Exports
        <UIcon v-if="showExports" name="i-heroicons-check-circle" class="size-5" />
      </button>

      <div class="flex rounded-lg border border-white/15 overflow-hidden bg-white/10">
        <button @click="metric = 'usd'"
          :class="['flex-1 py-2 text-sm font-medium transition-all',
            metric === 'usd' ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white/75']">
          USD
        </button>
        <button @click="metric = 'weight'"
          :class="['flex-1 py-2 text-sm font-medium transition-all border-l border-white/15',
            metric === 'weight' ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white/75']">
          Weight
        </button>
      </div>

      <div class="relative w-full">
        <UIcon
          name="i-heroicons-magnifying-glass"
          class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/40 pointer-events-none z-10"
        />
        <USelectMenu
          v-model="selectedCategory"
          :items="CATEGORIES"
          placeholder="Search categories..."
          class="w-full bg-white/10 rounded-xl border border-white/15 pl-8"
        />
        <button
          v-if="selectedCategory"
          @click="selectedCategory = null"
          class="absolute right-8 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 z-10 transition-colors"
        >
          <UIcon name="i-heroicons-x-mark" class="size-4" />
        </button>
      </div>

      <button @click="showFlows = !showFlows"
        :class="['px-4 py-2 rounded-lg border font-medium transition-all text-left mt-4 flex justify-between items-center',
          showFlows
            ? 'bg-purple-500/20 border-purple-400/40 text-purple-200'
            : 'bg-white/10 border-white/15 text-white/60 hover:bg-white/20 hover:text-white/85']">
        Trade Flows
        <UIcon name="i-heroicons-arrows-right-left" class="size-5" />
      </button>

      <!-- Year selector -->
      <div class="mt-4 bg-white/10 rounded-lg border border-white/15 px-3 pt-2 pb-3">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-medium text-white/55 uppercase tracking-wide">Year</span>
          <span class="text-sm font-bold text-white/85">{{ selectedYear }}</span>
        </div>
        <input
          type="range"
          :min="YEARS[0]"
          :max="YEARS.at(-1)"
          step="1"
          v-model.number="selectedYear"
          class="w-full accent-blue-400 h-1 cursor-pointer"
        />
        <div class="flex justify-between mt-1">
          <span class="text-[10px] text-white/30">{{ YEARS[0] }}</span>
          <span class="text-[10px] text-white/30">{{ YEARS.at(-1) }}</span>
        </div>
      </div>
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
import { CATEGORIES, YEARS } from '~/utils/dummyData'

definePageMeta({ layout: 'canvas' })

const router = useRouter()
const { showImports, showExports, metric, selectedCategory, showFlows, selectedYear } = useTradeState()

const searchBar = ref()

defineShortcuts({
  meta_k: () => searchBar.value?.focus()
})
</script>