<template>
  <PageWindow :title="category">
    <div class="relative flex flex-col gap-2 h-full">

      <!-- Full-screen evolution overlay -->
      <Transition name="overlay-in">
        <div
          v-if="evoFullScreen"
          class="absolute inset-0 z-20 bg-[#0d2545] border border-[#2d6bb5]/30 rounded-xl flex flex-col"
        >
          <div class="flex items-center justify-between px-3 py-2 border-b border-[#2d6bb5]/25 shrink-0">
            <h3 class="text-xs font-semibold text-[#93c5fd]/70 uppercase tracking-wide">
              Evolution Over Time — {{ category }}
            </h3>
            <button
              @click="evoFullScreen = false"
              class="p-1.5 rounded-full hover:bg-[#1a3a5c] transition-colors text-[#93c5fd]/70 hover:text-[#93c5fd]"
              title="Collapse"
            >
              <UIcon name="i-heroicons-arrows-pointing-in" class="size-4" />
            </button>
          </div>
          <div class="flex-1 min-h-0 p-3">
            <D3BarChartRace :series="evolutionSeries" :format-value="formatUsd" />
          </div>
        </div>
      </Transition>

      <!-- Full-screen commodity pie overlay -->
      <Transition name="overlay-in">
        <div
          v-if="pieFullScreen"
          class="absolute inset-0 z-20 bg-[#0d2545] border border-[#2d6bb5]/30 rounded-xl flex flex-col"
        >
          <div class="flex items-center justify-between px-3 py-2 border-b border-[#2d6bb5]/25 shrink-0">
            <div class="flex items-center gap-3 min-w-0 flex-1">
              <h3 class="text-xs font-semibold text-[#93c5fd]/70 uppercase tracking-wide shrink-0">
                Commodities — {{ category }}
              </h3>
              <div class="flex gap-0.5 shrink-0">
                <button
                  v-for="opt in PIE_MODE_OPTS"
                  :key="opt.key"
                  @click="commodityMode = opt.key"
                  :class="commodityMode === opt.key
                    ? 'bg-[#2d6bb5] text-white'
                    : 'bg-[#071828] text-[#93c5fd]/60 hover:bg-[#1a3a5c] border border-[#2d6bb5]/30'"
                  class="text-[10px] px-2 py-0.5 rounded transition-colors font-medium"
                >{{ opt.label }}</button>
              </div>
              <div class="flex items-center gap-2 flex-1 min-w-0">
                <span class="text-[10px] text-[#93c5fd]/50 shrink-0">Year</span>
                <input
                  type="range"
                  :min="YEARS[0]"
                  :max="YEARS.at(-1)"
                  step="1"
                  v-model.number="selectedYear"
                  class="flex-1 min-w-0 accent-[#3b82f6] h-1"
                />
                <button
                  @click="nav.push(`/years/${selectedYear}`, category)"
                  class="text-[10px] font-bold text-[#93c5fd] w-8 text-right shrink-0 hover:text-white transition-colors"
                >{{ selectedYear }}</button>
              </div>
            </div>
            <button
              @click="pieFullScreen = false"
              class="shrink-0 ml-2 p-1.5 rounded-full hover:bg-[#1a3a5c] transition-colors text-[#93c5fd]/70 hover:text-[#93c5fd]"
              title="Collapse"
            >
              <UIcon name="i-heroicons-arrows-pointing-in" class="size-4" />
            </button>
          </div>
          <div class="flex-1 min-h-0 p-3">
            <D3PieChart :slices="commodityPieSlices" :format-value="formatUsd" :on-slice-click="onCommodityClick" />
          </div>
        </div>
      </Transition>

      <!-- Global year selector -->
      <div class="flex items-center gap-3 shrink-0 px-1">
        <span class="text-xs font-medium text-[#93c5fd]/55 shrink-0">Year</span>
        <input
          type="range"
          :min="YEARS[0]"
          :max="YEARS.at(-1)"
          step="1"
          v-model.number="selectedYear"
          class="flex-1 accent-[#3b82f6] h-1"
        />
        <button
          @click="nav.push(`/years/${selectedYear}`, category)"
          class="text-xs font-semibold text-[#93c5fd]/60 hover:text-[#93c5fd] w-9 text-right shrink-0 transition-colors"
          title="Open year page"
        >{{ selectedYear }}</button>
      </div>

      <!-- Row 1: 5 stat cards -->
      <div class="grid grid-cols-5 gap-2 shrink-0">

        <StatCard
          title="Trade Value (USD)"
          :value="formatUsd(selectedYearData.imports.usd + selectedYearData.exports.usd)"
          :subtitle="`Year ${selectedYear}`"
          :subtitle-click="() => nav.push(`/years/${selectedYear}`, category)"
        />

        <StatCard
          title="Trade Volume"
          :value="formatWeight(selectedYearData.imports.weight + selectedYearData.exports.weight)"
          :subtitle="`Year ${selectedYear}`"
          :subtitle-click="() => nav.push(`/years/${selectedYear}`, category)"
        />

        <StatCard
          title="10-Year Trend"
          :value="(compareData.imports.usd + compareData.exports.usd) === 0 ? 'N/A' : formatGrowth(trendGrowth)"
          :color="(compareData.imports.usd + compareData.exports.usd) === 0 ? 'default' : (trendGrowth >= 0 ? 'green' : 'red')"
          :subtitle="`vs ${actualCompareYear}`"
          :subtitle-click="() => nav.push(`/years/${actualCompareYear}`, category)"
        />

        <StatCard
          title="Share of World Trade"
          :value="formatPercent(worldShare)"
          :subtitle="`Year ${selectedYear}`"
          :subtitle-click="() => nav.push(`/years/${selectedYear}`, category)"
        />

        <!-- Supply Barometer -->
        <div class="bg-[#071828] rounded-xl p-3 flex flex-col gap-1.5 border border-[#2d6bb5]/20">
          <h3 class="text-xs font-semibold text-[#93c5fd]/55 uppercase tracking-wide leading-none">Supply Barometer</h3>
          <!-- Fill bar -->
          <div class="h-1.5 rounded-full bg-[#1a3a5c] overflow-hidden mt-0.5">
            <div
              class="h-full rounded-full transition-all duration-500"
              :class="barometerBarColor"
              :style="{ width: `${barometerPct}%` }"
            />
          </div>
          <!-- Count + label -->
          <div class="flex items-end gap-1.5 mt-0.5">
            <span class="text-xl font-bold leading-none" :class="barometerValueColor">{{ supplierCount }}</span>
            <span class="text-xs text-[#93c5fd]/45 pb-px">/ {{ TOTAL_COUNTRIES }} countries</span>
          </div>
          <p class="text-[10px] leading-none" :class="barometerValueColor">{{ barometerLabel }}</p>
        </div>

      </div>

      <!-- Row 2: stacked bars (narrow) | pie (medium) | evolution (wide) -->
      <div class="grid grid-cols-[3fr_4fr_6fr] gap-2 flex-1 min-h-0">

        <!-- Col 1: top importers + exporters stacked -->
        <div class="flex flex-col gap-2 min-h-0">
          <div class="flex-1 min-h-0 bg-[#071828] rounded-xl p-3 flex flex-col border border-[#2d6bb5]/20">
            <h3 class="text-xs font-semibold text-[#93c5fd]/55 uppercase tracking-wide mb-2 shrink-0">Top Importers</h3>
            <div class="flex-1 min-h-0">
              <D3BarChart
                :data="topImportersBar"
                :format-value="formatUsd"
                :on-bar-click="d => { const iso = isoFromName(d.label); if (iso) nav.push(`/countries/${iso}`, category) }"
              />
            </div>
          </div>
          <div class="flex-1 min-h-0 bg-[#071828] rounded-xl p-3 flex flex-col border border-[#2d6bb5]/20">
            <h3 class="text-xs font-semibold text-[#93c5fd]/55 uppercase tracking-wide mb-2 shrink-0">Top Exporters</h3>
            <div class="flex-1 min-h-0">
              <D3BarChart
                :data="topExportersBar"
                :format-value="formatUsd"
                :on-bar-click="d => { const iso = isoFromName(d.label); if (iso) nav.push(`/countries/${iso}`, category) }"
              />
            </div>
          </div>
        </div>

        <!-- Col 2: commodity breakdown pie (expandable) -->
        <div class="bg-[#071828] rounded-xl p-3 flex flex-col border border-[#2d6bb5]/20">
          <div class="flex items-center justify-between shrink-0 mb-2">
            <h3 class="text-xs font-semibold text-[#93c5fd]/55 uppercase tracking-wide">Commodities</h3>
            <div class="flex items-center gap-1">
              <div class="flex gap-0.5">
                <button
                  v-for="opt in PIE_MODE_OPTS"
                  :key="opt.key"
                  @click="commodityMode = opt.key"
                  :class="commodityMode === opt.key
                    ? 'bg-[#2d6bb5] text-white'
                    : 'bg-[#0d2545] text-[#93c5fd]/55 hover:bg-[#1a3a5c] border border-[#2d6bb5]/25'"
                  class="text-[9px] px-1.5 py-0.5 rounded transition-colors font-medium leading-none"
                >{{ opt.label }}</button>
              </div>
              <button
                @click="pieFullScreen = true"
                class="p-1 rounded hover:bg-[#1a3a5c] transition-colors text-[#93c5fd]/70 hover:text-[#93c5fd]"
                title="Expand"
              >
                <UIcon name="i-heroicons-arrows-pointing-out" class="size-3.5" />
              </button>
            </div>
          </div>
          <div class="flex-1 min-h-0">
            <D3PieChart :slices="commodityPieSlices" :format-value="formatUsd" :on-slice-click="onCommodityClick" />
          </div>
        </div>

        <!-- Col 3: evolution (expandable, with controls) -->
        <div class="bg-[#071828] rounded-xl p-3 flex flex-col border border-[#2d6bb5]/20">
          <div class="flex items-center justify-between shrink-0 mb-2">
            <h3 class="text-xs font-semibold text-[#93c5fd]/55 uppercase tracking-wide">Evolution Over Time</h3>
            <button
              @click="evoFullScreen = true"
              class="p-1 rounded hover:bg-[#1a3a5c] transition-colors text-[#93c5fd]/70 hover:text-[#93c5fd]"
              title="Expand"
            >
              <UIcon name="i-heroicons-arrows-pointing-out" class="size-3.5" />
            </button>
          </div>
          <div class="flex-1 min-h-0">
            <D3BarChartRace :series="evolutionSeries" :format-value="formatUsd" :auto-play="true" :hide-year-scrubber="true" />
          </div>
        </div>

      </div>

    </div>
  </PageWindow>
</template>

<script setup lang="ts">
import { TRADE_DATA, CATEGORIES, YEARS, countCategoryExporters, getBarometerLevel } from '~/utils/dummyData'
import { getCategoryYearlySeries, getCommoditiesByCategory } from '~/utils/tradeExtended'
import { formatUsd, formatWeight, formatGrowth, formatPercent, slugToCategory } from '~/utils/formatters'
import { useNavHistory } from '~/composables/useNavHistory'
import type { PieSlice } from '~/components/d3/PieChart.vue'

definePageMeta({ layout: 'canvas' })

const route = useRoute()
const nav   = useNavHistory()

const slug     = computed(() => route.params.slug as string)
const category = computed(() => slugToCategory(slug.value, CATEGORIES) ?? slug.value)

if (!slugToCategory(slug.value, CATEGORIES)) await navigateTo('/')

const commodities      = computed(() => getCommoditiesByCategory(category.value))
const series           = computed(() => getCategoryYearlySeries(category.value))
const selectedYear     = ref(YEARS.at(-1) ?? 2016)
const selectedYearData = computed(() => series.value.find(p => p.year === selectedYear.value) ?? series.value.at(-1)!)

// 10-Year Trend
const targetCompareYear = computed(() => Math.max(YEARS[0] ?? 1988, selectedYear.value - 10))
const compareData = computed(() => {
  const past = series.value.filter(p => p.year <= targetCompareYear.value)
  return past.length ? past.at(-1)! : series.value.at(0)!
})
const actualCompareYear = computed(() => compareData.value.year)

const trendGrowth = computed(() => {
  const base    = compareData.value.imports.usd + compareData.value.exports.usd
  const current = selectedYearData.value.imports.usd + selectedYearData.value.exports.usd
  return base === 0 ? 0 : ((current - base) / base) * 100
})

const worldShare = computed(() => {
  const worldTotal = TRADE_DATA.reduce((s, c) => s + c.imports.usd + c.exports.usd, 0)
  const catTotal   = selectedYearData.value.imports.usd + selectedYearData.value.exports.usd
  return worldTotal === 0 ? 0 : (catTotal / worldTotal) * 100
})

// ── Supply barometer ───────────────────────────────────────────────────────

const TOTAL_COUNTRIES   = TRADE_DATA.length
const supplierCount     = computed(() => countCategoryExporters(category.value))
const barometerPct      = computed(() => (supplierCount.value / TOTAL_COUNTRIES) * 100)
const barometerLevel    = computed(() => getBarometerLevel(supplierCount.value))
const barometerBarColor = computed(() => ({
  'bg-emerald-500': barometerLevel.value === 'high',
  'bg-amber-400':   barometerLevel.value === 'medium',
  'bg-red-500':     barometerLevel.value === 'low',
}))
const barometerValueColor = computed(() => ({
  'text-emerald-400': barometerLevel.value === 'high',
  'text-amber-400':   barometerLevel.value === 'medium',
  'text-red-400':     barometerLevel.value === 'low',
}))
const barometerLabel = computed(() =>
  barometerLevel.value === 'high'   ? 'Globally supplied'
  : barometerLevel.value === 'medium' ? 'Moderately supplied'
  : 'Supply concentrated'
)

// ── Overlay state ──────────────────────────────────────────────────────────

const evoFullScreen = ref(false)
const pieFullScreen = ref(false)

// ── Commodity pie mode ─────────────────────────────────────────────────────

type PieMode = 'imports' | 'exports' | 'both'
const commodityMode = ref<PieMode>('both')

const PIE_MODE_OPTS: { key: PieMode; label: string }[] = [
  { key: 'both',    label: 'Both'  },
  { key: 'imports', label: 'Imp.'  },
  { key: 'exports', label: 'Exp.'  },
]

const PIE_PALETTE = [
  '#3b82f6','#f97316','#22c55e','#a855f7','#eab308',
  '#06b6d4','#ec4899','#f43f5e','#10b981','#8b5cf6',
  '#f59e0b','#6366f1',
]

const commodityPieSlices = computed<PieSlice[]>(() => {
  const sorted = [...commodities.value]
    .map(c => {
      const yr = c.series.find(s => s.year === selectedYear.value) ?? c.series.at(-1)
      return {
        id: c.id, label: c.name,
        value: commodityMode.value === 'imports' ? (yr?.imports.usd ?? 0)
             : commodityMode.value === 'exports' ? (yr?.exports.usd ?? 0)
             : (yr?.imports.usd ?? 0) + (yr?.exports.usd ?? 0),
      }
    })
    .filter(c => c.value > 0)
    .sort((a, b) => b.value - a.value)

  const top = sorted.slice(0, 11).map((s, i) => ({ ...s, color: PIE_PALETTE[i % PIE_PALETTE.length] }))

  if (sorted.length <= 11) return top

  const otherValue = sorted.slice(11).reduce((sum, s) => sum + s.value, 0)
  return [...top, { id: '__other__', label: 'Other', value: otherValue, color: '#9ca3af' }]
})

function onCommodityClick(slice: PieSlice) {
  if (slice.id === '__other__') return
  pieFullScreen.value = false
  nav.push(`/commodities/${slice.id}`, category.value)
}

// ── Bar charts + evolution ─────────────────────────────────────────────────

// Estimate year-specific category value by scaling each country's 2016 byCategory
// value by the ratio of their year-specific total to their 2016 total.
const topImporters = computed(() =>
  [...TRADE_DATA]
    .map(c => {
      const cat2016 = c.byCategory[category.value]?.imports.usd ?? 0
      if (cat2016 === 0) return { name: c.name, iso3: c.iso3, usd: 0 }
      const ref = c.series.at(-1)?.imports.usd ?? 0
      const yr  = c.series.find(s => s.year === selectedYear.value)?.imports.usd ?? 0
      const usd = ref > 0 ? Math.round(cat2016 * (yr / ref)) : cat2016
      return { name: c.name, iso3: c.iso3, usd }
    })
    .filter(c => c.usd > 0)
    .sort((a, b) => b.usd - a.usd)
    .slice(0, 5)
)
const topExporters = computed(() =>
  [...TRADE_DATA]
    .map(c => {
      const cat2016 = c.byCategory[category.value]?.exports.usd ?? 0
      if (cat2016 === 0) return { name: c.name, iso3: c.iso3, usd: 0 }
      const ref = c.series.at(-1)?.exports.usd ?? 0
      const yr  = c.series.find(s => s.year === selectedYear.value)?.exports.usd ?? 0
      const usd = ref > 0 ? Math.round(cat2016 * (yr / ref)) : cat2016
      return { name: c.name, iso3: c.iso3, usd }
    })
    .filter(c => c.usd > 0)
    .sort((a, b) => b.usd - a.usd)
    .slice(0, 5)
)

const topImportersBar = computed(() => topImporters.value.map(c => ({ label: c.name, value: c.usd, color: '#3b82f6' })))
const topExportersBar = computed(() => topExporters.value.map(c => ({ label: c.name, value: c.usd, color: '#f97316' })))

function isoFromName(name: string): string {
  return TRADE_DATA.find(c => c.name === name)?.iso3.toLowerCase() ?? ''
}

const evolutionSeries = computed(() => [
  { id: 'imports', label: 'Imports', color: '#3b82f6', data: series.value.map(p => ({ year: p.year, value: p.imports.usd })) },
  { id: 'exports', label: 'Exports', color: '#f97316', data: series.value.map(p => ({ year: p.year, value: p.exports.usd })) },
])
</script>

<style scoped>
.overlay-in-enter-active,
.overlay-in-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.overlay-in-enter-from,
.overlay-in-leave-to {
  opacity: 0;
  transform: scale(0.97);
}
</style>
