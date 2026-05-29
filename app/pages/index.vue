<template>
  <div class="relative w-full h-full">

    <!-- Info overlay -->
    <Transition name="info-overlay">
      <div
        v-if="infoOpen"
        class="absolute inset-0 z-40 flex items-center justify-center pointer-events-auto"
      >
        <div
          class="absolute inset-0 bg-black/50 backdrop-blur-sm"
          @click="infoOpen = false"
        />
        <div class="relative bg-[#0d2545] border border-[#2d6bb5]/50 rounded-2xl shadow-2xl p-6 max-w-lg w-[90vw] text-sm text-white/80">
          <button
            @click="infoOpen = false"
            class="absolute top-3 right-3 p-1.5 rounded-full hover:bg-[#1a3a5c] transition-colors text-[#93c5fd]/70 hover:text-[#93c5fd]"
          >
            <UIcon name="i-heroicons-x-mark" class="size-5" />
          </button>
          <h2 class="text-base font-bold text-white mb-1">GeoFlux</h2>
          <p class="text-xs text-[#93c5fd]/55 uppercase tracking-wide mb-4">Global Trade Visualisation Dashboard</p>
          <div class="space-y-3 text-sm text-white/70 leading-relaxed">
            <p>
              GeoFlux is a data visualisation project exploring world trade flows from <strong class="text-white/90">1988 to 2016</strong> across 112 countries, 16 trade categories and hundreds of commodities.
            </p>
            <p>
              The globe shows import/export intensities per country as a choropleth. Toggle <em>Trade Flows</em> on the left panel to explore bilateral connections. Use the year slider to travel through time.
            </p>
            <p>
              Click any country to open its detail page: trade balance, top partners, evolution over time, and commodity breakdown. Use the search bar to jump directly to a country, category, commodity or year.
            </p>
            <p>
              The supply barometer (🟢 / 🟡 / 🔴) indicates how many countries export a given category or commodity, a measure of trade concentration and globalisation.
            </p>
          </div>
          <div class="mt-5 pt-4 border-t border-[#2d6bb5]/25 text-[11px] text-[#93c5fd]/40">
            EPFL project · Data: UN Comtrade
          </div>
        </div>
      </div>
    </Transition>

    <!-- Logo -->
    <div class="absolute top-5 left-5 z-30 pointer-events-none select-none">
      <span class="text-2xl font-bold tracking-tight leading-none">
        <span class="text-white">Geo</span><span :class="fluxColor" class="transition-colors duration-500">Flux</span>
      </span>
    </div>

    <div class="absolute top-5 left-1/2 transform -translate-x-1/2 flex items-start gap-2 z-30 pointer-events-auto">

      <!-- Home button -->
      <button
        @click="goHome"
        class="flex items-center justify-center w-11 h-11 rounded-xl border border-white/15 bg-white/10 backdrop-blur-sm text-white/75 hover:bg-white/20 hover:text-white transition-all shrink-0"
        title="Reset to home view"
      >
        <UIcon name="i-heroicons-home" class="size-5" />
      </button>

      <!-- Globe / Flat map toggle -->
      <button
        @click="mapFlat = !mapFlat"
        :class="[
          'flex items-center justify-center w-11 h-11 rounded-xl border backdrop-blur-sm transition-all shrink-0',
          mapFlat
            ? 'bg-blue-500/20 border-blue-400/40 text-blue-200 hover:bg-blue-500/30'
            : 'bg-white/10 border-white/15 text-white/75 hover:bg-white/20 hover:text-white'
        ]"
        :title="mapFlat ? 'Switch to globe view' : 'Switch to flat world map'"
      >
        <UIcon :name="mapFlat ? 'i-heroicons-globe-alt' : 'i-heroicons-map'" class="size-5" />
      </button>

      <SearchBar ref="searchBar" />

      <button @click="router.push('/global')"
        class="flex items-center justify-center px-4 h-11 rounded-xl border border-white/15 bg-white/10 backdrop-blur-sm text-white/75 font-medium hover:bg-white/20 hover:text-white transition-all whitespace-nowrap">
        <UIcon name="i-heroicons-chart-bar" class="size-5 mr-2" />
        Global Stats
      </button>

      <!-- About button -->
      <button
        @click="infoOpen = true"
        class="flex items-center justify-center w-11 h-11 rounded-xl border border-white/15 bg-white/10 backdrop-blur-sm text-white/75 hover:bg-white/20 hover:text-white transition-all shrink-0"
        title="About GeoFlux"
      >
        <UIcon name="i-heroicons-question-mark-circle" class="size-5" />
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
const { showImports, showExports, metric, selectedCategory, showFlows, selectedYear, flyToRequest, mapFlat } = useTradeState()

const searchBar = ref()
const infoOpen  = ref(false)

const fluxColor = computed(() => {
  if (showFlows.value || (showImports.value && showExports.value)) return 'text-purple-400'
  if (showExports.value) return 'text-orange-400'
  return 'text-blue-400'
})

function goHome() {
  showImports.value      = false
  showExports.value      = false
  metric.value           = 'usd'
  showFlows.value        = false
  selectedCategory.value = null
  selectedYear.value     = 2016
  mapFlat.value          = false
  flyToRequest.value     = { center: [7.44, 46.95], zoom: 3.5, stamp: Date.now() }
  router.push('/')
}

defineShortcuts({
  meta_k: () => searchBar.value?.focus()
})
</script>

<style scoped>
.info-overlay-enter-active,
.info-overlay-leave-active { transition: opacity 0.2s ease; }
.info-overlay-enter-from,
.info-overlay-leave-to     { opacity: 0; }
</style>