<template>
  <PageWindow title="Global Statistics">
    <div class="relative flex flex-col gap-2 h-full">

      <!-- ── Full-screen chart overlay ────────────────────────────────────── -->
      <Transition name="chart-overlay">
        <div
          v-if="chartFullScreen"
          class="absolute inset-0 z-20 bg-[#0d2545] border border-[#2d6bb5]/30 rounded-xl flex flex-col"
        >
          <!-- Overlay header -->
          <div class="flex items-center justify-between px-3 py-2 border-b border-[#2d6bb5]/25 shrink-0">
            <div class="flex items-center gap-2">
              <h3 class="text-xs font-semibold text-[#93c5fd]/70 uppercase tracking-wide">
                Trade Evolution (1988–2016)
              </h3>
              <!-- Toggle buttons -->
              <div class="flex gap-1 ml-2">
                <button
                  v-for="opt in METRIC_OPTS"
                  :key="opt.key"
                  @click="chartMetric = opt.key"
                  :class="chartMetric === opt.key
                    ? 'bg-[#2d6bb5] text-white'
                    : 'bg-[#071828] text-[#93c5fd]/60 hover:bg-[#1a3a5c] border border-[#2d6bb5]/30'"
                  class="text-xs px-2 py-0.5 rounded-md transition-colors font-medium"
                >{{ opt.label }}</button>
              </div>
            </div>
            <button
              @click="chartFullScreen = false"
              class="p-1.5 rounded-full hover:bg-[#1a3a5c] transition-colors text-[#93c5fd]/70 hover:text-[#93c5fd]"
              title="Collapse"
            >
              <UIcon name="i-heroicons-arrows-pointing-in" class="size-4" />
            </button>
          </div>
          <!-- Full interactive chart -->
          <div class="flex-1 min-h-0 p-3">
            <D3BarChartRace :series="topCountriesSeries" :format-value="formatUsd" :max-lines="12" />
          </div>
        </div>
      </Transition>

      <!-- ── Row 1: top-level stats ─────────────────────────────────────── -->
      <div class="grid grid-cols-4 gap-2 shrink-0">

        <StatCard
          title="Total World Trade"
          :value="formatUsd(totalImportsUsd + totalExportsUsd)"
          subtitle="Imports + Exports"
        />

        <StatCard
          title="Total Imports"
          :value="formatUsd(totalImportsUsd)"
          color="blue"
          :subtitle="formatWeight(totalImportsWeight)"
        />

        <StatCard
          title="Total Exports"
          :value="formatUsd(totalExportsUsd)"
          color="orange"
          :subtitle="formatWeight(totalExportsWeight)"
        />

        <StatCard
          title="Trade Balance"
          :value="formatUsd(totalExportsUsd - totalImportsUsd)"
          :color="(totalExportsUsd - totalImportsUsd) >= 0 ? 'orange' : 'blue'"
          subtitle="Exports − Imports"
        />

      </div>

      <!-- ── Row 2: lists + evolution chart ────────────────────────────── -->
      <div class="grid grid-cols-4 gap-2 flex-1 min-h-0">

        <!-- Top importing countries -->
        <div class="bg-[#071828] rounded-xl p-3 flex flex-col border border-[#2d6bb5]/20">
          <h3 class="text-xs font-semibold text-[#93c5fd]/55 uppercase tracking-wide mb-2 shrink-0">Top Importing Countries</h3>
          <div class="flex flex-col gap-1 overflow-y-auto flex-1 min-h-0">
            <div
              v-for="(country, idx) in topImporters"
              :key="country.iso3"
              @click="nav.push(`/countries/${country.iso3.toLowerCase()}`, 'Global Statistics')"
              class="flex items-center justify-between p-2 rounded-lg bg-[#0d2545] hover:bg-[#1a3a5c] border border-[#2d6bb5]/20 cursor-pointer transition-colors"
            >
              <div class="flex items-center gap-2 min-w-0">
                <span class="text-xs text-[#93c5fd]/50 font-bold w-4 shrink-0">{{ idx + 1 }}</span>
                <span class="text-xs font-medium text-white/80 truncate">{{ country.name }}</span>
              </div>
              <span class="text-xs font-semibold text-blue-300 shrink-0 ml-1">{{ formatUsd(country.imports.usd) }}</span>
            </div>
          </div>
        </div>

        <!-- Top exporting countries -->
        <div class="bg-[#071828] rounded-xl p-3 flex flex-col border border-[#2d6bb5]/20">
          <h3 class="text-xs font-semibold text-[#93c5fd]/55 uppercase tracking-wide mb-2 shrink-0">Top Exporting Countries</h3>
          <div class="flex flex-col gap-1 overflow-y-auto flex-1 min-h-0">
            <div
              v-for="(country, idx) in topExporters"
              :key="country.iso3"
              @click="nav.push(`/countries/${country.iso3.toLowerCase()}`, 'Global Statistics')"
              class="flex items-center justify-between p-2 rounded-lg bg-[#0d2545] hover:bg-[#1a3a5c] border border-[#2d6bb5]/20 cursor-pointer transition-colors"
            >
              <div class="flex items-center gap-2 min-w-0">
                <span class="text-xs text-[#93c5fd]/50 font-bold w-4 shrink-0">{{ idx + 1 }}</span>
                <span class="text-xs font-medium text-white/80 truncate">{{ country.name }}</span>
              </div>
              <span class="text-xs font-semibold text-orange-300 shrink-0 ml-1">{{ formatUsd(country.exports.usd) }}</span>
            </div>
          </div>
        </div>

        <!-- Top categories -->
        <div class="bg-[#071828] rounded-xl p-3 flex flex-col border border-[#2d6bb5]/20">
          <h3 class="text-xs font-semibold text-[#93c5fd]/55 uppercase tracking-wide mb-2 shrink-0">Top Categories</h3>
          <div class="flex flex-col gap-1 overflow-y-auto flex-1 min-h-0">
            <div
              v-for="(cat, idx) in topCategories"
              :key="cat.name"
              @click="nav.push(`/categories/${categoryToSlug(cat.name)}`, 'Global Statistics')"
              class="flex items-center justify-between p-2 rounded-lg bg-[#0d2545] hover:bg-[#1a3a5c] border border-[#2d6bb5]/20 cursor-pointer transition-colors"
            >
              <div class="flex items-center gap-2 min-w-0">
                <span class="text-xs text-[#93c5fd]/50 font-bold w-4 shrink-0">{{ idx + 1 }}</span>
                <span class="text-xs font-medium text-white/80 truncate">{{ cat.name }}</span>
              </div>
              <span class="text-xs font-semibold text-[#93c5fd]/75 shrink-0 ml-1">{{ formatUsd(cat.total) }}</span>
            </div>
          </div>
        </div>

        <!-- Evolution chart (animated preview + expand button) -->
        <div class="bg-[#071828] rounded-xl p-3 flex flex-col border border-[#2d6bb5]/20">
          <div class="flex items-center justify-between shrink-0 mb-2">
            <h3 class="text-xs font-semibold text-[#93c5fd]/55 uppercase tracking-wide">
              Trade Evolution
            </h3>
            <div class="flex items-center gap-1.5">
              <!-- Inline metric toggle (compact) -->
              <div class="flex gap-0.5">
                <button
                  v-for="opt in METRIC_OPTS"
                  :key="opt.key"
                  @click.stop="chartMetric = opt.key"
                  :class="chartMetric === opt.key
                    ? 'bg-[#2d6bb5] text-white'
                    : 'bg-[#071828] text-[#93c5fd]/55 hover:bg-[#1a3a5c] border border-[#2d6bb5]/25'"
                  class="text-[10px] px-1.5 py-0.5 rounded transition-colors font-medium leading-none"
                >{{ opt.label }}</button>
              </div>
              <!-- Expand button -->
              <button
                @click="chartFullScreen = true"
                class="p-1 rounded hover:bg-[#1a3a5c] transition-colors text-[#93c5fd]/70 hover:text-[#93c5fd]"
                title="Expand"
              >
                <UIcon name="i-heroicons-arrows-pointing-out" class="size-3.5" />
              </button>
            </div>
          </div>
          <!-- Auto-looping preview in compact view -->
          <div class="flex-1 min-h-0">
            <D3BarChartRace :series="topCountriesSeries" :format-value="formatUsd" :auto-play="true" :hide-year-scrubber="true" />
          </div>
        </div>

      </div>
    </div>
  </PageWindow>
</template>

<script setup lang="ts">
import { TRADE_DATA, CATEGORIES } from '~/utils/dummyData'
import { formatUsd, formatWeight, categoryToSlug } from '~/utils/formatters'
import { useNavHistory } from '~/composables/useNavHistory'

definePageMeta({ layout: 'canvas' })

const nav = useNavHistory()

// ── Global totals ──────────────────────────────────────────────────────────

const totalImportsUsd    = computed(() => TRADE_DATA.reduce((s, c) => s + c.imports.usd,    0))
const totalExportsUsd    = computed(() => TRADE_DATA.reduce((s, c) => s + c.exports.usd,    0))
const totalImportsWeight = computed(() => TRADE_DATA.reduce((s, c) => s + c.imports.weight, 0))
const totalExportsWeight = computed(() => TRADE_DATA.reduce((s, c) => s + c.exports.weight, 0))

// ── Top countries ──────────────────────────────────────────────────────────

const topImporters = computed(() =>
  [...TRADE_DATA].sort((a, b) => b.imports.usd - a.imports.usd).slice(0, 10)
)

const topExporters = computed(() =>
  [...TRADE_DATA].sort((a, b) => b.exports.usd - a.exports.usd).slice(0, 10)
)

// ── Top categories ─────────────────────────────────────────────────────────

const topCategories = computed(() => {
  const stats: Record<string, { imports: number; exports: number }> = {}
  CATEGORIES.forEach(cat => (stats[cat] = { imports: 0, exports: 0 }))
  TRADE_DATA.forEach(country => {
    Object.entries(country.byCategory).forEach(([cat, data]) => {
      if (stats[cat] && data) {
        stats[cat].imports += data.imports.usd
        stats[cat].exports += data.exports.usd
      }
    })
  })
  return Object.entries(stats)
    .map(([name, data]) => ({ name, total: data.imports + data.exports }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10)
})

// ── Chart expand + metric toggle ───────────────────────────────────────────

const chartFullScreen = ref(false)
const chartMetric     = ref<'total' | 'imports' | 'exports'>('total')

const METRIC_OPTS = [
  { key: 'total'   as const, label: 'Total'   },
  { key: 'imports' as const, label: 'Imp.'    },
  { key: 'exports' as const, label: 'Exp.'    },
]

// ── BarChartRace series ────────────────────────────────────────────────────

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
