<template>
  <PageWindow :title="String(year)">
    <div class="flex flex-col gap-2 h-full">

      <!-- Row 0: historical context -->
      <div class="shrink-0 bg-[#071828] rounded-xl px-3 py-2 border border-[#2d6bb5]/20">
        <p class="text-xs text-[#93c5fd]/65 leading-relaxed">
          <span class="font-semibold text-[#93c5fd]/80">Historical context: </span>{{ snapshot.historicalNote }}
        </p>
      </div>

      <!-- Row 1: top-level stats -->
      <div class="grid grid-cols-4 gap-2 shrink-0">

        <StatCard
          title="Total Imports"
          :value="formatUsd(snapshot.totalImports.usd)"
          color="blue"
          :subtitle="formatWeight(snapshot.totalImports.weight)"
        />

        <StatCard
          title="Total Exports"
          :value="formatUsd(snapshot.totalExports.usd)"
          color="orange"
          :subtitle="formatWeight(snapshot.totalExports.weight)"
        />

        <!-- Comparison year (expandable → pick year + navigate) -->
        <StatCard
          title="vs. Another Year"
          :value="formatGrowth(diffPercent)"
          :color="diffPercent >= 0 ? 'green' : 'red'"
          :subtitle="`Compared to ${compareYear}`"
          :subtitle-click="() => nav.push(`/years/${compareYear}`, String(year))"
          expandable
          clickable
        >
          <div class="mt-1 flex flex-col gap-1.5">
            <YearSlider v-model="compareYear" />
            <button
              @click.stop="nav.push(`/years/${compareYear}`, String(year))"
              class="text-xs text-blue-300 hover:text-blue-200 hover:underline text-center transition-colors"
            >
              → Open {{ compareYear }}
            </button>
          </div>
        </StatCard>

        <!-- Balance -->
        <StatCard
          title="Trade Balance"
          :value="formatUsd(snapshot.totalExports.usd - snapshot.totalImports.usd)"
          :color="(snapshot.totalExports.usd - snapshot.totalImports.usd) >= 0 ? 'orange' : 'blue'"
          subtitle="Exports − Imports"
        />

      </div>

      <!-- Row 2: grouped bar charts (fills remaining height) -->
      <div class="flex-1 min-h-0 flex flex-col gap-2">

        <!-- USD / Weight toggle -->
        <div class="flex items-center gap-2 shrink-0">
          <span class="text-xs text-[#93c5fd]/55">Show:</span>
          <button
            @click="metric = 'usd'"
            :class="metric === 'usd'
              ? 'bg-[#2d6bb5] text-white'
              : 'bg-[#071828] text-[#93c5fd]/60 hover:bg-[#1a3a5c] border border-[#2d6bb5]/30'"
            class="text-xs px-2.5 py-1 rounded-md transition-colors font-medium"
          >$ USD</button>
          <button
            @click="metric = 'weight'"
            :class="metric === 'weight'
              ? 'bg-[#2d6bb5] text-white'
              : 'bg-[#071828] text-[#93c5fd]/60 hover:bg-[#1a3a5c] border border-[#2d6bb5]/30'"
            class="text-xs px-2.5 py-1 rounded-md transition-colors font-medium"
          >⚖ Weight</button>
        </div>

        <!-- Charts -->
        <div class="grid grid-cols-2 gap-2 flex-1 min-h-0">

          <!-- Top categories grouped bar chart -->
          <div class="bg-[#071828] rounded-xl p-3 flex flex-col border border-[#2d6bb5]/20">
            <h3 class="text-xs font-semibold text-[#93c5fd]/55 uppercase tracking-wide mb-2 shrink-0">Top Categories</h3>
            <div class="flex-1 min-h-0">
              <D3GroupedBarChart
                :data="categoriesChartData"
                :format-value="metric === 'usd' ? formatUsd : formatWeight"
                :on-bar-click="d => nav.push(`/categories/${d.id}`, String(year))"
              />
            </div>
          </div>

          <!-- Top countries grouped bar chart -->
          <div class="bg-[#071828] rounded-xl p-3 flex flex-col border border-[#2d6bb5]/20">
            <h3 class="text-xs font-semibold text-[#93c5fd]/55 uppercase tracking-wide mb-2 shrink-0">Top Countries</h3>
            <div class="flex-1 min-h-0">
              <D3GroupedBarChart
                :data="countriesChartData"
                :format-value="metric === 'usd' ? formatUsd : formatWeight"
                :on-bar-click="d => nav.push(`/countries/${d.id}`, String(year))"
              />
            </div>
          </div>

        </div>
      </div>


    </div>
  </PageWindow>
</template>

<script setup lang="ts">
import { TRADE_DATA, YEARS } from '~/utils/dummyData'
import { getYearSnapshot } from '~/utils/tradeExtended'
import { formatUsd, formatWeight, formatGrowth } from '~/utils/formatters'
import { useNavHistory } from '~/composables/useNavHistory'
import type { GroupedBarDatum } from '~/components/d3/GroupedBarChart.vue'

definePageMeta({ layout: 'canvas' })

const route = useRoute()
const nav   = useNavHistory()

const year = computed(() => parseInt(route.params.slug as string))

if (!YEARS.includes(year.value)) await navigateTo('/')

const snapshot = computed(() => getYearSnapshot(year.value))

// ── Compare year ───────────────────────────────────────────────────────────

const compareYear     = ref(year.value > (YEARS[0] ?? 1988) ? year.value - 1 : (YEARS[1] ?? 1989))
const compareSnapshot = computed(() => getYearSnapshot(compareYear.value))

const diffPercent = computed(() => {
  const current = snapshot.value.totalImports.usd + snapshot.value.totalExports.usd
  const compare = compareSnapshot.value.totalImports.usd + compareSnapshot.value.totalExports.usd
  return compare === 0 ? 0 : ((current - compare) / compare) * 100
})

// ── USD / Weight toggle ────────────────────────────────────────────────────

const metric = ref<'usd' | 'weight'>('usd')

// ── Categories grouped bar chart ───────────────────────────────────────────

const categoriesChartData = computed<GroupedBarDatum[]>(() => {
  // Merge top import + export categories, keyed by name
  const map = new Map<string, {
    id: string; label: string
    importUsd: number; exportUsd: number
    importWeight: number; exportWeight: number
  }>()

  snapshot.value.topImportCategories.forEach(c => {
    if (!map.has(c.name))
      map.set(c.name, { id: c.id, label: c.name, importUsd: 0, exportUsd: 0, importWeight: 0, exportWeight: 0 })
    map.get(c.name)!.importUsd = c.usd
  })

  snapshot.value.topExportCategories.forEach(c => {
    if (!map.has(c.name))
      map.set(c.name, { id: c.id, label: c.name, importUsd: 0, exportUsd: 0, importWeight: 0, exportWeight: 0 })
    map.get(c.name)!.exportUsd = c.usd
  })

  // Weight: aggregate from TRADE_DATA.byCategory (total-period approximation)
  map.forEach((val, name) => {
    val.importWeight = TRADE_DATA.reduce((s, c) => s + (c.byCategory[name]?.imports.weight ?? 0), 0)
    val.exportWeight = TRADE_DATA.reduce((s, c) => s + (c.byCategory[name]?.exports.weight ?? 0), 0)
  })

  return [...map.values()]
    .sort((a, b) => (b.importUsd + b.exportUsd) - (a.importUsd + a.exportUsd))
    .slice(0, 8)
    .map(d => ({
      id: d.id,
      label: d.label,
      imports: metric.value === 'usd' ? d.importUsd : d.importWeight,
      exports: metric.value === 'usd' ? d.exportUsd : d.exportWeight,
    }))
})

// ── Countries grouped bar chart ────────────────────────────────────────────

const countriesChartData = computed<GroupedBarDatum[]>(() =>
  TRADE_DATA
    .map(c => {
      const ys = c.series.find(s => s.year === year.value)
      return {
        id: c.iso3.toLowerCase(),
        label: c.name,
        imports: metric.value === 'usd' ? (ys?.imports.usd ?? 0) : (ys?.imports.weight ?? 0),
        exports: metric.value === 'usd' ? (ys?.exports.usd ?? 0) : (ys?.exports.weight ?? 0),
      }
    })
    .sort((a, b) => (b.imports + b.exports) - (a.imports + a.exports))
    .slice(0, 8)
)
</script>