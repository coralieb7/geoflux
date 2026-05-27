<template>
  <PageWindow :title="c.name">
    <div class="relative flex flex-col gap-2 h-full">

      <!-- Full-screen sunburst overlay -->
      <Transition name="overlay-in">
        <div
          v-if="pieFullScreen"
          class="absolute inset-0 z-20 bg-[#0d2545] border border-[#2d6bb5]/30 rounded-xl flex flex-col"
        >
          <div class="flex items-center justify-between px-3 py-2 border-b border-[#2d6bb5]/25 shrink-0">
            <div class="flex items-center gap-3 min-w-0 flex-1">
              <h3 class="text-xs font-semibold text-[#93c5fd]/70 uppercase tracking-wide shrink-0">
                Trade Categories — {{ c.name }}
              </h3>
              <div class="flex gap-0.5 shrink-0">
                <button
                  v-for="opt in PIE_MODE_OPTS"
                  :key="opt.key"
                  @click="pieMode = opt.key"
                  :class="pieMode === opt.key
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
                  @click="nav.push(`/years/${selectedYear}`, c.name)"
                  class="text-[10px] font-bold text-[#93c5fd] w-8 text-right shrink-0 hover:text-white transition-colors"
                  title="Open year page"
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
          <div class="flex-1 min-h-0">
            <D3SunburstPie
              :categories="sunburstCategories"
              :format-value="formatUsd"
              @navigate-category="onNavCategory"
              @navigate-commodity="onNavCommodity"
            />
          </div>
        </div>
      </Transition>

      <!-- Full-screen evolution overlay -->
      <Transition name="overlay-in">
        <div
          v-if="evoFullScreen"
          class="absolute inset-0 z-20 bg-[#0d2545] border border-[#2d6bb5]/30 rounded-xl flex flex-col"
        >
          <div class="flex items-center justify-between px-3 py-2 border-b border-[#2d6bb5]/25 shrink-0">
            <h3 class="text-xs font-semibold text-[#93c5fd]/70 uppercase tracking-wide">
              Evolution Over Time — {{ c.name }}
            </h3>
            <div class="flex items-center gap-2">
              <div class="flex gap-0.5">
                <button
                  v-for="opt in EVO_METRIC_OPTS"
                  :key="opt.key"
                  @click="evoMetric = opt.key"
                  :class="evoMetric === opt.key
                    ? 'bg-[#2d6bb5] text-white'
                    : 'bg-[#071828] text-[#93c5fd]/60 hover:bg-[#1a3a5c] border border-[#2d6bb5]/30'"
                  class="text-[10px] px-2 py-0.5 rounded transition-colors font-medium"
                >{{ opt.label }}</button>
              </div>
              <button
                @click="evoFullScreen = false"
                class="p-1.5 rounded-full hover:bg-[#1a3a5c] transition-colors text-[#93c5fd]/70 hover:text-[#93c5fd]"
                title="Collapse"
              >
                <UIcon name="i-heroicons-arrows-pointing-in" class="size-4" />
              </button>
            </div>
          </div>
          <div class="flex-1 min-h-0 p-3">
            <D3BarChartRace
              :series="evolutionSeries"
              :format-value="evoMetric === 'usd' ? formatUsd : formatWeight"
            />
          </div>
        </div>
      </Transition>

      <!-- Year selector -->
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
          @click="nav.push(`/years/${selectedYear}`, c.name)"
          class="text-xs font-semibold text-[#93c5fd]/60 hover:text-[#93c5fd] w-9 text-right shrink-0 transition-colors"
          title="Open year page"
        >{{ selectedYear }}</button>
      </div>

      <!-- Row 1: 5 stat cards -->
      <div class="grid grid-cols-5 gap-2 shrink-0">

        <StatCard
          title="Total Imports"
          :value="formatUsd(selectedYearData.imports.usd)"
          color="blue"
          :subtitle="formatWeight(selectedYearData.imports.weight)"
        />

        <StatCard
          title="Total Exports"
          :value="formatUsd(selectedYearData.exports.usd)"
          color="orange"
          :subtitle="formatWeight(selectedYearData.exports.weight)"
        />

        <StatCard
          title="Trade Balance"
          :value="formatUsd(balance)"
          :color="balance >= 0 ? 'orange' : 'blue'"
          subtitle="Exports − Imports"
        />

        <!-- 10-Year Trend (both) -->
        <div class="bg-[#071828] rounded-xl p-3 flex flex-col gap-1.5 border border-[#2d6bb5]/20">
          <h3 class="text-xs font-semibold text-[#93c5fd]/55 uppercase tracking-wide leading-none">10-Year Trend</h3>
          <div class="flex flex-col gap-1 mt-0.5">
            <div class="flex items-center justify-between">
              <span class="text-[10px] text-blue-300/70">Imports</span>
              <span class="text-sm font-bold" :class="importTrend >= 0 ? 'text-green-400' : 'text-red-400'">
                {{ compareData.imports.usd === 0 ? 'N/A' : formatGrowth(importTrend) }}
              </span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-[10px] text-orange-300/70">Exports</span>
              <span class="text-sm font-bold" :class="exportTrend >= 0 ? 'text-green-400' : 'text-red-400'">
                {{ compareData.exports.usd === 0 ? 'N/A' : formatGrowth(exportTrend) }}
              </span>
            </div>
            <button
              @click="nav.push(`/years/${actualCompareYear}`, c.name)"
              class="text-[10px] text-[#93c5fd]/40 hover:text-[#93c5fd] transition-colors text-left"
            >vs {{ actualCompareYear }}</button>
          </div>
        </div>

        <!-- World Share (both) -->
        <div class="bg-[#071828] rounded-xl p-3 flex flex-col gap-1.5 border border-[#2d6bb5]/20">
          <h3 class="text-xs font-semibold text-[#93c5fd]/55 uppercase tracking-wide leading-none">World Share</h3>
          <div class="flex flex-col gap-1 mt-0.5">
            <div class="flex items-center justify-between">
              <span class="text-[10px] text-blue-300/70">Imports</span>
              <span class="text-sm font-bold text-white/85">{{ formatPercent(importWorldShare) }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-[10px] text-orange-300/70">Exports</span>
              <span class="text-sm font-bold text-white/85">{{ formatPercent(exportWorldShare) }}</span>
            </div>
            <button
              @click="nav.push(`/years/${selectedYear}`, c.name)"
              class="text-[10px] text-[#93c5fd]/40 hover:text-[#93c5fd] transition-colors text-left"
            >Year {{ selectedYear }}</button>
          </div>
        </div>

      </div>

      <!-- Rows 2–3: [Sources stacked / Destinations] | [Pie (row-span-2)] | [Evolution (row-span-2)] -->
      <div class="grid grid-cols-[1fr_1fr_3fr] grid-rows-2 gap-2 flex-1 min-h-0">

        <!-- Row 1 Col 1: Top Import Sources -->
        <div class="bg-[#071828] rounded-xl p-3 flex flex-col gap-1.5 border border-[#2d6bb5]/20" style="grid-row: 1; grid-column: 1;">
          <h3 class="text-xs font-semibold text-[#93c5fd]/55 uppercase tracking-wide leading-none">Top Import Sources</h3>
          <button @click="nav.push(`/years/${selectedYear}`, c.name)" class="text-[10px] text-[#93c5fd]/45 hover:text-[#93c5fd] transition-colors text-left">Year {{ selectedYear }}</button>
          <div v-if="tradeConnections" class="flex flex-col gap-1 mt-0.5">
            <div
              v-for="(pct, country) in tradeConnections.top3importers"
              :key="country"
              class="flex items-center justify-between"
            >
              <span class="text-xs text-white/75 truncate">{{ iso3ToName(country) }}</span>
              <span class="text-xs font-semibold text-blue-300 shrink-0 ml-1">{{ pct.toFixed(1) }}%</span>
            </div>
          </div>
          <p v-else class="text-xs text-[#93c5fd]/40">No data</p>
        </div>

        <!-- Row 2 Col 1: Top Export Destinations -->
        <div class="bg-[#071828] rounded-xl p-3 flex flex-col gap-1.5 border border-[#2d6bb5]/20" style="grid-row: 2; grid-column: 1;">
          <h3 class="text-xs font-semibold text-[#93c5fd]/55 uppercase tracking-wide leading-none">Top Export Destinations</h3>
          <button @click="nav.push(`/years/${selectedYear}`, c.name)" class="text-[10px] text-[#93c5fd]/45 hover:text-[#93c5fd] transition-colors text-left">Year {{ selectedYear }}</button>
          <div v-if="tradeConnections" class="flex flex-col gap-1 mt-0.5">
            <div
              v-for="(pct, country) in tradeConnections.top3exportCountries"
              :key="country"
              class="flex items-center justify-between"
            >
              <span class="text-xs text-white/75 truncate">{{ iso3ToName(country) }}</span>
              <span class="text-xs font-semibold text-orange-300 shrink-0 ml-1">{{ pct.toFixed(1) }}%</span>
            </div>
          </div>
          <p v-else class="text-xs text-[#93c5fd]/40">No data</p>
        </div>

        <!-- Col 2, rows 1–2: Pie chart (expandable) -->
        <div
          class="row-span-2 bg-[#071828] rounded-xl p-3 flex flex-col gap-2 cursor-pointer hover:bg-[#0f2540] transition-colors border border-[#2d6bb5]/20"
          style="grid-row: 1 / span 2; grid-column: 2;"
          @click="pieFullScreen = true"
        >
          <div class="flex items-center justify-between shrink-0">
            <h3 class="text-xs font-semibold text-[#93c5fd]/55 uppercase tracking-wide">
              Categories —
              <button @click.stop="nav.push(`/years/${selectedYear}`, c.name)" class="hover:text-[#93c5fd] transition-colors">{{ selectedYear }}</button>
            </h3>
            <div class="flex items-center gap-1.5">
              <div class="flex gap-0.5" @click.stop>
                <button
                  v-for="opt in PIE_MODE_OPTS"
                  :key="opt.key"
                  @click="pieMode = opt.key"
                  :class="pieMode === opt.key
                    ? 'bg-[#2d6bb5] text-white'
                    : 'bg-[#0d2545] text-[#93c5fd]/55 hover:bg-[#1a3a5c] border border-[#2d6bb5]/25'"
                  class="text-[9px] px-1.5 py-0.5 rounded transition-colors font-medium leading-none"
                >{{ opt.label }}</button>
              </div>
              <UIcon name="i-heroicons-arrows-pointing-out" class="size-3.5 text-[#93c5fd]/55" />
            </div>
          </div>
          <div class="flex-1 min-h-0">
            <D3PieChart :slices="pieSlices" :format-value="formatUsd" />
          </div>
          <p class="text-xs text-[#93c5fd]/40 text-center shrink-0">Click to explore</p>
        </div>

        <!-- Col 3, rows 1–2: Evolution (row-span-2, expandable) -->
        <div
          class="row-span-2 bg-[#071828] rounded-xl p-3 flex flex-col border border-[#2d6bb5]/20"
          style="grid-row: 1 / span 2; grid-column: 3;"
        >
          <div class="flex items-center justify-between shrink-0 mb-2">
            <h3 class="text-xs font-semibold text-[#93c5fd]/55 uppercase tracking-wide">Evolution Over Time</h3>
            <div class="flex items-center gap-1">
              <div class="flex gap-0.5">
                <button
                  v-for="opt in EVO_METRIC_OPTS"
                  :key="opt.key"
                  @click="evoMetric = opt.key"
                  :class="evoMetric === opt.key
                    ? 'bg-[#2d6bb5] text-white'
                    : 'bg-[#0d2545] text-[#93c5fd]/55 hover:bg-[#1a3a5c] border border-[#2d6bb5]/25'"
                  class="text-[9px] px-1.5 py-0.5 rounded transition-colors font-medium leading-none"
                >{{ opt.label }}</button>
              </div>
              <button
                @click="evoFullScreen = true"
                class="p-1 rounded hover:bg-[#1a3a5c] transition-colors text-[#93c5fd]/70 hover:text-[#93c5fd]"
                title="Expand"
              >
                <UIcon name="i-heroicons-arrows-pointing-out" class="size-3.5" />
              </button>
            </div>
          </div>
          <div class="flex-1 min-h-0">
            <D3BarChartRace
              :series="evolutionSeries"
              :format-value="evoMetric === 'usd' ? formatUsd : formatWeight"
              :auto-play="true"
              :hide-year-scrubber="true"
            />
          </div>
        </div>

      </div>
    </div>
  </PageWindow>
</template>

<script setup lang="ts">
import { getCountry, getTradeConnections, iso3ToName, TRADE_DATA, YEARS } from '~/utils/dummyData'
import { getCountryYearlySeries, getCategoryYearlySeries, getCommoditiesByCategory } from '~/utils/tradeExtended'
import { formatUsd, formatWeight, formatGrowth, formatPercent, categoryToSlug } from '~/utils/formatters'
import { useNavHistory } from '~/composables/useNavHistory'
import type { PieSlice } from '~/components/d3/PieChart.vue'
import type { SunburstCategory } from '~/components/d3/SunburstPie.vue'

definePageMeta({ layout: 'canvas' })

const route = useRoute()
const nav   = useNavHistory()

const slug = computed(() => (route.params.slug as string).toUpperCase())
const raw  = computed(() => getCountry(slug.value))

if (!raw.value) await navigateTo('/')

const c = computed(() => raw.value!)

// ── Shared year state (synced with map left panel slider) ──────────────────
const { selectedYear } = useTradeState()

// ── Year-specific series ───────────────────────────────────────────────────
const yearlySeries     = computed(() => getCountryYearlySeries(c.value))
const selectedYearData = computed(() =>
  yearlySeries.value.find(p => p.year === selectedYear.value) ?? yearlySeries.value.at(-1)!
)

// ── Year-specific balance ──────────────────────────────────────────────────
const balance = computed(() => selectedYearData.value.exports.usd - selectedYearData.value.imports.usd)

// ── 10-Year Trend ──────────────────────────────────────────────────────────
const targetCompareYear = computed(() => Math.max(YEARS[0] ?? 1988, selectedYear.value - 10))
const compareData = computed(() => {
  const past = yearlySeries.value.filter(p => p.year <= targetCompareYear.value)
  return past.length ? past.at(-1)! : yearlySeries.value.at(0)!
})
const actualCompareYear = computed(() => compareData.value.year)

const importTrend = computed(() => {
  const base = compareData.value.imports.usd
  return base === 0 ? 0 : ((selectedYearData.value.imports.usd - base) / base) * 100
})
const exportTrend = computed(() => {
  const base = compareData.value.exports.usd
  return base === 0 ? 0 : ((selectedYearData.value.exports.usd - base) / base) * 100
})

// ── World Share ────────────────────────────────────────────────────────────
const importWorldShare = computed(() => {
  const worldTotal = TRADE_DATA.reduce((sum, country) => {
    const s = country.series.find(p => p.year === selectedYear.value)
    return sum + (s?.imports.usd ?? 0)
  }, 0)
  return worldTotal === 0 ? 0 : (selectedYearData.value.imports.usd / worldTotal) * 100
})
const exportWorldShare = computed(() => {
  const worldTotal = TRADE_DATA.reduce((sum, country) => {
    const s = country.series.find(p => p.year === selectedYear.value)
    return sum + (s?.exports.usd ?? 0)
  }, 0)
  return worldTotal === 0 ? 0 : (selectedYearData.value.exports.usd / worldTotal) * 100
})

// ── Pie mode ──────────────────────────────────────────────────────────────
type PieMode = 'imports' | 'exports' | 'both'
const pieMode = ref<PieMode>('both')

const PIE_MODE_OPTS: { key: PieMode; label: string }[] = [
  { key: 'both',    label: 'Both'  },
  { key: 'imports', label: 'Imp.'  },
  { key: 'exports', label: 'Exp.'  },
]

const CATEGORY_COLORS = [
  '#3b82f6','#f97316','#22c55e','#a855f7','#eab308',
  '#06b6d4','#ec4899','#f43f5e','#10b981','#8b5cf6',
  '#f59e0b','#6366f1',
]

// ── Year-specific pie slices ───────────────────────────────────────────────
// Scales each country's 2016 by-category value using the global category
// year-over-2016 ratio so that percentages change as categories grow at
// different rates across years.
const pieSlices = computed<PieSlice[]>(() => {
  const all = Object.entries(c.value.byCategory)
    .map(([cat, data]: [string, any]) => {
      const cat2016 = pieMode.value === 'imports' ? (data?.imports.usd ?? 0)
                    : pieMode.value === 'exports' ? (data?.exports.usd ?? 0)
                    : (data?.imports.usd ?? 0) + (data?.exports.usd ?? 0)

      const catSeries = getCategoryYearlySeries(cat)
      const catYearEntry = catSeries.find(s => s.year === selectedYear.value)
      const catLastEntry = catSeries.at(-1)

      let yearValue: number
      if (catYearEntry && catLastEntry) {
        const refVal = pieMode.value === 'imports' ? catLastEntry.imports.usd
                     : pieMode.value === 'exports' ? catLastEntry.exports.usd
                     : catLastEntry.imports.usd + catLastEntry.exports.usd
        const yrVal  = pieMode.value === 'imports' ? catYearEntry.imports.usd
                     : pieMode.value === 'exports' ? catYearEntry.exports.usd
                     : catYearEntry.imports.usd + catYearEntry.exports.usd
        yearValue = refVal > 0 ? cat2016 * (yrVal / refVal) : cat2016
      } else {
        yearValue = cat2016
      }

      return { id: cat, label: cat, value: yearValue }
    })
    .filter(s => s.value > 0)
    .sort((a, b) => b.value - a.value)

  return all.slice(0, 11).map((s, i) => ({ ...s, color: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }))
})

// ── Sunburst (uses year-specific commodity values) ─────────────────────────
const sunburstCategories = computed<SunburstCategory[]>(() =>
  pieSlices.value
    .filter(s => s.id !== '__other__')
    .map(s => ({
      id:    s.id,
      label: s.label,
      slug:  categoryToSlug(s.id),
      color: s.color ?? '#9ca3af',
      value: s.value,
      commodities: getCommoditiesByCategory(s.id).map((com: any) => {
        const comYear = com.series.find((cp: any) => cp.year === selectedYear.value)
        return {
          id:    com.id,
          label: com.name,
          value: pieMode.value === 'imports'
            ? (comYear?.imports.usd ?? com.imports.usd)
            : pieMode.value === 'exports'
            ? (comYear?.exports.usd ?? com.exports.usd)
            : (comYear?.imports.usd ?? com.imports.usd) + (comYear?.exports.usd ?? com.exports.usd),
        }
      }),
    }))
)

// ── Overlay state ──────────────────────────────────────────────────────────
const pieFullScreen = ref(false)
const evoFullScreen = ref(false)

function onNavCategory(catSlug: string) {
  pieFullScreen.value = false
  nav.push(`/categories/${catSlug}`, c.value.name)
}
function onNavCommodity(id: string) {
  pieFullScreen.value = false
  nav.push(`/commodities/${id}`, c.value.name)
}

// ── Evolution metric toggle ────────────────────────────────────────────────
type EvoMetric = 'usd' | 'weight'
const evoMetric = ref<EvoMetric>('usd')

const EVO_METRIC_OPTS: { key: EvoMetric; label: string }[] = [
  { key: 'usd',    label: '$'  },
  { key: 'weight', label: 'wt' },
]

const evolutionSeries = computed(() => [
  {
    id: 'imports', label: evoMetric.value === 'usd' ? 'Imports (USD)' : 'Imports (wt)',
    color: '#3b82f6',
    data: yearlySeries.value.map(p => ({
      year: p.year,
      value: evoMetric.value === 'usd' ? p.imports.usd : p.imports.weight,
    })),
  },
  {
    id: 'exports', label: evoMetric.value === 'usd' ? 'Exports (USD)' : 'Exports (wt)',
    color: '#f97316',
    data: yearlySeries.value.map(p => ({
      year: p.year,
      value: evoMetric.value === 'usd' ? p.exports.usd : p.exports.weight,
    })),
  },
])

// ── Trade connections ──────────────────────────────────────────────────────
const tradeConnections = computed(() => getTradeConnections(c.value.iso3, String(selectedYear.value)))
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
