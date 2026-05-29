<template>
  <PageWindow title="Global Statistics">
    <div class="relative flex flex-col gap-2 h-full">

      <!-- ── Fullscreen: Top Importers bar ──────────────────────────────────── -->
      <Transition name="chart-overlay">
        <div v-if="barImportFullScreen" class="absolute inset-0 z-20 bg-[#0d2545] border border-[#2d6bb5]/30 rounded-xl flex flex-col">
          <div class="flex items-center justify-between px-3 py-2 border-b border-[#2d6bb5]/25 shrink-0">
            <h3 class="text-xs font-semibold text-[#93c5fd]/70 uppercase tracking-wide">All Importing Countries</h3>
            <button @click="barImportFullScreen = false" class="p-1.5 rounded-full hover:bg-[#1a3a5c] transition-colors text-[#93c5fd]/70 hover:text-[#93c5fd]" title="Collapse">
              <UIcon name="i-heroicons-arrows-pointing-in" class="size-4" />
            </button>
          </div>
          <div class="flex-1 min-h-0 p-3 overflow-y-auto">
            <D3BarChart
              :data="allImportersBar"
              :format-value="formatUsd"
              :on-bar-click="d => { barImportFullScreen = false; nav.push(`/countries/${isoFromName(d.label)}`, 'Global Statistics') }"
            />
          </div>
        </div>
      </Transition>

      <!-- ── Fullscreen: Top Exporters bar ──────────────────────────────────── -->
      <Transition name="chart-overlay">
        <div v-if="barExportFullScreen" class="absolute inset-0 z-20 bg-[#0d2545] border border-[#2d6bb5]/30 rounded-xl flex flex-col">
          <div class="flex items-center justify-between px-3 py-2 border-b border-[#2d6bb5]/25 shrink-0">
            <h3 class="text-xs font-semibold text-[#93c5fd]/70 uppercase tracking-wide">All Exporting Countries</h3>
            <button @click="barExportFullScreen = false" class="p-1.5 rounded-full hover:bg-[#1a3a5c] transition-colors text-[#93c5fd]/70 hover:text-[#93c5fd]" title="Collapse">
              <UIcon name="i-heroicons-arrows-pointing-in" class="size-4" />
            </button>
          </div>
          <div class="flex-1 min-h-0 p-3 overflow-y-auto">
            <D3BarChart
              :data="allExportersBar"
              :format-value="formatUsd"
              :on-bar-click="d => { barExportFullScreen = false; nav.push(`/countries/${isoFromName(d.label)}`, 'Global Statistics') }"
            />
          </div>
        </div>
      </Transition>

      <!-- ── Fullscreen: Categories pie ─────────────────────────────────────── -->
      <Transition name="chart-overlay">
        <div v-if="catPieFullScreen" class="absolute inset-0 z-20 bg-[#0d2545] border border-[#2d6bb5]/30 rounded-xl flex flex-col">
          <div class="flex items-center justify-between px-3 py-2 border-b border-[#2d6bb5]/25 shrink-0">
            <div class="flex items-center gap-3">
              <h3 class="text-xs font-semibold text-[#93c5fd]/70 uppercase tracking-wide">Top Categories</h3>
              <div class="flex gap-1">
                <button
                  v-for="opt in CAT_PIE_OPTS" :key="opt.key"
                  @click="catPieMode = opt.key"
                  :class="catPieMode === opt.key ? 'bg-[#2d6bb5] text-white' : 'bg-[#071828] text-[#93c5fd]/60 hover:bg-[#1a3a5c] border border-[#2d6bb5]/30'"
                  class="text-xs px-2 py-0.5 rounded-md transition-colors font-medium"
                >{{ opt.label }}</button>
              </div>
              <div class="flex items-center gap-2 ml-2">
                <span class="text-[10px] text-[#93c5fd]/50">Year</span>
                <input type="range" :min="YEARS[0]" :max="YEARS.at(-1)" step="1" v-model.number="selectedYear" class="w-28 accent-[#3b82f6] h-1" />
                <span class="text-xs font-bold text-[#93c5fd]">{{ selectedYear }}</span>
              </div>
            </div>
            <button @click="catPieFullScreen = false" class="p-1.5 rounded-full hover:bg-[#1a3a5c] transition-colors text-[#93c5fd]/70 hover:text-[#93c5fd]" title="Collapse">
              <UIcon name="i-heroicons-arrows-pointing-in" class="size-4" />
            </button>
          </div>
          <div class="flex-1 min-h-0 p-3">
            <D3PieChart
              :slices="categoryPieSlices"
              :format-value="formatUsd"
              :on-slice-click="s => { catPieFullScreen = false; nav.push(`/categories/${categoryToSlug(s.label)}`, 'Global Statistics') }"
            />
          </div>
        </div>
      </Transition>

      <!-- ── Fullscreen: Trade Evolution ────────────────────────────────────── -->
      <Transition name="chart-overlay">
        <div v-if="chartFullScreen" class="absolute inset-0 z-20 bg-[#0d2545] border border-[#2d6bb5]/30 rounded-xl flex flex-col">
          <div class="flex items-center justify-between px-3 py-2 border-b border-[#2d6bb5]/25 shrink-0">
            <div class="flex items-center gap-2">
              <h3 class="text-xs font-semibold text-[#93c5fd]/70 uppercase tracking-wide">Trade Evolution (1988–2016)</h3>
              <div class="flex gap-1 ml-2">
                <button
                  v-for="opt in METRIC_OPTS" :key="opt.key"
                  @click="chartMetric = opt.key"
                  :class="chartMetric === opt.key ? 'bg-[#2d6bb5] text-white' : 'bg-[#071828] text-[#93c5fd]/60 hover:bg-[#1a3a5c] border border-[#2d6bb5]/30'"
                  class="text-xs px-2 py-0.5 rounded-md transition-colors font-medium"
                >{{ opt.label }}</button>
              </div>
            </div>
            <button @click="chartFullScreen = false" class="p-1.5 rounded-full hover:bg-[#1a3a5c] transition-colors text-[#93c5fd]/70 hover:text-[#93c5fd]" title="Collapse">
              <UIcon name="i-heroicons-arrows-pointing-in" class="size-4" />
            </button>
          </div>
          <div class="flex-1 min-h-0 p-3">
            <D3BarChartRace :series="topCountriesSeries" :format-value="formatUsd" :max-lines="12" />
          </div>
        </div>
      </Transition>

      <!-- ── Row 1: stat cards ───────────────────────────────────────────────── -->
      <div class="grid grid-cols-4 gap-2 shrink-0">
        <StatCard title="Total World Trade" :value="formatUsd(totalImportsUsd + totalExportsUsd)" subtitle="Imports + Exports" />
        <StatCard title="Total Imports" :value="formatUsd(totalImportsUsd)" color="blue" :subtitle="formatWeight(totalImportsWeight)" />
        <StatCard title="Total Exports" :value="formatUsd(totalExportsUsd)" color="orange" :subtitle="formatWeight(totalExportsWeight)" />
        <StatCard
          title="Trade Balance"
          :value="formatUsd(totalExportsUsd - totalImportsUsd)"
          :color="(totalExportsUsd - totalImportsUsd) >= 0 ? 'orange' : 'blue'"
          subtitle="Exports − Imports"
        />
      </div>

      <!-- ── Row 2: Top importers + exporters side by side (fixed height) ─── -->
      <div class="grid grid-cols-2 gap-2 shrink-0 h-44">

        <!-- Top importing countries bar chart -->
        <div class="bg-[#071828] rounded-xl p-3 flex flex-col border border-[#2d6bb5]/20">
          <div class="flex items-center justify-between shrink-0 mb-1.5">
            <h3 class="text-xs font-semibold text-[#93c5fd]/55 uppercase tracking-wide">Top Importers</h3>
            <button @click="barImportFullScreen = true" class="p-1 rounded hover:bg-[#1a3a5c] transition-colors text-[#93c5fd]/70 hover:text-[#93c5fd]" title="Expand all">
              <UIcon name="i-heroicons-arrows-pointing-out" class="size-3.5" />
            </button>
          </div>
          <div class="flex-1 min-h-0 overflow-hidden">
            <D3BarChart
              :data="topImportersBar"
              :format-value="formatUsd"
              :on-bar-click="d => { const iso = isoFromName(d.label); if (iso) nav.push(`/countries/${iso}`, 'Global Statistics') }"
            />
          </div>
        </div>

        <!-- Top exporting countries bar chart -->
        <div class="bg-[#071828] rounded-xl p-3 flex flex-col border border-[#2d6bb5]/20">
          <div class="flex items-center justify-between shrink-0 mb-1.5">
            <h3 class="text-xs font-semibold text-[#93c5fd]/55 uppercase tracking-wide">Top Exporters</h3>
            <button @click="barExportFullScreen = true" class="p-1 rounded hover:bg-[#1a3a5c] transition-colors text-[#93c5fd]/70 hover:text-[#93c5fd]" title="Expand all">
              <UIcon name="i-heroicons-arrows-pointing-out" class="size-3.5" />
            </button>
          </div>
          <div class="flex-1 min-h-0 overflow-hidden">
            <D3BarChart
              :data="topExportersBar"
              :format-value="formatUsd"
              :on-bar-click="d => { const iso = isoFromName(d.label); if (iso) nav.push(`/countries/${iso}`, 'Global Statistics') }"
            />
          </div>
        </div>

      </div>

      <!-- ── Row 3: Categories pie + Trade evolution (fills rest) ──────────── -->
      <div class="grid grid-cols-[1fr_2fr] gap-2 flex-1 min-h-0">

        <!-- Top categories pie chart -->
        <div class="bg-[#071828] rounded-xl p-3 flex flex-col border border-[#2d6bb5]/20">
          <div class="flex items-center justify-between shrink-0 mb-1">
            <h3 class="text-xs font-semibold text-[#93c5fd]/55 uppercase tracking-wide">Top Categories</h3>
            <div class="flex items-center gap-1">
              <div class="flex gap-0.5">
                <button
                  v-for="opt in CAT_PIE_OPTS" :key="opt.key"
                  @click.stop="catPieMode = opt.key"
                  :class="catPieMode === opt.key ? 'bg-[#2d6bb5] text-white' : 'bg-[#071828] text-[#93c5fd]/55 hover:bg-[#1a3a5c] border border-[#2d6bb5]/25'"
                  class="text-[10px] px-1.5 py-0.5 rounded transition-colors font-medium leading-none"
                >{{ opt.label }}</button>
              </div>
              <button @click="catPieFullScreen = true" class="p-1 rounded hover:bg-[#1a3a5c] transition-colors text-[#93c5fd]/70 hover:text-[#93c5fd]" title="Expand">
                <UIcon name="i-heroicons-arrows-pointing-out" class="size-3.5" />
              </button>
            </div>
          </div>
          <div class="flex items-center gap-1.5 mb-1.5 shrink-0">
            <span class="text-[10px] text-[#93c5fd]/40">Year</span>
            <input type="range" :min="YEARS[0]" :max="YEARS.at(-1)" step="1" v-model.number="selectedYear" class="flex-1 accent-[#3b82f6] h-1" />
            <span class="text-[10px] font-bold text-[#93c5fd]/70 w-7 text-right">{{ selectedYear }}</span>
          </div>
          <div class="flex-1 min-h-0">
            <D3PieChart
              :slices="categoryPieSlices"
              :format-value="formatUsd"
              :on-slice-click="s => nav.push(`/categories/${categoryToSlug(s.label)}`, 'Global Statistics')"
            />
          </div>
        </div>

        <!-- Trade evolution (takes 2/3 of row) -->
        <div class="bg-[#071828] rounded-xl p-3 flex flex-col border border-[#2d6bb5]/20">
          <div class="flex items-center justify-between shrink-0 mb-2">
            <h3 class="text-xs font-semibold text-[#93c5fd]/55 uppercase tracking-wide">Trade Evolution</h3>
            <div class="flex items-center gap-1.5">
              <div class="flex gap-0.5">
                <button
                  v-for="opt in METRIC_OPTS" :key="opt.key"
                  @click.stop="chartMetric = opt.key"
                  :class="chartMetric === opt.key ? 'bg-[#2d6bb5] text-white' : 'bg-[#071828] text-[#93c5fd]/55 hover:bg-[#1a3a5c] border border-[#2d6bb5]/25'"
                  class="text-[10px] px-1.5 py-0.5 rounded transition-colors font-medium leading-none"
                >{{ opt.label }}</button>
              </div>
              <button @click="chartFullScreen = true" class="p-1 rounded hover:bg-[#1a3a5c] transition-colors text-[#93c5fd]/70 hover:text-[#93c5fd]" title="Expand">
                <UIcon name="i-heroicons-arrows-pointing-out" class="size-3.5" />
              </button>
            </div>
          </div>
          <div class="flex-1 min-h-0">
            <D3BarChartRace :series="topCountriesSeries" :format-value="formatUsd" :auto-play="true" :hide-year-scrubber="true" />
          </div>
        </div>

      </div>
    </div>
  </PageWindow>
</template>

<script setup lang="ts">
import { TRADE_DATA, CATEGORIES, YEARS } from '~/utils/dummyData'
import { getCategoryYearlySeries } from '~/utils/tradeExtended'
import { formatUsd, formatWeight, categoryToSlug } from '~/utils/formatters'
import { useNavHistory } from '~/composables/useNavHistory'
import type { PieSlice } from '~/components/d3/PieChart.vue'

definePageMeta({ layout: 'canvas' })

const nav = useNavHistory()
const { selectedYear } = useTradeState()

// ── Global totals ──────────────────────────────────────────────────────────

const totalImportsUsd    = computed(() => TRADE_DATA.reduce((s, c) => s + c.imports.usd,    0))
const totalExportsUsd    = computed(() => TRADE_DATA.reduce((s, c) => s + c.exports.usd,    0))
const totalImportsWeight = computed(() => TRADE_DATA.reduce((s, c) => s + c.imports.weight, 0))
const totalExportsWeight = computed(() => TRADE_DATA.reduce((s, c) => s + c.exports.weight, 0))

// ── Top countries bar chart data ───────────────────────────────────────────

const topImportersBar = computed(() =>
  [...TRADE_DATA]
    .sort((a, b) => b.imports.usd - a.imports.usd)
    .slice(0, 5)
    .map(c => ({ label: c.name, value: c.imports.usd, color: '#3b82f6' }))
)

const allImportersBar = computed(() =>
  [...TRADE_DATA]
    .sort((a, b) => b.imports.usd - a.imports.usd)
    .map(c => ({ label: c.name, value: c.imports.usd, color: getCountryColor(c.iso3) }))
)

const topExportersBar = computed(() =>
  [...TRADE_DATA]
    .sort((a, b) => b.exports.usd - a.exports.usd)
    .slice(0, 5)
    .map(c => ({ label: c.name, value: c.exports.usd, color: '#f97316' }))
)

const allExportersBar = computed(() =>
  [...TRADE_DATA]
    .sort((a, b) => b.exports.usd - a.exports.usd)
    .map(c => ({ label: c.name, value: c.exports.usd, color: getCountryColor(c.iso3) }))
)

function isoFromName(name: string): string {
  return TRADE_DATA.find(c => c.name === name)?.iso3.toLowerCase() ?? ''
}

// ── Categories pie chart ───────────────────────────────────────────────────

type CatPieMode = 'both' | 'imports' | 'exports'
const catPieMode = ref<CatPieMode>('both')

const CAT_PIE_OPTS: { key: CatPieMode; label: string }[] = [
  { key: 'both',    label: 'Both'  },
  { key: 'imports', label: 'Imp.'  },
  { key: 'exports', label: 'Exp.'  },
]

const CATEGORY_COLORS = [
  '#3b82f6','#f97316','#22c55e','#a855f7','#eab308',
  '#06b6d4','#ec4899','#f43f5e','#10b981','#8b5cf6',
  '#f59e0b','#6366f1','#14b8a6','#ef4444','#84cc16','#a78bfa',
]

function getCatColor(cat: string): string {
  const idx = CATEGORIES.indexOf(cat)
  return CATEGORY_COLORS[idx % CATEGORY_COLORS.length]!
}

const categoryPieSlices = computed<PieSlice[]>(() =>
  CATEGORIES
    .map(cat => {
      const series = getCategoryYearlySeries(cat)
      const yr = series.find(s => s.year === selectedYear.value) ?? series.at(-1)!
      const value = catPieMode.value === 'imports' ? yr.imports.usd
                  : catPieMode.value === 'exports' ? yr.exports.usd
                  : yr.imports.usd + yr.exports.usd
      return { id: cat, label: cat, value, color: getCatColor(cat) }
    })
    .filter(d => d.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 12)
)

// ── Fullscreen refs ────────────────────────────────────────────────────────

const barImportFullScreen = ref(false)
const barExportFullScreen = ref(false)
const catPieFullScreen    = ref(false)
const chartFullScreen     = ref(false)

// ── Trade evolution metric + series ───────────────────────────────────────

const chartMetric = ref<'total' | 'imports' | 'exports'>('total')

const METRIC_OPTS = [
  { key: 'total'   as const, label: 'Total' },
  { key: 'imports' as const, label: 'Imp.'  },
  { key: 'exports' as const, label: 'Exp.'  },
]

const COUNTRY_COLORS = [
  '#3b82f6','#f97316','#22c55e','#a855f7','#eab308',
  '#06b6d4','#ec4899','#f43f5e','#10b981','#8b5cf6',
]

function getCountryColor(iso3: string): string {
  let hash = 0
  for (let i = 0; i < iso3.length; i++) hash = iso3.charCodeAt(i) + ((hash << 5) - hash)
  return COUNTRY_COLORS[Math.abs(hash) % COUNTRY_COLORS.length]!
}

const topCountriesSeries = computed(() =>
  TRADE_DATA.map(c => ({
    id:    c.iso3,
    label: c.name,
    color: getCountryColor(c.iso3),
    data:  c.series.map(s => ({
      year:  s.year,
      value: chartMetric.value === 'total'
        ? s.imports.usd + s.exports.usd
        : chartMetric.value === 'imports'
          ? s.imports.usd
          : s.exports.usd,
    })),
  }))
)
</script>

<style scoped>
.chart-overlay-enter-active,
.chart-overlay-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.chart-overlay-enter-from,
.chart-overlay-leave-to {
  opacity: 0;
  transform: scale(0.97);
}
</style>
