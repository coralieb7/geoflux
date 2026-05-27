<template>
  <PageWindow :title="`${c.name} — Exports`">
    <div class="flex flex-col gap-2 h-full">

      <!-- Global year selector -->
      <div class="flex items-center gap-3 shrink-0 px-1">
        <span class="text-xs font-medium text-[#93c5fd]/55 shrink-0">Year</span>
        <input
          type="range"
          :min="YEARS[0]"
          :max="YEARS.at(-1)"
          step="1"
          v-model.number="selectedYear"
          class="flex-1 accent-[#f97316] h-1"
        />
        <button
          @click="nav.push(`/years/${selectedYear}`, `${c.name} — Exports`)"
          class="text-xs font-semibold text-[#93c5fd]/60 hover:text-[#93c5fd] w-9 text-right shrink-0 transition-colors"
          title="Open year page"
        >{{ selectedYear }}</button>
      </div>

      <!-- Row 1: 5 cards (value, volume, trend, world share, top destinations) -->
      <div class="grid grid-cols-5 gap-2 shrink-0">

        <StatCard
          title="Export Value (USD)"
          :value="formatUsd(selectedYearData.exports.usd)"
          color="orange"
        />

        <StatCard
          title="Export Volume"
          :value="formatWeight(selectedYearData.exports.weight)"
        />

        <StatCard
          title="10-Year Trend"
          :value="compareData.exports.usd === 0 ? 'N/A' : formatGrowth(trendGrowth)"
          :color="compareData.exports.usd === 0 ? 'default' : (trendGrowth >= 0 ? 'green' : 'red')"
          :subtitle="`vs ${actualCompareYear}: ${formatUsd(compareData.exports.usd)}`"
          :subtitle-click="() => nav.push(`/years/${actualCompareYear}`, `${c.name} — Exports`)"
        />

        <StatCard
          title="Share of World Exports"
          :value="formatPercent(worldShare)"
          :subtitle="`Year ${selectedYear}`"
          :subtitle-click="() => nav.push(`/years/${selectedYear}`, `${c.name} — Exports`)"
        />

        <!-- Top export destinations -->
        <div class="bg-[#071828] rounded-xl p-3 flex flex-col gap-1.5 border border-[#2d6bb5]/20">
          <h3 class="text-xs font-semibold text-[#93c5fd]/55 uppercase tracking-wide leading-none">Top Destinations</h3>
          <button @click="nav.push(`/years/${selectedYear}`, `${c.name} — Exports`)" class="text-[10px] text-[#93c5fd]/45 hover:text-[#93c5fd] transition-colors text-left">Year {{ selectedYear }}</button>
          <div v-if="tradeConnections" class="flex flex-col gap-1.5 mt-0.5">
            <div
              v-for="(pct, country) in tradeConnections.top3exportCountries"
              :key="country"
              class="flex items-center justify-between"
            >
              <span class="text-xs text-white/75 truncate">{{ iso3ToName(country) }}</span>
              <span class="text-xs font-semibold text-orange-300 shrink-0 ml-1">{{ pct.toFixed(1) }}%</span>
            </div>
          </div>
          <p v-else class="text-xs text-[#93c5fd]/40 mt-0.5">No data for {{ selectedYear }}</p>
        </div>

      </div>

      <!-- Row 2: full-width evolution chart -->
      <div class="flex-1 min-h-0 bg-[#071828] rounded-xl p-3 flex flex-col border border-[#2d6bb5]/20">
        <h3 class="text-xs font-semibold text-[#93c5fd]/55 uppercase tracking-wide mb-2 shrink-0">Export Evolution (1988–2016)</h3>
        <div class="flex-1 min-h-0">
          <D3BarChartRace
            :series="[
              { id: 'exports', label: 'Exports (USD)',    color: '#f97316', data: usdSeries },
              { id: 'weight',  label: 'Exports (weight)', color: '#a855f7', data: weightSeries },
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
const nav   = useNavHistory()

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
  const base    = compareData.value.exports.usd
  const current = selectedYearData.value.exports.usd
  return base === 0 ? 0 : ((current - base) / base) * 100
})

const worldShare = computed(() => {
  const worldAtYear = TRADE_DATA.reduce((sum, country) => {
    const s = getCountryYearlySeries(country).find(p => p.year === selectedYear.value)
    return sum + (s?.exports.usd ?? 0)
  }, 0)
  return worldAtYear === 0 ? 0 : (selectedYearData.value.exports.usd / worldAtYear) * 100
})

const tradeConnections = computed(() => getTradeConnections(c.value.iso3, String(selectedYear.value)))

const usdSeries    = computed(() => series.value.map(p => ({ year: p.year, value: p.exports.usd })))
const weightSeries = computed(() => series.value.map(p => ({ year: p.year, value: p.exports.weight })))
</script>