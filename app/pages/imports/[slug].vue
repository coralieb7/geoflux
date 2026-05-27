<template>
  <PageWindow :title="`${c.name} — Imports`">
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

      <!-- Row 1: 4 stat cards (auto-height) -->
      <div class="grid grid-cols-4 gap-2 shrink-0">

        <StatCard
          title="Import Value (USD)"
          :value="formatUsd(selectedYearData.imports.usd)"
          color="blue"
        />

        <StatCard
          title="Import Volume"
          :value="formatWeight(selectedYearData.imports.weight)"
        />

        <StatCard
          title="10-Year Trend"
          :value="compareData.imports.usd === 0 ? 'N/A' : formatGrowth(trendGrowth)"
          :color="compareData.imports.usd === 0 ? 'default' : (trendGrowth >= 0 ? 'green' : 'red')"
          :subtitle="`vs ${actualCompareYear}: ${formatUsd(compareData.imports.usd)}`"
        />

        <StatCard
          title="Share of World Imports"
          :value="formatPercent(worldShare)"
          :subtitle="`Year ${selectedYear}`"
        />

      </div>

      <!-- Row 2: top sources + evolution chart (fills remaining height) -->
      <div class="grid grid-cols-4 gap-2 flex-1 min-h-0">

        <!-- Top 3 import sources -->
        <div class="bg-zinc-50 rounded-xl p-3 flex flex-col gap-1.5">
          <h3 class="text-xs font-semibold text-zinc-400 uppercase tracking-wide leading-none">Top Import Sources</h3>
          <p class="text-xs text-zinc-400">Year {{ selectedYear }}</p>
          <div v-if="tradeConnections" class="flex flex-col gap-1.5 mt-0.5">
            <div
              v-for="(pct, country) in tradeConnections.top3importers"
              :key="country"
              class="flex items-center justify-between"
            >
              <span class="text-xs text-zinc-600 truncate">{{ iso3ToName(country) }}</span>
              <span class="text-xs font-semibold text-blue-500 shrink-0 ml-1">{{ pct.toFixed(1) }}%</span>
            </div>
          </div>
          <p v-else class="text-xs text-zinc-400 mt-0.5">No data for {{ selectedYear }}</p>
        </div>

        <!-- Evolution chart -->
        <div class="col-span-3 bg-zinc-50 rounded-xl p-3 flex flex-col">
          <h3 class="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2">Import Evolution (1988–2016)</h3>
          <div class="flex-1 min-h-0">
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
useNavHistory()

const slug = computed(() => (route.params.slug as string).toUpperCase())
const raw  = computed(() => getCountry(slug.value))

if (!raw.value) await navigateTo('/')

const c      = computed(() => raw.value!)
const series = computed(() => getCountryYearlySeries(c.value))

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
  const base    = compareData.value.imports.usd
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