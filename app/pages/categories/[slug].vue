<template>
  <PageWindow :title="category">
    <div class="flex flex-col gap-2 h-full">

      <!-- Global year selector -->
      <div class="flex items-center gap-3 shrink-0 px-1">
        <span class="text-xs font-medium text-zinc-400 shrink-0">Year</span>
        <input
          type="range"
          :min="YEARS[0]"
          :max="YEARS.at(-1)"
          step="1"
          v-model.number="selectedYear"
          class="flex-1 accent-blue-500 h-1"
        />
        <span class="text-xs font-semibold text-zinc-600 w-9 text-right shrink-0">{{ selectedYear }}</span>
      </div>

      <!-- Row 1: 4 stat cards -->
      <div class="grid grid-cols-4 gap-2 shrink-0">

        <StatCard
          title="Trade Value (USD)"
          :value="formatUsd(selectedYearData.imports.usd + selectedYearData.exports.usd)"
          :subtitle="`Year ${selectedYear}`"
        />

        <StatCard
          title="Trade Volume"
          :value="formatWeight(selectedYearData.imports.weight + selectedYearData.exports.weight)"
          :subtitle="`Year ${selectedYear}`"
        />

        <StatCard
          title="10-Year Trend"
          :value="(compareData.imports.usd + compareData.exports.usd) === 0 ? 'N/A' : formatGrowth(trendGrowth)"
          :color="(compareData.imports.usd + compareData.exports.usd) === 0 ? 'default' : (trendGrowth >= 0 ? 'green' : 'red')"
          :subtitle="`vs ${actualCompareYear}`"
        />

        <StatCard
          title="Share of World Trade"
          :value="formatPercent(worldShare)"
          :subtitle="`Year ${selectedYear}`"
        />

      </div>

      <!-- Row 2: bar charts + evolution chart -->
      <div class="grid grid-cols-4 gap-2 flex-1 min-h-0">

        <div class="bg-zinc-50 rounded-xl p-3 flex flex-col">
          <h3 class="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2 shrink-0">Top Importers</h3>
          <div class="flex-1 min-h-0">
            <D3BarChart
              :data="topImportersBar"
              :format-value="formatUsd"
              :on-bar-click="d => nav.push(`/countries/${isoFromName(d.label)}`, category)"
            />
          </div>
        </div>

        <div class="bg-zinc-50 rounded-xl p-3 flex flex-col">
          <h3 class="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2 shrink-0">Top Exporters</h3>
          <div class="flex-1 min-h-0">
            <D3BarChart
              :data="topExportersBar"
              :format-value="formatUsd"
              :on-bar-click="d => nav.push(`/countries/${isoFromName(d.label)}`, category)"
            />
          </div>
        </div>

        <div class="col-span-2 bg-zinc-50 rounded-xl p-3 flex flex-col">
          <h3 class="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2 shrink-0">Evolution Over Time</h3>
          <div class="flex-1 min-h-0">
            <D3BarChartRace :series="evolutionSeries" :format-value="formatUsd" />
          </div>
        </div>

      </div>

      <!-- Row 3: Commodities (compact, with internal scroll) -->
      <div class="shrink-0 bg-zinc-50 rounded-xl p-3">
        <h3 class="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2">Commodities in this Category</h3>
        <div class="grid grid-cols-4 gap-1.5 max-h-24 overflow-y-auto">
          <div
            v-for="com in commodities"
            :key="com.id"
            @click="nav.push(`/commodities/${com.id}`, category)"
            class="p-2 rounded-lg bg-white hover:bg-zinc-100 border border-zinc-200 cursor-pointer transition-colors"
          >
            <p class="text-xs font-medium text-zinc-700 leading-snug truncate">{{ com.name }}</p>
            <p class="text-xs text-zinc-400 mt-0.5">{{ formatUsd(com.imports.usd + com.exports.usd) }}</p>
          </div>
        </div>
      </div>

    </div>
  </PageWindow>
</template>

<script setup lang="ts">
import { TRADE_DATA, CATEGORIES, YEARS } from '~/utils/dummyData'
import { getCategoryYearlySeries, getCommoditiesByCategory } from '~/utils/tradeExtended'
import { formatUsd, formatWeight, formatGrowth, formatPercent, slugToCategory } from '~/utils/formatters'
import { useNavHistory } from '~/composables/useNavHistory'

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

const topImporters = computed(() =>
  [...TRADE_DATA]
    .map(c => ({ name: c.name, iso3: c.iso3, usd: c.byCategory[category.value]?.imports.usd ?? 0 }))
    .filter(c => c.usd > 0)
    .sort((a, b) => b.usd - a.usd)
    .slice(0, 5)
)
const topExporters = computed(() =>
  [...TRADE_DATA]
    .map(c => ({ name: c.name, iso3: c.iso3, usd: c.byCategory[category.value]?.exports.usd ?? 0 }))
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