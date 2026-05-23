<template>
  <PageWindow :title="`${c.name} Imports`">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

      <!-- Value in USD (expandable year selector) -->
      <StatCard
        title="Import Value (USD)"
        :value="formatUsd(selectedYearData.imports.usd)"
        color="blue"
        :subtitle="`Year: ${selectedYear}`"
        expandable
        clickable
      >
        <YearSlider v-model="selectedYear" />
      </StatCard>

      <!-- Value in weight (expandable year selector) -->
      <StatCard
        title="Import Volume (Weight)"
        :value="formatWeight(selectedYearData.imports.weight)"
        :subtitle="`Year: ${selectedYear}`"
        expandable
        clickable
      >
        <YearSlider v-model="selectedYear" />
      </StatCard>

      <!-- 10-Year trend -->
      <StatCard
        title="10-Year Trend"
        :value="compareData.imports.usd === 0 ? 'N/A' : formatGrowth(trendGrowth)"
        :color="compareData.imports.usd === 0 ? 'default' : (trendGrowth >= 0 ? 'green' : 'red')"
        :subtitle="`Compared to ${actualCompareYear}`"
        expandable
        clickable
      >
        <YearSlider v-model="selectedYear" />
        <p class="text-xs text-zinc-500 mt-2">
          From {{ formatUsd(compareData.imports.usd) }} in {{ actualCompareYear }} to {{ formatUsd(selectedYearData.imports.usd) }} in {{ selectedYear }}
        </p>
      </StatCard>

      <!-- Share of world imports (expandable year selector) -->
      <StatCard
        title="Share of World Imports"
        :value="formatPercent(worldShare)"
        :subtitle="`Year: ${selectedYear}`"
        expandable
        clickable
      >
        <YearSlider v-model="selectedYear" />
      </StatCard>

      <!-- Top 3 import sources -->
      <StatCard
        title="Top 3 Import Sources"
        color="blue"
        :subtitle="`Year: ${selectedYear}`"
        expandable
        clickable
      >
        <template #body>
          <div v-if="tradeConnections" class="flex flex-col gap-2">
            <div
              v-for="(pct, country) in tradeConnections.top3importers"
              :key="country"
              class="flex items-center justify-between"
            >
              <span class="text-sm text-zinc-700 dark:text-zinc-300">{{ iso3ToName(country) }}</span>
              <span class="text-sm font-semibold text-blue-600 dark:text-blue-400">{{ pct.toFixed(1) }}%</span>
            </div>
          </div>
          <p v-else class="text-sm text-zinc-400">No data available for {{ selectedYear }}</p>
        </template>
        <YearSlider v-model="selectedYear" />
      </StatCard>

      <!-- Evolution chart (full width) -->
      <div class="col-span-1 md:col-span-2 lg:col-span-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl p-5 min-h-100 flex flex-col">
        <h3 class="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-3">Import Evolution (1988–2023)</h3>
        <div class="h-64 flex-1 w-full flex flex-col bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700 p-3">
          <D3BarChartRace
            :series="[
              { id: 'imports', label: 'Imports (USD)',    color: '#3b82f6', data: usdSeries },
              { id: 'weight',  label: 'Imports (weight)', color: '#22c55e', data: weightSeries },
            ]"
            :format-value="formatUsd"
          />
        </div>
      </div>

    </div>
  </PageWindow>
</template>

<script setup lang="ts">
import { getCountry, getTradeConnections, iso3ToName, TRADE_DATA, YEARS } from '~/utils/dummyData'
import { getCountryYearlySeries } from '~/utils/tradeExtended'
import { formatUsd, formatWeight, formatGrowth, formatPercent } from '~/utils/formatters'
import { useNavHistory } from '~/composables/useNavHistory'

definePageMeta({ layout: 'canvas' })

const route = useRoute()
useNavHistory() // keep history state alive

const slug = computed(() => (route.params.slug as string).toUpperCase())
const raw  = computed(() => getCountry(slug.value))

if (!raw.value) await navigateTo('/')

const c      = computed(() => raw.value!)
const series = computed(() => getCountryYearlySeries(c.value))

const selectedYear     = ref(YEARS.at(-1) ?? 2016)
const selectedYearData = computed(() => series.value.find(p => p.year === selectedYear.value) ?? series.value.at(-1)!)

// 10-Year Trend logic
const targetCompareYear = computed(() => Math.max(1988, selectedYear.value - 10))
const compareData = computed(() => {
  const past = series.value.filter(p => p.year <= targetCompareYear.value)
  return past.length ? past.at(-1)! : series.value.at(0)!
})
const actualCompareYear = computed(() => compareData.value.year)

const trendGrowth = computed(() => {
  const base = compareData.value.imports.usd
  const current = selectedYearData.value.imports.usd
  return base === 0 ? 0 : ((current - base) / base) * 100
})

const worldShare = computed(() => {
  const worldAtYear = TRADE_DATA.reduce((sum, country) => {
    const s = getCountryYearlySeries(country).find(p => p.year === selectedYear.value)
    return sum + (s?.imports.usd ?? 0)
  }, 0)
  return worldAtYear === 0 ? 0 : (selectedYearData.value.imports.usd / worldAtYear) * 100
})

const tradeConnections = computed(() => getTradeConnections(c.value.iso3, String(selectedYear.value)))

const usdSeries    = computed(() => series.value.map(p => ({ year: p.year, value: p.imports.usd })))
const weightSeries = computed(() => series.value.map(p => ({ year: p.year, value: p.imports.weight })))
</script>
