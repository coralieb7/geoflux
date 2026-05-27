<template>
  <PageWindow :title="com.name">
    <div class="flex flex-col gap-2 h-full">

      <!-- Category link + year selector -->
      <div class="flex items-center gap-3 shrink-0 px-1">
        <button
          @click="nav.push(`/categories/${categorySlug}`, com.name)"
          class="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-[#93c5fd]/60 hover:text-[#93c5fd] hover:bg-[#1a3a5c] transition-colors shrink-0"
        >
          <UIcon name="i-heroicons-tag" class="size-3.5" />
          {{ com.category }}
        </button>
        <span class="text-[#2d6bb5]/40 shrink-0">|</span>
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
          @click="nav.push(`/years/${selectedYear}`, com.name)"
          class="text-xs font-semibold text-[#93c5fd]/60 hover:text-[#93c5fd] w-9 text-right shrink-0 transition-colors"
          title="Open year page"
        >{{ selectedYear }}</button>
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
          title="Share of Category"
          :value="formatPercent(categoryShare)"
          :subtitle="com.category"
        />

      </div>

      <!-- Row 2: bar charts + evolution chart -->
      <div class="grid grid-cols-4 gap-2 flex-1 min-h-0">

        <div class="bg-[#071828] rounded-xl p-3 flex flex-col border border-[#2d6bb5]/20">
          <h3 class="text-xs font-semibold text-[#93c5fd]/55 uppercase tracking-wide mb-2 shrink-0">Top Importers</h3>
          <div class="flex-1 min-h-0">
            <D3BarChart
              :data="topImportersBar"
              :format-value="formatUsd"
              :on-bar-click="d => nav.push(`/countries/${isoFromName(d.label)}`, com.name)"
            />
          </div>
        </div>

        <div class="bg-[#071828] rounded-xl p-3 flex flex-col border border-[#2d6bb5]/20">
          <h3 class="text-xs font-semibold text-[#93c5fd]/55 uppercase tracking-wide mb-2 shrink-0">Top Exporters</h3>
          <div class="flex-1 min-h-0">
            <D3BarChart
              :data="topExportersBar"
              :format-value="formatUsd"
              :on-bar-click="d => nav.push(`/countries/${isoFromName(d.label)}`, com.name)"
            />
          </div>
        </div>

        <div class="col-span-2 bg-[#071828] rounded-xl p-3 flex flex-col border border-[#2d6bb5]/20">
          <h3 class="text-xs font-semibold text-[#93c5fd]/55 uppercase tracking-wide mb-2 shrink-0">Evolution Over Time</h3>
          <div class="flex-1 min-h-0">
            <D3BarChartRace :series="evolutionSeries" :format-value="formatUsd" />
          </div>
        </div>

      </div>
    </div>
  </PageWindow>
</template>

<script setup lang="ts">
import { TRADE_DATA, YEARS } from '~/utils/dummyData'
import { getCommodityById, getCommodityYearlySeries, getCategoryYearlySeries } from '~/utils/tradeExtended'
import { formatUsd, formatWeight, formatGrowth, formatPercent, categoryToSlug } from '~/utils/formatters'
import { useNavHistory } from '~/composables/useNavHistory'

definePageMeta({ layout: 'canvas' })

const route = useRoute()
const nav   = useNavHistory()

const slug = computed(() => route.params.slug as string)
const raw  = computed(() => getCommodityById(slug.value))

if (!raw.value) await navigateTo('/')

const com          = computed(() => raw.value!)
const categorySlug = computed(() => categoryToSlug(com.value.category))
const series       = computed(() => getCommodityYearlySeries(com.value))
const catSeries    = computed(() => getCategoryYearlySeries(com.value.category))

const selectedYear     = ref(YEARS.at(-1) ?? 2016)
const selectedYearData = computed(() => series.value.find(p => p.year === selectedYear.value) ?? series.value.at(-1)!)
const catYearData      = computed(() => catSeries.value.find(p => p.year === selectedYear.value) ?? catSeries.value.at(-1)!)

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

const categoryShare = computed(() => {
  const catTotal = catYearData.value.imports.usd + catYearData.value.exports.usd
  const comTotal  = selectedYearData.value.imports.usd + selectedYearData.value.exports.usd
  return catTotal === 0 ? 0 : (comTotal / catTotal) * 100
})

const catImportTotal = computed(() =>
  TRADE_DATA.reduce((s, c) => s + (c.byCategory[com.value.category]?.imports.usd ?? 0), 0)
)
const catExportTotal = computed(() =>
  TRADE_DATA.reduce((s, c) => s + (c.byCategory[com.value.category]?.exports.usd ?? 0), 0)
)

const topImporters = computed(() =>
  [...TRADE_DATA]
    .map(c => {
      const catUsd   = c.byCategory[com.value.category]?.imports.usd ?? 0
      const fraction = catImportTotal.value > 0 ? com.value.imports.usd / catImportTotal.value : 0
      return { name: c.name, iso3: c.iso3, usd: Math.round(catUsd * fraction) }
    })
    .filter(c => c.usd > 0)
    .sort((a, b) => b.usd - a.usd)
    .slice(0, 5)
)
const topExporters = computed(() =>
  [...TRADE_DATA]
    .map(c => {
      const catUsd   = c.byCategory[com.value.category]?.exports.usd ?? 0
      const fraction = catExportTotal.value > 0 ? com.value.exports.usd / catExportTotal.value : 0
      return { name: c.name, iso3: c.iso3, usd: Math.round(catUsd * fraction) }
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